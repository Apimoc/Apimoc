import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { load } from "cheerio";
import { build } from "esbuild";

/**
 * Packs the built site into ONE self-contained HTML file, for previewing
 * somewhere that can only host a single page.
 *
 * This is a preview artifact, not the deployment. The real site is a
 * multi-page static build; here every route's markup is inlined and swapped
 * by a small router, Astro's ClientRouter is dropped (it fetches real URLs),
 * and the fonts are embedded as data URIs. Everything else, including the
 * WebGL stack and the whole reveal system, is the real code.
 *
 * Usage:  node scripts/single-file.mjs [outFile]
 */

const OUT = process.argv[2] ?? "preview.html";
const DIST = "dist";

const ROUTES = [
  ["/", "dist/index.html"],
  ["/about", "dist/about/index.html"],
  ["/experience", "dist/experience/index.html"],
  ["/work", "dist/work/index.html"],
  ["/work/case-study-one", "dist/work/case-study-one/index.html"],
  ["/work/case-study-two", "dist/work/case-study-two/index.html"],
  ["/work/case-study-three", "dist/work/case-study-three/index.html"],
  ["/credentials", "dist/credentials/index.html"],
  ["/journal", "dist/journal/index.html"],
  ["/journal/first-post", "dist/journal/first-post/index.html"],
  ["/journal/second-post", "dist/journal/second-post/index.html"],
  ["/contact", "dist/contact/index.html"],
  ["/404", "dist/404.html"],
];

const cssFiles = new Set();
const scriptFiles = new Set();
const inlineScripts = new Set();
const pages = new Map();

for (const [route, file] of ROUTES) {
  if (!existsSync(file)) continue;
  const $ = load(readFileSync(file, "utf8"));

  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href?.startsWith("/")) cssFiles.add(join(DIST, href));
  });

  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    // ClientRouter navigates by fetching real URLs, which cannot work inside
    // a single file. Our own router replaces it below.
    if (src?.startsWith("/") && !src.includes("ClientRouter")) {
      scriptFiles.add(join(DIST, src));
    }
  });

  /* Astro inlines the small component scripts (theme toggle, mobile menu,
     email assembly, contact form, journal filter) as <script type="module">
     with no src. They are self-contained, so they are collected and re-emitted
     rather than bundled. Dropping them along with the src scripts is what
     silently killed the theme toggle on the first attempt. */
  $('script[type="module"]:not([src])').each((_, el) => {
    const code = $(el).html();
    if (code?.trim()) inlineScripts.add(code.trim());
  });

  $("script").remove();
  pages.set(route, {
    title: $("title").text(),
    body: $("body").html() ?? "",
  });
}

/* --- CSS, with the fonts embedded ---------------------------------------- */
let css = [...cssFiles].map((f) => readFileSync(f, "utf8")).join("\n");

css = css.replace(/url\(\s*["']?(\/fonts\/[^"')]+)["']?\s*\)/g, (whole, path) => {
  const file = join(DIST, path);
  if (!existsSync(file)) return whole;
  const b64 = readFileSync(file).toString("base64");
  return `url("data:font/woff2;base64,${b64}")`;
});

/* --- JavaScript, bundled into one IIFE with dynamic imports inlined ------ */
const tmp = mkdtempSync(join(tmpdir(), "single-"));
const entry = join(tmp, "entry.js");
writeFileSync(
  entry,
  [...scriptFiles].map((f) => `import ${JSON.stringify(resolve(f))};`).join("\n"),
);

const bundled = await build({
  entryPoints: [entry],
  bundle: true,
  format: "iife",
  minify: true,
  write: false,
  target: "es2022",
  // Keeps everything, including the 3D island behind its dynamic import, in
  // this one file. Nothing may be fetched at runtime.
  splitting: false,
  legalComments: "none",
  /* Astro's preload helper resolves chunk URLs off import.meta, which has no
     meaning in an IIFE. Left alone it throws inside the 3D island's dynamic
     import, the mount's catch swallows it, and the page silently shows the
     fallback forever. There are no separate chunks to preload here anyway. */
  define: { "import.meta.url": '"https://preview.invalid/"' },
});

const js = bundled.outputFiles[0].text;

/* --- The router ----------------------------------------------------------
   Stands in for ClientRouter. Swaps the inlined markup for a route and
   re-dispatches astro:page-load, which is what every component in this
   project already listens for, so all the wiring re-runs exactly as it does
   on the real site. */
const router = `
(function () {
  var pages = window.__PAGES__;
  var main = function () { return document.body; };

  function render(route, push) {
    var page = pages[route] || pages["/404"];
    document.body.innerHTML = page.body;
    document.title = page.title;
    if (push) history.replaceState(null, "", "#" + route);
    window.scrollTo(0, 0);
    // Every component re-wires from this event, same as on the real site.
    document.dispatchEvent(new Event("astro:page-load"));
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("a[href^='/']");
    if (!link) return;
    var href = link.getAttribute("href");
    if (href.indexOf("/fonts/") === 0 || href.indexOf("/og/") === 0) return;
    // Downloads and feeds are not part of this preview.
    if (/\\.(pdf|xml|txt|png|svg|ico)$/.test(href)) { event.preventDefault(); return; }
    event.preventDefault();
    render(href.replace(/\\/$/, "") || "/", true);
  });

  window.addEventListener("hashchange", function () {
    render(location.hash.slice(1) || "/", false);
  });

  /* The initial dispatch has to wait for DOMContentLoaded. The component
     scripts are type="module" and therefore deferred, so they register their
     astro:page-load listeners AFTER this classic script runs. Firing straight
     away means the theme toggle and the mobile menu never get wired. */
  function start() {
    if (location.hash.length > 1) render(location.hash.slice(1), false);
    else document.dispatchEvent(new Event("astro:page-load"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    setTimeout(start, 0);
  }
})();
`;

/* --- Assemble ------------------------------------------------------------ */
const home = load(readFileSync("dist/index.html", "utf8"));

// The CSP meta carries hashes of the original scripts; the bundle has
// different content and the policy would block it.
home('meta[http-equiv="content-security-policy"]').remove();
// Fonts are embedded now, so preloading a path that no longer resolves would
// just log two 404s.
home('link[rel="preload"][as="font"]').remove();
home('link[rel="stylesheet"]').remove();
home("script").remove();
home('link[rel="canonical"], link[rel="alternate"]').remove();
home('meta[property^="og:"], meta[name^="twitter:"]').remove();

home("head").append(`<style>${css}</style>`);

const themeScript = readFileSync("src/lib/theme-script.js", "utf8")
  .match(/themeInitScript = `([\s\S]*?)`;/)?.[1];

const payload = JSON.stringify(Object.fromEntries(pages));

home("body").append(
  `<script>window.__PAGES__ = ${payload.replace(/<\/script/gi, "<\\/script")};</script>`,
  `<script>${js}</script>`,
  // The inlined component scripts, deduplicated across routes.
  ...[...inlineScripts].map((code) => `<script type="module">${code}</script>`),
  `<script>${router}</script>`,
);

if (themeScript) {
  home("head").prepend(`<script>${themeScript}</script>`);
}

/* Artifact hosts wrap the file in their own doctype/head/body skeleton, so
   in that mode emit a fragment: the styles, the page markup, and the scripts,
   with no document tags of our own. */
const html = process.env.FRAGMENT
  ? [
      // Runs during parse, before any content paints, same job as on the
      // real site. The host may also stamp data-theme on the root element;
      // both write the same attribute, so the two cooperate.
      themeScript ? `<script>${themeScript}</script>` : "",
      `<style>${css}</style>`,
      home("body").html() ?? "",
    ].join("\n")
  : home.html();

writeFileSync(OUT, html);

console.log(
  `\n  ${OUT}  ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB` +
    `\n  ${pages.size} routes, ${cssFiles.size} stylesheets, ${scriptFiles.size} bundled + ${inlineScripts.size} inline scripts` +
    `\n  JS bundle ${(Buffer.byteLength(js) / 1024).toFixed(0)} kB uncompressed\n`,
);
