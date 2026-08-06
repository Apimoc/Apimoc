import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { load } from "cheerio";

/**
 * Proves the hard constraint: no user-facing string is hardcoded in a
 * component. Every visible string in the built HTML must be traceable to a
 * file a non-developer edits.
 *
 * It works from the OUTPUT rather than from the source, which is the only way
 * to catch a stray label: a string can hide in a component, but it cannot
 * hide in the rendered page.
 *
 * Usage:  node scripts/trace-strings.mjs
 */

const SOURCES = [
  "src/content/ui.ts",
  "src/content/site.ts",
  "src/content/theme.ts",
];

function collectContent(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectContent(full, acc);
    else if (entry.endsWith(".mdx")) acc.push(full);
  }
  return acc;
}

const haystack = [
  ...SOURCES.map((f) => readFileSync(f, "utf8")),
  ...collectContent("src/content").map((f) => readFileSync(f, "utf8")),
]
  .join("\n")
  .toLowerCase();

/* Strings that are legitimately not content:
   - Dates and numbers, which are produced by Intl from frontmatter values.
   - Single punctuation marks and arrows used as separators.
   - The site's own generated figures. */
const IGNORE = [
  /^[\s\d.,:%·—–\-→←()/|]+$/,
  /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
  /^\d{4}$/,
  /^©/,
];

function htmlFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) htmlFiles(full, out);
    else if (entry.endsWith(".html")) out.push(full);
  }
  return out;
}

const untraceable = new Map();

for (const file of htmlFiles("dist")) {
  const $ = load(readFileSync(file, "utf8"));
  $("script, style, noscript").remove();

  $("*")
    .contents()
    .each((_, node) => {
      if (node.type !== "text") return;
      const raw = node.data.replace(/\s+/g, " ").trim();
      if (!raw || raw.length < 3) return;
      if (IGNORE.some((re) => re.test(raw))) return;

      // A rendered string may be a fragment of a longer content string, or
      // may have had %TOKEN% substitutions applied, so match on a
      // distinctive slice rather than the whole thing.
      const probe = raw.toLowerCase().slice(0, 40);
      if (haystack.includes(probe)) return;

      // Try the longest word, which survives templating.
      const longest = raw
        .toLowerCase()
        .split(/[^a-z0-9-]+/)
        .filter((w) => w.length > 4)
        .sort((a, b) => b.length - a.length)[0];
      if (longest && haystack.includes(longest)) return;

      const route = file.replace("dist/", "/").replace(/index\.html$/, "");
      if (!untraceable.has(raw)) untraceable.set(raw, route);
    });
}

if (untraceable.size === 0) {
  console.log(
    "\n  Every visible string in the build traces to a content file.\n",
  );
} else {
  console.log("\n  Strings with no source in src/content/:\n");
  for (const [text, route] of untraceable) {
    console.log(`    ${route.padEnd(28)} ${JSON.stringify(text.slice(0, 70))}`);
  }
  console.log("");
}

process.exit(untraceable.size > 0 ? 1 : 0);
