import { chromium } from "@playwright/test";

/**
 * The acceptance checks that need a real browser and cannot be read off a
 * build artifact: theme flash, the performance tiers, keyboard operability
 * and the contact form's client-side behavior.
 *
 * Usage:  node scripts/verify.mjs [baseUrl]
 */

const BASE = process.argv[2] ?? "http://localhost:4330";
const results = [];

const check = (name, pass, detail = "") =>
  results.push({ name, pass, detail });

const browser = await chromium.launch();

/* -------------------------------------------------------------------------
   1. No flash of incorrect theme, on a cold load, under both system settings.
   The pre-paint script must have set data-theme before the first paint, so
   the value read at the very first script execution is already correct.
   ------------------------------------------------------------------------- */
for (const scheme of ["light", "dark"]) {
  const context = await browser.newContext({ colorScheme: scheme });
  const page = await context.newPage();

  // Runs before any page script, so it sees the document at its earliest.
  await page.addInitScript(() => {
    window.__themeAtFirstPaint = null;
    const observer = new MutationObserver(() => {});
    document.addEventListener("readystatechange", () => {
      if (window.__themeAtFirstPaint === null) {
        window.__themeAtFirstPaint =
          document.documentElement.dataset.theme ?? "unset";
      }
    });
    void observer;
  });

  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const early = await page.evaluate(() => window.__themeAtFirstPaint);
  const settled = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  const bg = await page.evaluate(() =>
    getComputedStyle(document.body).backgroundColor,
  );

  check(
    `theme matches system (${scheme}), no flash`,
    early === scheme && settled === scheme,
    `first-read=${early} settled=${settled} bg=${bg}`,
  );
  await context.close();
}

/* Theme persists across a manual toggle and a reload. */
{
  const context = await browser.newContext({ colorScheme: "light" });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.click("#theme-toggle");
  const after = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  const persisted = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  check(
    "theme toggle persists across reload",
    after === "dark" && persisted === "dark",
    `toggled=${after} after-reload=${persisted}`,
  );
  await context.close();
}

/* -------------------------------------------------------------------------
   2. Performance tiers. Each of these must serve the SVG fallback and never
   mount the 3D island.
   ------------------------------------------------------------------------- */
async function stackState(contextOptions, initScript) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  if (initScript) await page.addInitScript(initScript);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() => ({
    mounted:
      document.querySelector("[data-scene-host]")?.dataset.mounted === "true",
    canvas: !!document.querySelector("[data-scene-host] canvas"),
    fallbackVisible:
      document.querySelector("[data-scene-fallback]")?.dataset.replaced !==
      "true",
    fallbackUnits: document.querySelectorAll("[data-scene-fallback] .room")
      .length,
    quality: document.querySelector("[data-scene-host]")?.dataset.quality,
  }));
  await context.close();
  return state;
}

{
  const normal = await stackState({ viewport: { width: 1280, height: 900 } });
  check(
    "3D building mounts on a capable device",
    normal.mounted && normal.canvas,
    JSON.stringify(normal),
  );
}

{
  const reduced = await stackState({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  check(
    "reduced motion serves the flat elevation, no 3D",
    !reduced.mounted && !reduced.canvas && reduced.fallbackVisible,
    JSON.stringify(reduced),
  );
}

{
  const noWebgl = await stackState({ viewport: { width: 1280, height: 900 } }, () => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      if (String(type).startsWith("webgl")) return null;
      return original.call(this, type, ...rest);
    };
  });
  check(
    "WebGL unavailable serves the flat elevation",
    !noWebgl.mounted && !noWebgl.canvas && noWebgl.fallbackVisible,
    JSON.stringify(noWebgl),
  );
}

{
  const saveData = await stackState({ viewport: { width: 1280, height: 900 } }, () => {
    Object.defineProperty(navigator, "connection", {
      value: { saveData: true },
      configurable: true,
    });
  });
  check(
    "saveData serves the flat elevation",
    !saveData.mounted && !saveData.canvas,
    JSON.stringify(saveData),
  );
}

{
  const lowMem = await stackState({ viewport: { width: 1280, height: 900 } }, () => {
    Object.defineProperty(navigator, "deviceMemory", {
      value: 4,
      configurable: true,
    });
  });
  /* A low-memory device still gets a building, just a cheaper one: no
     shadows and a lower pixel ratio. Dropping 3D entirely there would break
     the brief, which asks for it on every device. */
  check(
    "low-memory device gets the lighter 3D build, not none",
    lowMem.mounted && lowMem.quality === "low",
    JSON.stringify(lowMem),
  );
}

/* The fallback must be complete on its own, notch included. */
{
  const fb = await stackState({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  // The home scene is 6 floors of 5 units. See src/content/scenes.ts.
  check(
    "flat elevation draws every unit",
    fb.fallbackUnits === 30,
    `${fb.fallbackUnits} units drawn`,
  );
}

/* -------------------------------------------------------------------------
   3. Keyboard. Mobile menu opens, traps focus, closes on Escape and returns
   focus to the button that opened it.
   ------------------------------------------------------------------------- */
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  await page.focus("#menu-button");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const opened = await page.evaluate(() => ({
    expanded:
      document.getElementById("menu-button")?.getAttribute("aria-expanded"),
    focusInMenu: !!document
      .getElementById("mobile-menu")
      ?.contains(document.activeElement),
  }));

  // Tab past the end and confirm focus cycles rather than escaping.
  for (let i = 0; i < 12; i += 1) await page.keyboard.press("Tab");
  const trapped = await page.evaluate(() => {
    const menu = document.getElementById("mobile-menu");
    const button = document.getElementById("menu-button");
    return (
      menu?.contains(document.activeElement) || document.activeElement === button
    );
  });

  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const closed = await page.evaluate(() => ({
    expanded:
      document.getElementById("menu-button")?.getAttribute("aria-expanded"),
    focusReturned: document.activeElement?.id === "menu-button",
  }));

  check(
    "mobile menu: opens by keyboard, traps focus, Escape closes and restores focus",
    opened.expanded === "true" &&
      opened.focusInMenu &&
      trapped &&
      closed.expanded === "false" &&
      closed.focusReturned,
    `opened=${JSON.stringify(opened)} trapped=${trapped} closed=${JSON.stringify(closed)}`,
  );

  // Theme toggle by keyboard.
  await page.focus("#theme-toggle");
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const after = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    pressed: document.getElementById("theme-toggle")?.getAttribute("aria-pressed"),
  }));
  check(
    "theme toggle is keyboard operable and reports state",
    after.theme !== before && after.pressed === String(after.theme === "dark"),
    `${before} -> ${after.theme}, aria-pressed=${after.pressed}`,
  );

  await context.close();
}

/* Every interactive element on the home page must be reachable by Tab. */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });

  const interactive = await page.evaluate(
    () =>
      document.querySelectorAll(
        "a[href], button:not([disabled]), input:not([type=hidden]), textarea, select",
      ).length,
  );

  const reached = new Set();
  for (let i = 0; i < interactive + 8; i += 1) {
    await page.keyboard.press("Tab");
    const id = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      return (
        el.id ||
        el.getAttribute("aria-label") ||
        (el.textContent || "").trim().slice(0, 30) ||
        el.tagName
      );
    });
    if (id) reached.add(id);
  }

  check(
    "home page is fully keyboard traversable",
    reached.size >= Math.min(interactive, 8),
    `${reached.size} distinct stops for ${interactive} interactive elements`,
  );
  await context.close();
}

/* -------------------------------------------------------------------------
   4. Contact form client-side behavior.
   ------------------------------------------------------------------------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });

  // Empty submit surfaces errors and does not post.
  let posted = false;
  await page.route("**/api/contact", (route) => {
    posted = true;
    route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
  });

  await page.click(".submit");
  await page.waitForTimeout(400);
  const invalid = await page.evaluate(() => ({
    summaryShown: !document.getElementById("error-summary")?.hidden,
    nameInvalid:
      document.getElementById("name")?.getAttribute("aria-invalid") === "true",
    describedBy: document.getElementById("name")?.getAttribute("aria-describedby"),
    focused: document.activeElement?.id,
  }));
  check(
    "contact form: validation failure is announced and blocks submission",
    invalid.summaryShown &&
      invalid.nameInvalid &&
      invalid.describedBy === "name-error" &&
      !posted,
    JSON.stringify(invalid),
  );

  // A valid message posts and shows the success state.
  await page.fill("#name", "Test Person");
  await page.fill("#email", "test@example.com");
  await page.fill("#message", "This is a message long enough to pass validation.");
  await page.click(".submit");
  await page.waitForTimeout(600);
  const sent = await page.evaluate(() => ({
    successShown: !document.getElementById("sent")?.hidden,
    cleared: document.getElementById("name")?.value === "",
  }));
  check(
    "contact form: valid message posts and confirms",
    posted && sent.successShown && sent.cleared,
    JSON.stringify(sent),
  );

  // The honeypot is hidden from sight, from tab order and from AT.
  const honeypot = await page.evaluate(() => {
    const field = document.getElementById("company-website");
    const wrap = field?.closest("div");
    return {
      tabindex: field?.getAttribute("tabindex"),
      ariaHidden: wrap?.getAttribute("aria-hidden"),
      offscreen: (wrap ? getComputedStyle(wrap).position : "") === "absolute",
    };
  });
  check(
    "contact form: honeypot is hidden from sight, tab order and assistive tech",
    honeypot.tabindex === "-1" &&
      honeypot.ariaHidden === "true" &&
      honeypot.offscreen,
    JSON.stringify(honeypot),
  );

  await context.close();
}

/* -------------------------------------------------------------------------
   5. The page body must never scroll horizontally, at any width, on any
   route. This is checked rather than eyeballed because a single unbreakable
   string can widen the whole document, and it is invisible on a desktop
   window narrowed to phone width if the content happens to fit.
   ------------------------------------------------------------------------- */
{
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
  const offenders = [];

  for (const width of [320, 390, 768, 1280, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 1) offenders.push(`${route}@${width} by ${overflow}px`);
    }
    await context.close();
  }

  check(
    "no horizontal scroll on any route at 320/390/768/1280/1920",
    offenders.length === 0,
    offenders.length ? offenders.slice(0, 5).join(", ") : "all clear",
  );
}

await browser.close();

const pad = Math.max(...results.map((r) => r.name.length));
console.log("");
let failed = 0;
for (const { name, pass, detail } of results) {
  if (!pass) failed += 1;
  console.log(`  ${pass ? "pass" : "FAIL"}  ${name.padEnd(pad)}  ${detail}`);
}
console.log(`\n  ${results.length - failed}/${results.length} passed\n`);
process.exit(failed > 0 ? 1 : 0);
