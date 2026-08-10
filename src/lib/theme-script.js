/**
 * Single source of truth for the pre-paint theme script.
 *
 * This exact string is BOTH injected into <head> (by Base.astro) and hashed
 * into the Content Security Policy (by astro.config.ts). Keeping one source
 * means the hash can never drift from the rendered content, which is the
 * usual way a hashed inline script quietly breaks in production.
 *
 * It must stay synchronous and dependency-free: it runs before the first
 * paint, and anything slower reintroduces the flash it exists to prevent.
 *
 * THE DEFAULT IS DARK, DELIBERATELY.
 * This is a dark-first brand: the palette, the photography treatment and the
 * brass accent are all designed for the dark ground, and the light theme is
 * a considered alternative rather than the primary. So a visitor with no
 * stored choice gets dark even if their system asks for light. A visitor who
 * uses the toggle gets what they picked, on every page, forever.
 */
export const THEME_STORAGE_KEY = "theme";

export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var e=document.documentElement;var d=s?s!=="light":true;e.dataset.theme=d?"dark":"light";e.style.colorScheme=d?"dark":"light";}catch(_){document.documentElement.dataset.theme="dark";document.documentElement.style.colorScheme="dark";}})();`;
