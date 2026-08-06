import { readFileSync } from "node:fs";

/**
 * Re-measures every foreground/background pair in tokens.css against WCAG 2.2
 * and prints the ratios. Run this after touching the palette: several pairs
 * sit close to the threshold and a small nudge can push one under.
 *
 * Usage:  node scripts/contrast.mjs
 */

const css = readFileSync("src/styles/tokens.css", "utf8");

function scope(selector) {
  const start = css.indexOf(selector);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  const body = css.slice(open, close);
  const out = {};
  for (const [, name, hex] of body.matchAll(
    /--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g,
  )) {
    out[name] = hex;
  }
  return out;
}

const channel = (v) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = channel((n >> 16) & 255);
  const g = channel((n >> 8) & 255);
  const b = channel(n & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const FOREGROUNDS = ["ink", "ink-muted", "brass", "umber"];
const BACKGROUNDS = ["paper", "paper-raised"];

// The floor each token has to clear, and why.
const FLOORS = {
  ink: [4.5, "body text"],
  "ink-muted": [4.5, "secondary text"],
  brass: [4.5, "inline links and focus rings"],
  umber: [3.0, "decorative rules only, non-text"],
};

let failures = 0;

for (const [label, selector] of [
  ["LIGHT", ":root"],
  ["DARK", '[data-theme="dark"]'],
]) {
  const tokens = scope(selector);
  console.log(`\n${label}`);
  console.log("  token          on paper    on paper-raised   floor   result");

  for (const fg of FOREGROUNDS) {
    const [floor, why] = FLOORS[fg];
    const values = BACKGROUNDS.map((bg) => ratio(tokens[fg], tokens[bg]));
    // umber in dark is decorative only, and is exempted deliberately.
    const decorative = fg === "umber" && label === "DARK";
    const worst = Math.min(...values);
    const pass = decorative || worst >= floor;
    if (!pass) failures += 1;

    console.log(
      `  ${fg.padEnd(14)} ${values[0].toFixed(2).padStart(6)}:1   ` +
        `${values[1].toFixed(2).padStart(6)}:1        ` +
        `${String(floor).padStart(4)}   ` +
        (decorative ? "exempt (decorative, --line-ui used instead)" : pass ? "pass" : "FAIL"),
    );
    if (!pass) console.log(`      ^ used for ${why}`);
  }
}

console.log(
  failures === 0
    ? "\nAll pairs meet their floor.\n"
    : `\n${failures} pair(s) below floor.\n`,
);
process.exit(failures > 0 ? 1 : 0);
