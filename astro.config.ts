import { createHash } from "node:crypto";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import { themeInitScript } from "./src/lib/theme-script.js";
import { siteUrl, features, outstandingPlaceholders } from "./src/content/site.ts";

/* --------------------------------------------------------------------------
   The pre-paint theme script is inline, so a strict CSP has to know its hash.
   Both the hash and the injected markup come from the same exported string,
   which is what stops the two drifting apart.
   -------------------------------------------------------------------------- */
const themeScriptHash = `sha256-${createHash("sha256")
  .update(themeInitScript, "utf8")
  .digest("base64")}` as `sha256-${string}`;

/* --------------------------------------------------------------------------
   Surface anything still unfilled, once, at build time. This is a warning
   rather than an error: a half-configured site should still build and be
   previewable, it just should not be able to hide that it is half done.
   -------------------------------------------------------------------------- */
const outstanding = outstandingPlaceholders();
if (outstanding.length > 0) {
  console.log(
    [
      "",
      "  ┌─ Not filled in yet " + "─".repeat(46),
      ...outstanding.map((k) => "  │  " + k),
      "  │",
      "  │  Edit src/content/site.ts. See PLACEHOLDERS.md.",
      "  └" + "─".repeat(66),
      "",
    ].join("\n"),
  );
}

export default defineConfig({
  site: siteUrl,
  output: "static",

  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        // Keep the blog out of the sitemap while it is switched off.
        features.blog || !page.includes("/blog"),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true,
    },
  },

  security: {
    csp: {
      algorithm: "SHA-256",
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        // frame-ancestors is deliberately NOT here: browsers ignore it when
        // it arrives via a meta element, and it logs a console error. It is
        // set as a real response header in public/_headers instead.
        "object-src 'none'",
        // Fonts and images are self-hosted. Nothing external is permitted.
        "font-src 'self'",
        "img-src 'self' data:",
        // Turnstile is the one third party, and only on /contact.
        "frame-src https://challenges.cloudflare.com",
        "connect-src 'self' https://challenges.cloudflare.com",
      ],
      scriptDirective: {
        hashes: [themeScriptHash],
        // Turnstile loads its own script from this origin. Everything else
        // is same-origin and hashed by Astro. No 'unsafe-inline' for scripts.
        // Browsers do not fall back from -elem to script-src, so 'self' has
        // to be stated at element scope explicitly rather than inherited.
        resources: [
          { resource: "'self'", kind: "element" },
          { resource: "https://challenges.cloudflare.com", kind: "element" },
        ],
      },
      styleDirective: {
        // Style ATTRIBUTES only, scoped to style-src-attr, for the handful of
        // inline custom properties the layout sets. <style> elements stay
        // strictly hashed via style-src-elem.
        resources: [
          { resource: "'self'", kind: "element" },
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },

  image: {
    // AVIF and WebP are produced through Astro's pipeline via sharp.
    responsiveStyles: true,
  },

  markdown: {
    // Shiki colors tokens with inline style attributes, which cannot be
    // hashed and would force 'unsafe-inline' into style-src-elem. This site
    // is a CV and a journal, not a technical blog, so the trade is easy:
    // code blocks are styled by prose.css from the palette instead.
    syntaxHighlight: false,
  },

  build: {
    inlineStylesheets: "auto",
  },
});
