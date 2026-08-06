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
 */
export const THEME_STORAGE_KEY = "theme";

export const themeInitScript = `(function(){try{var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s?s==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;var e=document.documentElement;e.dataset.theme=d?"dark":"light";e.style.colorScheme=d?"dark":"light";}catch(_){document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";}})();`;
