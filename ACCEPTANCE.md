# Acceptance checklist

Measured results, with the commands that produce them. Every number here came
out of a tool, not an estimate.

Two sets of Lighthouse numbers are reported, because the site is currently
half-configured on purpose and that changes two of the four scores. Both are
shown rather than only the flattering one.

---

## Lighthouse, mobile, home page

Run against the built output. `astro preview` serves everything uncompressed,
which Cloudflare Pages does not, so the compressed column is the representative
one.

| | Uncompressed | **Compressed (as deployed)** |
|---|---|---|
| Performance | 97 | **100** |
| Accessibility | 100 | **100** |
| Best practices | 100 | **100** |
| SEO | 100 | **100** |

With the config placeholders still unfilled, SEO measures **58**. The two
failing audits are `is-crawlable` and `meta-description`, both of which are
placeholder-driven: while `siteUrlIsReal` is `false` the site sets `noindex`
and `robots.txt` disallows everything, and the meta description is omitted
rather than published as `TODO:`. Filling in `src/content/site.ts` takes it to
100 with no code change. That is the deliberate design, not a defect.

### Core Web Vitals

| Metric | Target | Measured |
|---|---|---|
| LCP | under 2.0 s | **1.7 s** |
| CLS | under 0.05 | **0** |
| TBT | proxy for INP | **30 ms** |
| FCP | | 1.2 s |
| Speed Index | | 1.2 s |
| Time to Interactive | | 1.9 s |

**LCP element is the headline text, not the canvas**, as required. Measured
directly with a `PerformanceObserver`:

```
{ "t": 172, "tag": "H1", "cls": "t-display headline",
  "text": "Write the one sentence that makes the case, here." }
```

INP cannot be measured without real interaction traffic; TBT at 30 ms is the
lab proxy and is far inside the 200 ms budget.

---

## axe-core: 0 violations

```
npm run audit:a11y -- http://localhost:4321
```

```
axe-core: 0 violations across all routes, both themes.
Total violations: 0
```

Ten routes (`/`, `/about`, `/experience`, `/work`, `/work/[slug]`,
`/credentials`, `/journal`, `/journal/[slug]`, `/contact`, `/404`), in light and
dark, plus the mobile menu in its open state. Tags: `wcag2a`, `wcag2aa`,
`wcag21a`, `wcag21aa`, `wcag22aa`.

One violation was found and fixed during the pass: the "Optional" label on the
contact form carried `opacity: 0.8`, which dropped `--ink-muted` from 5.84:1 to
roughly 4.4:1. The opacity was removed rather than the color changed.

---

## Contrast, re-measured

```
npm run audit:contrast
```

```
LIGHT
  token          on paper    on paper-raised   floor   result
  ink             13.06:1    14.27:1             4.5   pass
  ink-muted        5.35:1     5.84:1             4.5   pass
  brass            5.07:1     5.54:1             4.5   pass
  umber            9.22:1    10.07:1               3   pass

DARK
  ink             14.63:1    13.51:1             4.5   pass
  ink-muted        6.23:1     5.75:1             4.5   pass
  brass            7.69:1     7.10:1             4.5   pass
  umber            1.41:1     1.31:1               3   exempt (decorative)

All pairs meet their floor.
```

Every ratio matches the brief's corrected table exactly, which confirms both
corrections in it:

- `--brass` at `#7E5B18` measures **5.07:1** on paper. The original `#8A6420`
  measures 4.39:1 and would have failed for inline link text.
- Dark `--umber` measures **1.41:1**. It is used only for decorative hairlines,
  which SC 1.4.11 exempts. Anything a user must see to operate resolves to
  `--line-ui`, which is `--ink-muted` in dark at 6.23:1. Verified in the form
  field borders on `/contact`.

---

## JavaScript budget

```
npm run audit:budget
```

| Route | Eager JS, gzipped | Budget |
|---|---|---|
| `/` | 10.6 kB | pass |
| `/contact` | 11.3 kB | pass |
| `/journal` | 9.5 kB | pass |
| every other route | 9.2 kB | pass |

Budget is 50 kB. **Before optimization every route measured 54.6 kB**, over
budget, because GSAP, ScrollTrigger and SplitText were statically imported by
the base layout and therefore in the chunk every route loads. Moving the
animation layer behind a dynamic import took it to 9.2 kB.

Deferred, never on the critical path:

| Chunk | Gzipped | Loaded when |
|---|---|---|
| `OccupancyStack` (three.js + R3F) | 228.8 kB | Home only, after idle, only if the tier check passes |
| `react-dom/client` | 54.2 kB | With the above |
| `gsap` | 26.5 kB | After interactive, and never under reduced motion |
| `ScrollTrigger` | 17.0 kB | With gsap |
| `lenis` | 5.3 kB | Desktop pointer devices only |
| `SplitText` | 3.2 kB | With gsap |

A visitor with `prefers-reduced-motion: reduce` downloads **none** of it.

---

## Screenshots

```
npm run shots -- http://localhost:4321
```

80 files in `screenshots/`: 10 routes × 4 widths (390, 768, 1280, 1920) × 2
themes. Full-page, with the page scrolled through first so scroll reveals have
fired.

Four bugs were found by looking at these and fixed:

1. **The SVG fallback and the 3D canvas rendered stacked, not overlaid.** Astro
   scopes styles per component and does not extend a parent's scope to a child
   component's root element, so `.viewport > *` never matched the fallback.
   Fixed with explicit `:global()` targeting and absolute positioning.
2. **The canvas rendered at a fraction of its box.** R3F's wrapper divs do not
   inherit a height. Fixed by giving `.host > *` an explicit 100%.
3. **The notch had a stray lit unit in its outer corner.** The fill order left
   the remainder at the top right instead of the inner edge. Rewritten to cut
   from the corner inward, so the remainder forms a stepped setback.
4. **Unlit units rendered pure black in dark mode**, reading as holes punched
   through the lattice, which is the exact failure Part C flagged. Two causes:
   the unlit albedo was raw umber, and the lights were colored with `--paper`,
   which on the dark theme is `#17120E` and emits almost nothing. Both fixed.

---

## Browser verification

```
npm run verify -- http://localhost:4321
```

```
pass  theme matches system (light), no flash          first-read=light settled=light
pass  theme matches system (dark), no flash           first-read=dark  settled=dark
pass  theme toggle persists across reload             toggled=dark after-reload=dark
pass  3D island mounts on a capable device            mounted=true canvas=true
pass  reduced motion serves the SVG fallback, no 3D   mounted=false canvas=false
pass  WebGL unavailable serves the SVG fallback       mounted=false canvas=false
pass  saveData serves the SVG fallback                mounted=false canvas=false
pass  deviceMemory 4 or below serves the fallback     mounted=false canvas=false
pass  SVG fallback draws the full lattice             153 unit rects
pass  mobile menu: keyboard, focus trap, Escape       restores focus to the button
pass  theme toggle is keyboard operable               light -> dark, aria-pressed=true
pass  home page is fully keyboard traversable         15 stops / 21 elements
pass  contact form: validation announced, blocks send summary shown, aria-describedby set
pass  contact form: valid message posts and confirms  success shown, fields cleared
pass  contact form: honeypot hidden from AT           tabindex=-1, aria-hidden=true
pass  no horizontal scroll, 320/390/768/1280/1920    all clear, 10 routes x 5 widths

16/16 passed
```

**No flash of incorrect theme**, verified on a cold load under both system
settings: the theme read at the earliest observable moment already matches, so
the pre-paint script has run before first paint. It is hashed into the CSP from
the same exported string it is rendered from, so the hash cannot drift.

Two real bugs were found here:

- Five components called their init function immediately **and** on
  `astro:page-load`, binding every handler twice. One click on the theme
  toggle fired both copies and landed back where it started. Fixed in all five.
- The page scrolled horizontally at every width below about 580px. The header
  logotype had `white-space: nowrap` and, as a flex item without `min-width:
  0`, refused to shrink, widening the whole document. A 390px screenshot came
  out 578px wide, which is how it was caught. The logotype now truncates with
  an ellipsis, and the check above guards against it returning.

### Frame rate

The render loop is paused when the canvas leaves the viewport or the tab is
hidden (IntersectionObserver plus `visibilitychange`), DPR is clamped to 1.75,
and the lattice is a single `InstancedMesh` with one draw call whose instance
matrices are written once and never updated per frame. Per-frame CPU work is
one camera position lerp.

**Not verified on real mobile hardware.** This environment is a headless
container with software rendering, so a 60 fps claim on a throttled mobile CPU
would be an assertion, not a measurement. The structural work is done and the
draw call count is verifiable; the frame rate needs a physical device.

---

## Contact form

```
npm run test:contact
```

The Pages Function is driven directly with real `FormData`, with Turnstile and
Resend stubbed at the `fetch` boundary.

```
pass  valid message is accepted and handed to Resend
pass  reply-to is the sender, so a reply reaches them
pass  rejects missing name / missing email / malformed email
pass  rejects empty message / too short / too long
pass  rejects missing turnstile token
pass  honeypot: rejected silently, nothing delivered
pass  failed Turnstile check blocks delivery
pass  rate limits repeated sends from one IP        blocked on attempt 6
pass  missing Resend configuration returns an error, not a false success

13/13 passed
```

The honeypot returns 200 so a bot cannot learn it was caught and retry with the
field blank, but nothing is delivered.

**End-to-end delivery is not verified**, because it needs real Turnstile and
Resend credentials, which do not exist yet. The handler's logic is covered;
the live send needs testing once the accounts are set up.

---

## Type checking

```
npm run check
```

```
Result (40 files):
- 0 errors
- 0 warnings
- 0 hints
```

Cloudflare Workers types are scoped to `functions/` with its own tsconfig.
Pulling them into the site's program replaces the DOM globals and breaks
ordinary browser code such as `document.body.prepend`. That folder type-checks
separately and is also clean.

---

## Build fails clearly on invalid content

Changed `pubDate: "2026-01-15"` to `pubDate: "January 15th 2026"`:

```
[InvalidContentEntryDataError] journal → first-post data does not match
collection schema.

  pubDate: pubDate must be a date in YYYY-MM-DD form, for example
           2026-03-04. Wrap it in quotes.
```

It names the collection, the file, the field, and what the field wants. A
second case, `units: 0`, produces: *"units must be greater than zero. Delete
the units line entirely if the role has no unit count."*

---

## Every string traces to a content file

```
npm run audit:strings
```

```
Every visible string in the build traces to a content file.
```

This works from the built HTML rather than from source, which is the only way
to catch a stray label: a string can hide in a component, but not in a rendered
page. It found one leak, the `←` and `→` typed into the case study and journal
pagers, now part of the label text in `ui.ts`.

One deliberate exception, documented in `COPY-REVIEW.md`: purely decorative
arrows generated by CSS `::after` on "read more" links. A screen reader never
announces them, so they are presentation rather than copy.

---

## Cross-browser

**Chromium verified.** All automated checks above ran in Chromium 1194.

**Firefox, Safari, Edge and iOS Safari are not verified.** This container has
no Firefox or WebKit build and no Apple hardware, so any claim about them would
be untested. What has been done for them structurally:

- `dvh` is not relied on; layout uses `aspect-ratio` and intrinsic sizing.
- `env(safe-area-inset-*)` is applied to the body, header and footer for the
  iOS notch and home indicator.
- No WebGPU, so no Safari renderer gap. WebGL only.
- `color-mix(in oklab, …)` is used in two places; supported in Safari 16.2+,
  Firefox 113+.
- `text-wrap: balance` is progressive: unsupported browsers get normal
  wrapping.
- Touch devices never get Lenis, so native scroll momentum is untouched.

Open `dist/` on a real iPhone before launch. It is the one platform in the
brief's list most likely to surface something, and the one this environment
cannot stand in for.

---

## Summary against the brief

| Requirement | Status |
|---|---|
| Lighthouse mobile 95+ / 100 / 100 / 100 | **100 / 100 / 100 / 100** |
| LCP under 2.0 s, element is text | **1.7 s, `<h1>`** |
| CLS under 0.05 | **0** |
| INP under 200 ms | TBT 30 ms; needs field data for true INP |
| axe-core zero violations | **0**, 10 routes × 2 themes |
| Contrast matches Part B | **exact match**, all 16 pairs |
| Screenshots 390/768/1280/1920, both themes | **80 files** |
| No flash of incorrect theme | **verified**, both system settings |
| Fallback on no-WebGL and reduced motion | **verified**, all four triggers |
| 60 fps on throttled mobile CPU | structurally done, **needs a real device** |
| Full keyboard traversal | **verified**, incl. menu and toggle |
| Contact form: send, validation, spam | **13/13 on the handler**; live send needs credentials |
| Build fails clearly on bad frontmatter | **verified** |
| Every string in a content file | **verified from the build output** |
| JS under 50 kB per route | **9.2 kB** |
| Renders in Chrome/Safari/Firefox/Edge/iOS | **Chromium only**; see above |
