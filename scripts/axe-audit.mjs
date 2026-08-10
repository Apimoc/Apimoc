import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Runs axe-core over every route in both themes, plus the mobile menu in its
 * open state, which is where focus and labelling problems usually hide.
 *
 * Usage:  node scripts/axe-audit.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:4321";

/* `best-practice` is included alongside the WCAG tags because heading-order
   lives there rather than under a success criterion, and a document that
   jumps h1 to h3 is a real navigation problem for a screen reader user even
   though no SC names it. Both classes of bug were caught this way. */
const TAGS = [
  "wcag2a",
  "wcag2aa",
  "wcag21a",
  "wcag21aa",
  "wcag22aa",
  "best-practice",
];

/* Experimental rules are off by default in axe. This one implements SC 2.5.3
   Label in Name, which is AA, so its default-off state is a packaging
   decision rather than a statement about the criterion. It caught the header
   logotype announcing "Home" over visible text reading the brand name. */
const RULES = { "label-content-name-mismatch": { enabled: true } };

const audit = (page) =>
  new AxeBuilder({ page }).withTags(TAGS).options({ rules: RULES }).analyze();

const ROUTES = [
  "/",
  "/about",
  "/cv",
  "/consultation",
  "/blog",
  "/blog/what-your-offer-says",
  "/404",
];

/* The theme is chosen by localStorage, NOT by prefers-color-scheme: this is a
   dark-first site and the OS preference is deliberately ignored, so passing
   `colorScheme` to the browser context does nothing at all. Setting it that
   way silently audited the dark theme twice and never once looked at light.
   addInitScript runs before the pre-paint script, so the value is already
   there when it reads it. */
const withTheme = (theme) => async (context) => {
  await context.addInitScript((value) => {
    try {
      localStorage.setItem("theme", value);
    } catch (_) {}
  }, theme);
};

const browser = await chromium.launch();
let total = 0;
const failures = [];

for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await withTheme(theme)(context);
  const page = await context.newPage();

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);

    const results = await audit(page);

    total += results.violations.length;
    results.violations.forEach((v) => {
      failures.push(
        `${theme} ${route}  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))\n      ${v.nodes[0]?.html?.slice(0, 140)}`,
      );
    });

    // The mobile menu open, where focus trapping and labelling live.
    if (route === "/") {
      await page.click("#menu-button");
      await page.waitForTimeout(400);
      const open = await audit(page);
      total += open.violations.length;
      open.violations.forEach((v) => {
        failures.push(
          `${theme} / (menu open)  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))\n      ${v.nodes[0]?.html?.slice(0, 140)}`,
        );
      });
    }
  }

  await context.close();
}

await browser.close();

if (failures.length) {
  console.log("\naxe-core violations:\n");
  failures.forEach((f) => console.log("  " + f));
} else {
  console.log("\naxe-core: 0 violations across all routes, both themes.");
}
console.log(`\nTotal violations: ${total}`);
process.exit(total > 0 ? 1 : 0);
