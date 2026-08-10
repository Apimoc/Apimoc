import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

/**
 * Screenshots every route at the four breakpoints in both themes, so the
 * build can actually be looked at rather than assumed.
 *
 * Usage:  node scripts/screenshots.mjs [baseUrl] [outDir]
 */

const BASE = process.argv[2] ?? "http://localhost:4321";
const OUT = process.argv[3] ?? "screenshots";

const WIDTHS = [390, 768, 1280, 1920];
const THEMES = ["light", "dark"];
const ROUTES = [
  ["home", "/"],
  ["about", "/about"],
  ["services", "/services"],
  ["listings", "/listings"],
  ["listing-detail", "/listings/cherry-creek-townhome"],
  ["consultation", "/consultation"],
  ["blog", "/blog"],
  ["blog-post", "/blog/what-your-offer-says"],
  ["contact", "/contact"],
  ["404", "/404"],
];

const only = process.env.ONLY_ROUTE;
const routes = only ? ROUTES.filter(([name]) => name === only) : ROUTES;

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const consoleErrors = [];

for (const theme of THEMES) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: Math.round(width * 0.9) + 300 },
      deviceScaleFactor: 1,
      colorScheme: theme,
      reducedMotion: "no-preference",
    });

    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[${theme} ${width}] ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      consoleErrors.push(`[${theme} ${width}] PAGEERROR ${err.message}`);
    });

    for (const [name, path] of routes) {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });

      /* Scroll the whole page and come back. Scroll reveals only fire when
         their trigger enters the viewport, so a capture taken without
         scrolling shows every below-the-fold section still at opacity 0.
         That is the animation working, not a layout bug, but it makes the
         screenshots useless for reviewing the design. */
      /* Wheel events, not window.scrollTo. Lenis drives scrolling on pointer
         devices and swallows programmatic scrollTo, so a scripted scroll
         never advances the page and nothing below the fold ever reveals. */
      const height = await page.evaluate(() => document.body.scrollHeight);
      const vh = page.viewportSize()?.height ?? 800;
      const steps = Math.ceil(height / 700) + 2;
      for (let i = 0; i < steps; i += 1) {
        await page.mouse.wheel(0, 700);
        await page.waitForTimeout(180);
      }
      await page.waitForTimeout(400);
      await page.mouse.wheel(0, -(height + 2000));
      await page.waitForTimeout(600);

      // Let the reveals settle.
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: `${OUT}/${name}-${width}-${theme}.png`,
        fullPage: true,
      });
    }

    await context.close();
  }
}

await browser.close();

if (consoleErrors.length) {
  console.log("\nConsole errors:");
  [...new Set(consoleErrors)].forEach((e) => console.log("  " + e));
} else {
  console.log("\nNo console errors.");
}
console.log(`\nWrote ${routes.length * WIDTHS.length * THEMES.length} screenshots to ${OUT}/`);
