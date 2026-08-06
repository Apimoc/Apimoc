# Personal CV, portfolio and journal

A production site for a multi-site property manager: CV, case studies, a
journal, and a contact form. Static, self-hosted fonts, no third-party
trackers, deployed to Cloudflare Pages.

The content is intentionally **blank templates**. The machine is finished; the
CV itself is filled in by editing files under `src/content/`. See
[`PLACEHOLDERS.md`](PLACEHOLDERS.md) for what is outstanding and
[`CONTENT.md`](CONTENT.md) for how to fill it in without using a terminal.

- [`ACCEPTANCE.md`](ACCEPTANCE.md) — measured results against the brief
- [`COPY-REVIEW.md`](COPY-REVIEW.md) — every line of copy written rather than supplied

---

## Requirements

- **Node 22 or newer.** Astro 7 requires it.
- Python 3 with `fonttools`, only if you re-subset the fonts.

## Running locally

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

```bash
npm run build      # static site into dist/
npm run preview    # serve the built output
npm run check      # TypeScript and Astro diagnostics
```

The build prints a list of anything in `src/content/site.ts` still unfilled,
and fails with a plain-English message if a content file has a bad field.

---

## Architecture

| Layer | Choice | Version |
|---|---|---|
| Framework | Astro, static output | 7.1.6 |
| Islands | React | 19.2.8 |
| 3D | three.js + React Three Fiber | 0.185.1 / 9.7.0, **WebGL only** |
| Animation | GSAP + ScrollTrigger + SplitText | 3.15.0 |
| Smooth scroll | Lenis, desktop pointer devices only | 1.3.26 |
| Styling | Tailwind CSS, CSS-first config | 4.3.3 |
| Content | Astro content collections + MDX, Zod 4 | built in |
| Hosting | Cloudflare Pages | |
| Forms | Pages Function + Turnstile + Resend | |

R3F 9 does not fully support the three.js WebGPU renderer, so the canvas is
WebGL only and does not probe for one.

### Where things live

```
src/
  content/           EVERY user-facing string starts here
    site.ts            name, contact, feature switches, the stack's numbers
    theme.ts           home page section order
    ui.ts              button labels, empty states, form errors
    home/ experience/ work/ credentials/ journal/    MDX
  content.config.ts  Zod 4 schemas, with messages a non-developer can act on
  styles/
    tokens.css         the ONLY file containing a hex color
    global.css         type roles, layout primitives
    prose.css          journal only, and where Literata is declared
  components/        Astro components, plus the one React island
  layouts/           Base, Page, and the journal post layout
  lib/               motion, tiering, stack geometry, OG rendering
  pages/             routes
functions/api/       Cloudflare Pages Function for the contact form
scripts/             the measurement tools listed below
```

### Three decisions worth knowing about

**The animation layer is dynamically imported.** GSAP, ScrollTrigger and
SplitText together are about 46 kB gzipped, which is the entire per-route
budget on its own. They load after the page is interactive, and the
reduced-motion check happens *before* the import, so a visitor who has asked
for less motion downloads no animation library at all. This is what keeps
every route at 9.2 kB instead of 54.6 kB.

**The 3D building is on every route and still never on the critical path.**
Each page shows a cutaway apartment building that turns as you scroll: floor
plates, party walls, balcony railings and a door number on every unit, with
occupied units lit from within. It is generated in code, not imported: the
brick, stucco and concrete are procedural canvas textures, and the environment
lighting is built from emissive planes rather than a downloaded HDRI, because
nothing may be fetched from another host.

The flat elevation of the same building is server-rendered and ships in the
HTML, so it carries the first paint. The React island replaces it only after
the main thread goes idle, only when the canvas is near the viewport, and only
on devices that pass a tier check. Weak devices get a lighter build (no
shadows, lower pixel ratio) rather than nothing. Reduced motion, saveData and
no-WebGL keep the flat drawing, which is a finished piece of design rather
than a degraded state.

Per-page building size, occupancy and rotation live in
`src/content/scenes.ts`, one line per route.

**The Content Security Policy is generated, not hand-written.** Astro hashes
every inline script at build time and emits the policy as a meta element. The
one inline script the site needs, the pre-paint theme switch, is exported from
`src/lib/theme-script.js` and both injected and hashed from that single string,
so the hash cannot drift from the content. There is no `unsafe-inline` for
scripts anywhere.

`frame-ancestors` cannot be delivered via a meta element, so that single
directive lives in `public/_headers` with the other security headers.

---

## Deploying to Cloudflare Pages

### 1. Connect the repository

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to
Git**.

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `22` (set `NODE_VERSION=22` if the default is older) |

The `functions/` directory at the repository root is picked up automatically
and served alongside the static output, so the contact form works without
turning the site into a server-rendered app.

### 2. Set environment variables

**Settings → Environment variables.** Add these to both Production and Preview.

| Variable | Secret? | Value |
|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | No | Turnstile site key. Public by design |
| `TURNSTILE_SECRET_KEY` | **Yes** | Turnstile secret key |
| `RESEND_API_KEY` | **Yes** | Resend API key |
| `CONTACT_FROM` | No | A verified sender, e.g. `site@yourdomain.com` |
| `CONTACT_TO` | No | Where messages arrive |

Only `PUBLIC_TURNSTILE_SITE_KEY` reaches the browser. The rest are read inside
the Pages Function and never leave the server.

Get the Turnstile keys from **Turnstile → Add site**. Get the Resend key from
`resend.com`, after verifying the sending domain.

### 3. Rate limiting, optional

The form limits each IP to five messages an hour when a KV namespace is bound.
Create one under **Workers & Pages → KV**, then bind it to the Pages project
with the variable name `RATE_LIMIT`. Without it the form still works and every
other spam control still applies; only the per-IP cap is skipped.

### 4. Point the domain

Add the custom domain under **Custom domains**, then set the real address in
`src/content/site.ts`:

```ts
export const siteUrl = "https://yourdomain.com";
export const siteUrlIsReal = true;
```

Until that second line is `true`, `robots.txt` disallows everything and every
page is `noindex`. This is deliberate: it stops a half-configured site being
indexed under `example.com`.

### 5. Analytics, optional

Cloudflare Web Analytics is cookieless and needs no banner. Enable it under
**Web Analytics**, then set the token in `site.ts` and `features.analytics` to
`true`.

---

## Checks

All of these print measured numbers rather than pass/fail assertions.

```bash
npm run audit:contrast   # every color pair in both themes, measured
npm run audit:budget     # JavaScript per route, gzipped
npm run audit:strings    # proves no user-facing string is hardcoded
npm run test:contact     # the contact handler, including every spam path
```

These four need the built site being served. Build, serve `dist/`, then:

```bash
npm run audit:a11y  -- http://localhost:4321   # axe-core, all routes, both themes
npm run verify      -- http://localhost:4321   # theme, tiering, keyboard, form
npm run shots       -- http://localhost:4321   # 390/768/1280/1920, both themes
```

`npm run verify` covers the things only a real browser can answer: that there
is no flash of the wrong theme, that each of the four fallback triggers
actually serves the SVG, that the mobile menu traps focus and restores it on
Escape, and that the contact form announces its errors.

### Single-file preview

```bash
npm run build
npm run preview:single -- preview.html
```

Packs the whole site into one self-contained HTML file, for showing it
somewhere that can only host a single page. Every route's markup is inlined
and swapped by a small router, the fonts are embedded as data URIs, and the
JavaScript is bundled into one IIFE with the dynamic imports inlined so
nothing is fetched at runtime.

It is a **preview, not the deployment**. Three things differ from the real
build, and none of them should be measured for performance:

- Astro's `ClientRouter` is dropped, because it navigates by fetching real
  URLs. The replacement re-dispatches `astro:page-load`, which is what every
  component here already listens for, so the wiring re-runs identically.
- Fonts are embedded rather than served as separate cacheable files.
- The CSP meta element is stripped: its hashes describe the original chunks,
  not the rebundled one.

Add `FRAGMENT=1` to emit markup with no `<html>`, `<head>` or `<body>`
wrapper, for hosts that supply their own document skeleton.

### Re-subsetting the fonts

Only needed if the design starts using a weight or optical size outside the
current ranges.

```bash
pip install fonttools brotli
npm run fonts
```

This narrows the variable axis ranges and the character set, taking the two
preloaded files from 96 kB to 74 kB. It writes into `public/fonts/`.

---

## Measured results

Lighthouse mobile, home page, served with compression as Cloudflare does:

| | |
|---|---|
| Performance | 99 |
| Accessibility | 100 |
| Best practices | 100 |
| SEO | 100 |
| LCP | 2.0 s, and the LCP element is the `<h1>` text |
| CLS | 0 |
| axe-core violations | 0, across 10 routes in both themes |
| JavaScript per route | 10.6 kB gzipped, against a 50 kB budget |

Full detail, including the numbers with the config still unfilled, is in
[`ACCEPTANCE.md`](ACCEPTANCE.md).

---

## Licensing

GSAP, including SplitText and the other former Club plugins, has been free for
commercial use since April 2025 under Webflow. Fraunces, Instrument Sans and
Literata are all SIL Open Font License. All three are self-hosted; the site
makes no request to a font CDN.
