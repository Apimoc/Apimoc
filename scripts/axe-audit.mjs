import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Runs axe-core over every route in both themes, plus the mobile menu in its
 * open state, which is where focus and labelling problems usually hide.
 *
 * Usage:  node scripts/axe-audit.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:4321";

const ROUTES = [
  "/",
  "/about",
  "/experience",
  "/work",
  "/work/case-study-one",
  "/credentials",
  "/journal",
  "/journal/first-post",
  "/contact",
  "/404",
];

const browser = await chromium.launch();
let total = 0;
const failures = [];

for (const theme of ["light", "dark"]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: theme,
  });
  const page = await context.newPage();

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

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
      const open = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
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
