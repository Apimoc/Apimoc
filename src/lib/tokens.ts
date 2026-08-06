// Inlined by Vite at build time. Reading it from disk at runtime would
// resolve against the built chunk rather than the source tree.
import css from "../styles/tokens.css?raw";

/**
 * Reads color values back out of tokens.css at build time.
 *
 * A handful of places genuinely cannot use a CSS custom property: the
 * `theme-color` meta tag and the build-time Open Graph image are both
 * consumed outside a stylesheet. Rather than copy hex values into a second
 * file and let the two drift, they are parsed from the stylesheet, which
 * keeps tokens.css the only place a color is ever written.
 */

function block(selector: string): string {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`tokens.css: no ${selector} block found`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  return css.slice(open, close);
}

function readToken(scope: string, name: string): string {
  const match = block(scope).match(
    new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`),
  );
  if (!match?.[1]) {
    throw new Error(`tokens.css: ${scope} has no --${name} hex value`);
  }
  return match[1];
}

/* The 3D scene's material colours, read from the same stylesheet as
   everything else so tokens.css stays the only place a colour is written. */
const materials = (scope: string) => ({
  brickBase: readToken(scope, "mat-brick"),
  mortar: readToken(scope, "mat-mortar"),
  stucco: readToken(scope, "mat-stucco"),
  concrete: readToken(scope, "mat-concrete"),
  roof: readToken(scope, "mat-roof"),
  trim: readToken(scope, "mat-trim"),
});

export const lightTokens = {
  paper: readToken(":root", "paper"),
  paperRaised: readToken(":root", "paper-raised"),
  ink: readToken(":root", "ink"),
  inkMuted: readToken(":root", "ink-muted"),
  brass: readToken(":root", "brass"),
  umber: readToken(":root", "umber"),
  ...materials(":root"),
} as const;

export const darkTokens = {
  paper: readToken('[data-theme="dark"]', "paper"),
  paperRaised: readToken('[data-theme="dark"]', "paper-raised"),
  ink: readToken('[data-theme="dark"]', "ink"),
  inkMuted: readToken('[data-theme="dark"]', "ink-muted"),
  brass: readToken('[data-theme="dark"]', "brass"),
  umber: readToken('[data-theme="dark"]', "umber"),
  ...materials('[data-theme="dark"]'),
} as const;
