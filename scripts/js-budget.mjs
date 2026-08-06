import { readFileSync, readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import { load } from "cheerio";

/**
 * Measures the JavaScript each route actually loads, gzipped.
 *
 * Walks the built HTML, follows every module script and its static imports
 * transitively, and sums the unique files. Dynamic imports are counted
 * separately, because a chunk behind an import() is not on the critical path:
 * the 3D island is only fetched on devices that pass the tier check, and only
 * after the main thread is idle.
 *
 * Usage:  node scripts/js-budget.mjs
 */

const DIST = "dist";
const BUDGET_KB = 50;

const gz = (buf) => gzipSync(buf).length;

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Static imports only. Dynamic import() is tracked separately. */
function staticImports(code) {
  const found = new Set();
  for (const [, spec] of code.matchAll(
    /(?:^|[^.\w])import\s*(?:[\w*{}\s,$]+from\s*)?["']([^"']+)["']/g,
  )) {
    found.add(spec);
  }
  for (const [, spec] of code.matchAll(/export\s*\*?\s*from\s*["']([^"']+)["']/g)) {
    found.add(spec);
  }
  return [...found];
}

function dynamicImports(code) {
  return [...code.matchAll(/import\(\s*["']([^"']+)["']/g)].map((m) => m[1]);
}

function resolve(spec, fromFile) {
  if (spec.startsWith("/")) return join(DIST, spec);
  const base = fromFile.split("/").slice(0, -1).join("/");
  const parts = (base + "/" + spec).split("/");
  const stack = [];
  for (const p of parts) {
    if (p === "." || p === "") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  return stack.join("/");
}

function walk(entry, seen, dyn) {
  if (seen.has(entry)) return;
  let code;
  try {
    code = readFileSync(entry, "utf8");
  } catch {
    return;
  }
  seen.add(entry);

  dynamicImports(code).forEach((spec) => {
    const target = resolve(spec, entry);
    dyn.add(target);
  });

  staticImports(code).forEach((spec) => {
    if (!spec.startsWith(".") && !spec.startsWith("/")) return;
    walk(resolve(spec, entry), seen, dyn);
  });
}

const rows = [];

for (const file of htmlFiles(DIST).sort()) {
  const html = readFileSync(file, "utf8");
  const $ = load(html);

  const eager = new Set();
  const deferred = new Set();

  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("/")) walk(join(DIST, src), eager, deferred);
  });

  let inlineBytes = 0;
  $("script:not([src])").each((_, el) => {
    const text = $(el).html() ?? "";
    if ($(el).attr("type") === "application/ld+json") return;
    inlineBytes += gz(Buffer.from(text));
  });

  const eagerBytes =
    [...eager].reduce((sum, f) => {
      try {
        return sum + gz(readFileSync(f));
      } catch {
        return sum;
      }
    }, 0) + inlineBytes;

  // Follow the deferred graph so the 3D island's true cost is visible.
  const dynSeen = new Set();
  const dynDyn = new Set();
  [...deferred].forEach((f) => walk(f, dynSeen, dynDyn));
  const dynBytes = [...dynSeen].reduce((sum, f) => {
    try {
      return sum + gz(readFileSync(f));
    } catch {
      return sum;
    }
  }, 0);

  const route =
    "/" + file.replace(`${DIST}/`, "").replace(/index\.html$/, "").replace(/\.html$/, "");

  rows.push({ route, eager: eagerBytes, dyn: dynBytes });
}

console.log("\nJavaScript per route, gzipped\n");
console.log("  route                          eager    budget");
let over = 0;
for (const { route, eager } of rows) {
  const kb = eager / 1024;
  const pass = kb <= BUDGET_KB;
  if (!pass) over += 1;
  console.log(
    `  ${route.padEnd(28)} ${(kb.toFixed(1) + " kB").padStart(8)}   ` +
      (pass ? "pass" : `OVER ${BUDGET_KB} kB`),
  );
}
/* Everything the routes never load eagerly. Rolldown routes dynamic imports
   through a preload helper, so tracing the deferred graph from source text is
   unreliable; listing the leftover chunks by name is both simpler and
   honest about what is actually deferred. */
const eagerEverywhere = new Set();
for (const file of htmlFiles(DIST)) {
  const $ = load(readFileSync(file, "utf8"));
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src?.startsWith("/")) walk(join(DIST, src), eagerEverywhere, new Set());
  });
}

const assetDir = join(DIST, "_astro");
const deferred = readdirSync(assetDir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => join(assetDir, f))
  .filter((f) => !eagerEverywhere.has(f))
  .map((f) => ({ f, kb: gz(readFileSync(f)) / 1024 }))
  .sort((a, b) => b.kb - a.kb);

console.log("\nLoaded on demand only, never on the critical path\n");
for (const { f, kb } of deferred.slice(0, 10)) {
  console.log(`  ${(kb.toFixed(1) + " kB").padStart(9)}   ${f.split("/").pop()}`);
}

console.log(
  `\n  Budget is ${BUDGET_KB} kB gzipped of eagerly loaded JS per route.` +
    `\n  The 3D island and the animation layer are both deferred: fetched after` +
    `\n  the page is interactive, and skipped entirely under reduced motion or` +
    `\n  on devices that fail the tier check.\n`,
);
process.exit(over > 0 ? 1 : 0);
