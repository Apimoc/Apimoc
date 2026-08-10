# Real estate agent website

A ten-page site for a residential real estate agent: services, listings, a
consultation booking page, an about page, a blog, and a contact form. Static,
self-hosted fonts, no third-party trackers, deployed to Cloudflare Pages.

The layout, copy and section structure are finished, and the portrait is in
place. What is not filled in is the personal detail: email address, phone,
social links, the real domain, and two remaining photographs (the hero
background and the guidebook cover). See [`PLACEHOLDERS.md`](PLACEHOLDERS.md)
for that list and
[`CONTENT.md`](CONTENT.md) for how to work through it without using a terminal.

- [`ACCEPTANCE.md`](ACCEPTANCE.md) — measured results, not claimed ones
- [`COPY-REVIEW.md`](COPY-REVIEW.md) — every line of copy, and where it came from

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

## The ten pages

| Route | What it is |
|---|---|
| `/` | Landing page. Eleven sections, reorderable from one array |
| `/services` | The four services, each with its own file |
| `/listings` | Featured listings index |
| `/listings/[slug]` | A single listing, with specs, gallery and enquiry link |
| `/consultation` | Booking form: enquiry type, timeline, message |
| `/about` | Longer biography, the figures, credentials |
| `/contact` | Form, email, phone, office address, social links |
| `/blog` | Post index with tag filtering |
| `/blog/[slug]` | A post |
| `/404` | Not found |

Plus `/blog/rss.xml`, `/robots.txt`, `/sitemap-index.xml`, and a generated
Open Graph image per page under `/og/`.

---

## Architecture

| Layer | Choice | Version |
|---|---|---|
| Framework | Astro, static output | 7.1.6 |
| Animation | GSAP + ScrollTrigger + SplitText | 3.15.0 |
| Smooth scroll | Lenis, desktop pointer devices only | 1.3.26 |
| Styling | Tailwind CSS, CSS-first config | 4.3.3 |
| Content | Astro content collections + MDX, Zod 4 | built in |
| OG images | Satori + sharp, at build time | 0.29 / 0.34.4 |
| Hosting | Cloudflare Pages | |
| Forms | Pages Function + Turnstile + Resend | |

There is no client-side framework. Every page is server-rendered HTML; the
only JavaScript is the theme toggle, the mobile menu, the tag filter, the
contact form and the scroll reveals.

### Where things live

```
src/
  content/           EVERY user-facing string starts here
    site.ts            name, contact, feature switches, SEO defaults
    theme.ts           home page section order, motion, listing counts
    ui.ts              button labels, empty states, form errors, page headings
    home/              one MDX file per landing page section
    services/ listings/ testimonials/ blog/    MDX
  content.config.ts  Zod 4 schemas, with messages a non-developer can act on
  styles/
    tokens.css         the ONLY file containing a hex color
    global.css         type roles, layout primitives
    prose.css          blog only, and where Literata is declared
  components/        Astro components
  layouts/           Base and Page
  lib/               motion, formatting, OG rendering, token parsing
  pages/             routes
functions/api/       Cloudflare Pages Function for the contact form
scripts/             the measurement tools listed below
```

### Three decisions worth knowing about

**The animation layer is dynamically imported.** GSAP, ScrollTrigger and
SplitText together are about 46 kB gzipped, which is most of the per-route
budget on its own. They load after the page is interactive, and the
reduced-motion check happens *before* the import, so a visitor who has asked
for less motion downloads no animation library at all. This is what keeps
every route at 8.6 kB instead of 54.6 kB.

**Every photograph goes through one component.** `Figure.astro` owns the arch
crop, the aspect ratio and the unfilled state. When a photo is missing it
draws a designed plate at exactly the right shape rather than collapsing, so
the layout you are looking at now is the layout you get once the real photos
land. Adding a photo is dropping a file and flipping one boolean; nothing
shifts.

**The Content Security Policy is generated, not hand-written.** Astro hashes
every inline script at build time and emits the policy as a meta element. The
one inline script the site needs, the pre-paint theme switch, is exported from
`src/lib/theme-script.js` and both injected and hashed from that single string,
so the hash cannot drift from the content. There is no `unsafe-inline` for
scripts anywhere.

`frame-ancestors` cannot be delivered via a meta element, so that single
directive lives in `public/_headers` with the other security headers.

### The theme is dark by default

`:root` holds the dark palette and `[data-theme="light"]` is the override, so
the default state needs no class and cannot flash. The pre-paint script only
switches to light when the visitor has explicitly chosen it. The operating
system preference is deliberately not followed: this is a dark-first design,
and light is opt-in.

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

These three need the built site being served. Build, serve `dist/`, then:

```bash
npm run audit:a11y  -- http://localhost:4321   # axe-core, all routes, both themes
npm run verify      -- http://localhost:4321   # theme, keyboard, form, overflow
npm run shots       -- http://localhost:4321   # 390/768/1280/1920, both themes
```

`npm run verify` covers the things only a real browser can answer: that there
is no flash of the wrong theme, that the choice survives a reload, that the
mobile menu traps focus and restores it on Escape, that the contact form
announces its errors, and that no route scrolls horizontally at any of five
widths down to 320 px.

`npm run audit:strings` works from the **built HTML**, not from source. That is
the only way to catch a label that was hardcoded in a component: reading source
would just find the string in both places and call it fine.

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

This narrows the variable axis ranges and the character set. It writes into
`public/fonts/`.

One useful side effect: subsetting Fraunces to a narrow `opsz` range drops the
`WONK` axis from the file entirely, which locks the wonky serif variant off
structurally. No CSS override is needed, and none can be forgotten.

---

## Measured results

Lighthouse mobile, home page, served with compression as Cloudflare does:

| | |
|---|---|
| Accessibility | 100 |
| Best practices | 100 |
| CLS | 0 |
| axe-core violations | 0, across 10 routes in both themes |
| JavaScript per route | 8.6 kB gzipped, against a 50 kB budget |
| Contrast | every pair passes; lowest is 5.07:1 against a 4.5:1 floor |

Full detail, including why the SEO score is currently held down on purpose, is
in [`ACCEPTANCE.md`](ACCEPTANCE.md).

---

## Licensing

GSAP, including SplitText and the other former Club plugins, has been free for
commercial use since April 2025 under Webflow. Fraunces, Instrument Sans,
Literata and Allura are all SIL Open Font License. All four are self-hosted;
the site makes no request to a font CDN.

The listing photographs, the portrait and the guidebook cover are **not**
supplied. Those slots are empty by design, and `PLACEHOLDERS.md` says where
each file goes.
