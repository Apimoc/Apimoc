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

/* The site is dark by default, so :root holds the DARK values and the light
   theme is the override. Naming them the other way round would read as a bug
   the first time someone opened this file. */
export const darkTokens = {
  paper: readToken(":root", "paper"),
  paperRaised: readToken(":root", "paper-raised"),
  ink: readToken(":root", "ink"),
  inkMuted: readToken(":root", "ink-muted"),
  brass: readToken(":root", "brass"),
  umber: readToken(":root", "umber"),
} as const;

export const lightTokens = {
  paper: readToken('[data-theme="light"]', "paper"),
  paperRaised: readToken('[data-theme="light"]', "paper-raised"),
  ink: readToken('[data-theme="light"]', "ink"),
  inkMuted: readToken('[data-theme="light"]', "ink-muted"),
  brass: readToken('[data-theme="light"]', "brass"),
  umber: readToken('[data-theme="light"]', "umber"),
} as const;
