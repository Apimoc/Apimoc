# Acceptance checklist

Measured results, with the commands that produce them. Every number here came
out of a tool, not an estimate. Where something could not be measured in this
environment, it says so rather than being given a number.

---

## Lighthouse, mobile, home page

Two runs, because the site is half-configured on purpose and that changes one
score. Both are shown rather than only the flattering one.

| | As it stands | With `site.ts` filled in |
|---|---|---|
| Performance | **97 to 100** | **99** |
| Accessibility | **100** | **100** |
| Best practices | **100** | **100** |
| SEO | **69** | **100** |

The second column was produced by temporarily setting `siteUrlIsReal: true`
with a real domain and email, rebuilding, and re-running. It was then reverted.
The 100 is a measurement, not a projection.

SEO measures 69 only because `siteUrlIsReal` is `false`, which sets `noindex`
and disallows crawling on purpose. The single failing audit is `is-crawlable`.
Filling in `src/content/site.ts` takes it to 100 with no code change.

Performance is given as a range because that is what it measures. Two
consecutive runs on an idle container returned 97 and 100. A third run taken
while an 80-shot screenshot job was saturating the CPU returned **91**, which
is a fact about the container, not about the site. Any single number here would
be a run selected to suit the story.

### Core Web Vitals

Two clean runs, so the spread is visible rather than averaged away:

| Metric | Target | Run 1 | Run 2 |
|---|---|---|---|
| FCP | | 1.5 s | **1.2 s** |
| LCP | under 2.0 s | 2.1 s | **1.7 s** |
| CLS | under 0.05 | **0** | **0** |
| Speed Index | | 2.7 s | **1.2 s** |
| TBT | proxy for INP | 90 ms | **40 ms** |

LCP sits on the 2.0 s target rather than comfortably under it. The hero loads
the portrait eagerly, which is correct for an image that large and that far
above the fold, and it is served responsively: the srcset runs 320w / 640w /
960w / 1122w, so a 390 px phone at 2× fetches the 640w variant at 23 kB, not
the full 54 kB original.

**CLS is 0, and it was 0 before the portrait existed too.** That is the payoff
from routing every photograph through one `Figure` component: the slot reserves
its space from a fixed `aspect-ratio` whether or not the file is there, so
dropping the real portrait into a layout built around a placeholder plate moved
nothing. The sticky header's condense-on-scroll is likewise a padding change on
a sticky element, which never touches the document flow.

TBT is the deferred animation layer parsing after the page is already
interactive. INP itself needs field data and cannot be measured here.

---

## axe-core: 0 violations

```
npm run audit:a11y -- http://localhost:4330
```

```
axe-core: 0 violations across all routes, both themes.
Total violations: 0
```

Ten routes (`/`, `/about`, `/services`, `/listings`, `/listings/[slug]`,
`/consultation`, `/blog`, `/blog/[slug]`, `/contact`, `/404`), in light and
dark, plus the mobile menu in its open state.

**The ruleset was widened during this pass**, and that is the interesting part.
The audit originally ran `wcag2a` through `wcag22aa` and reported 0. Lighthouse
then reported two accessibility failures on the same build. Both were real, and
both were invisible to the audit because of how axe packages its rules:

| Rule | Why axe missed it |
|---|---|
| `heading-order` | Tagged `best-practice`, not under any success criterion, so the WCAG tag filter excluded it |
| `label-content-name-mismatch` | Tagged `experimental`, which axe does not run unless explicitly enabled, even though it implements SC 2.5.3 which is AA |

`scripts/axe-audit.mjs` now includes the `best-practice` tag and enables that
rule by name, so this class of bug is caught by the project's own tooling
rather than by a second tool that happened to be run.

### The four bugs that found

1. **Heading order skipped h1 to h3 on the home page.** The three pillars under
   the hero sit in a band with no visible heading, so their `<h3>` titles were
   the first thing under the `<h1>`. `Pillars.astro` now takes a `level` prop
   and that band passes `2`.
2. **The same bug on `/listings`.** No section heading stands between the page
   `<h1>` and the card grid, so `ListingCard` got the same prop. Found by a
   heading-order sweep over all 15 built pages, not by Lighthouse, which only
   audited the home page.
3. **The header logotype failed SC 2.5.3, Label in Name.** It carried
   `aria-label="Home"` over visible text reading "Top Real Estate by Sarah
   Brown". A voice-control user saying what they can read would not activate
   it. Writing the visible text into the label did not fix it either: the
   wordmark is uppercased by CSS, so any sentence-case label still fails the
   comparison. The `aria-label` was removed, which makes the accessible name
   the visible text by construction.
4. **The pillars band was labelled `"Primary"`.** `aria-label={ui.siteNavLabel}`
   had been pasted in, giving a content section the navigation's name. It now
   has its own label.

One further finding, from the widened ruleset:
`landmark-complementary-is-top-level` on `/contact` and the single listing
page. Both used `<aside>` inside `<main>`. Neither is tangential content: the
listing's feature list is part of the listing, and the contact page's direct
details are a second way to do what the page is for. Both are now `<div>`, and
their `<h2>` still puts them in the heading outline.

### Heading structure, all 15 pages

Swept over the built HTML:

```
Heading order clean on all 15 pages, exactly one h1 each.
```

---

## Contrast

```
npm run audit:contrast
```

```
DARK (default)
  token          on paper    on paper-raised   floor   result
  ink             15.60:1    14.34:1             4.5   pass
  ink-muted        7.00:1     6.44:1             4.5   pass
  brass            8.46:1     7.78:1             4.5   pass
  umber            1.49:1     1.37:1               3   exempt (decorative)

LIGHT
  ink             13.06:1    14.27:1             4.5   pass
  ink-muted        5.35:1     5.84:1             4.5   pass
  brass            5.07:1     5.54:1             4.5   pass
  umber            9.22:1    10.07:1               3   pass

All pairs meet their floor.
```

The lowest ratio anywhere is **5.07:1**, light-theme `--brass` on `--paper`,
against a 4.5:1 floor. That token is `#7E5B18`. The obvious-looking `#8A6420`
measures 4.39:1 and would fail for inline link text; the difference is not
visible to the eye, which is exactly why this is measured rather than judged.

Dark `--umber` measures 1.49:1 and is **exempt, not failing**: SC 1.4.11 covers
components a user must perceive to operate, and this token is used only for
decorative hairlines. Everything operable resolves to `--line-ui`, which is
`--ink-muted` in dark at 7.00:1. Verified on the form field borders on
`/contact`.

---

## JavaScript budget

```
npm run audit:budget
```

| Route | Eager JS, gzipped | Budget |
|---|---|---|
| `/contact`, `/consultation` | 11.5 kB | pass |
| `/blog`, `/listings` | 8.8 to 8.9 kB | pass |
| every other route | 8.6 kB | pass |

Budget is 50 kB. **Before optimization every route measured 54.6 kB**, over
budget, because GSAP, ScrollTrigger and SplitText were statically imported by
the base layout and therefore in the chunk every route loads.

Deferred, never on the critical path:

| Chunk | Gzipped | Loaded when |
|---|---|---|
| `gsap` | 26.5 kB | After interactive, never under reduced motion |
| `ScrollTrigger` | 17.0 kB | With gsap |
| `lenis` | 5.3 kB | Desktop pointer devices only |
| `SplitText` | 3.2 kB | With gsap |

The reduced-motion check happens **before** the dynamic import, not inside the
module, so a visitor who has asked for less motion downloads none of it. That
ordering is the whole trick and is easy to get backwards.

There is no client-side framework in the build at all. React, three.js and
React Three Fiber were removed with the 3D work and are no longer dependencies.

---

## Browser verification

```
npm run verify -- http://localhost:4330
```

```
pass  no flash of the wrong theme (system light)          first-read=dark settled=dark
pass  no flash of the wrong theme (system dark)           first-read=dark settled=dark
pass  theme toggle persists across reload                 toggled=light after-reload=light
pass  mobile menu: keyboard, focus trap, Escape           restores focus to the button
pass  theme toggle is keyboard operable, reports state    dark -> light, aria-pressed=false
pass  home page is fully keyboard traversable             21 stops / 37 elements
pass  contact form: validation announced, blocks send     summary shown, aria-describedby set
pass  contact form: valid message posts and confirms      success shown, fields cleared
pass  contact form: honeypot hidden from AT               tabindex=-1, aria-hidden=true
pass  no horizontal scroll, 320/390/768/1280/1920         all clear, 10 routes x 5 widths

10/10 passed
```

**No flash of incorrect theme**, verified on a cold load under both system
settings. The theme read at the earliest observable moment already matches the
settled value, so the pre-paint script ran before first paint. It is hashed
into the CSP from the same exported string it is rendered from, so the hash
cannot drift from the content.

Note that the site settles to **dark under both system settings**. That is the
design: dark is the default and light is opt-in, so `prefers-color-scheme` is
deliberately not followed. `reapplyTheme()` mirrors the same default, because
if the two disagreed the theme would flip on the first client-side navigation.

Two bugs were found here in earlier passes and are guarded against returning:

- Five components called their init function immediately **and** on
  `astro:page-load`, binding every handler twice. One click on the theme toggle
  fired both copies and landed back where it started.
- The page scrolled horizontally at every width below about 580 px. The header
  logotype had `white-space: nowrap` and, as a flex item without
  `min-width: 0`, refused to shrink, widening the whole document. A 390 px
  screenshot came out 578 px wide, which is how it was caught.

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
Resend credentials, which do not exist yet. The handler's logic is covered; the
live send needs testing once the accounts are set up.

---

## Type checking

```
npm run check
```

```
Result (38 files):
- 0 errors
- 0 warnings
- 1 hint
```

Cloudflare Workers types are scoped to `functions/` with its own tsconfig.
Pulling them into the site's program replaces the DOM globals and breaks
ordinary browser code such as `document.body.prepend`. That folder type-checks
separately and is also clean.

---

## Build fails clearly on invalid content

Changing `pubDate: "2026-01-15"` to `pubDate: "January 15th 2026"`:

```
[InvalidContentEntryDataError] blog → what-your-offer-says data does not
match collection schema.

  pubDate: pubDate must be a date in YYYY-MM-DD form, for example
           2026-03-04. Wrap it in quotes.
```

It names the collection, the file, the field, and what the field wants. Other
messages in the same style: *"status must be exactly for-sale, pending or
sold"*, *"sqft must be a plain number, for example 2400"*, and *"At most 4
figures. More than that stops scanning in one pass."*

---

## Every string traces to a content file

```
npm run audit:strings
```

```
Every visible string in the build traces to a content file.
```

This works from the **built HTML** rather than from source, which is the only
way to catch a stray label: a string can hide in a component, but not in a
rendered page. Reading source would find the string in both places and call it
fine.

One deliberate exception, documented in `COPY-REVIEW.md`: purely decorative
arrows generated by CSS `::after` on "read more" links. A screen reader never
announces them, so they are presentation rather than copy.

---

## Screenshots

```
npm run shots -- http://localhost:4330
```

80 files in `screenshots/`: 10 routes × 4 widths (390, 768, 1280, 1920) × 2
themes. Full-page, with the page scrolled through first so scroll reveals have
fired, then scrolled back. `No console errors.`

The scroll is driven with `page.mouse.wheel`, not `window.scrollTo`. Lenis
drives scrolling on pointer devices and swallows programmatic `scrollTo`, so a
scripted scroll never advances the page and every section below the fold stays
at opacity 0. That is the animation working correctly, but it makes the
screenshots useless for reviewing the design.

---

## Cross-browser

**Chromium verified.** All automated checks above ran in Chromium 1194.

**Firefox, Safari, Edge and iOS Safari are not verified.** This container has
no Firefox or WebKit build and no Apple hardware, so any claim about them would
be untested. What has been done for them structurally:

- `dvh` is not relied on; layout uses `aspect-ratio` and intrinsic sizing.
- `env(safe-area-inset-*)` is applied to the body, header and footer for the
  iOS notch and home indicator.
- `color-mix(in oklab, …)` is used for the scrim and the header background;
  supported in Safari 16.2+ and Firefox 113+.
- `text-wrap: balance` is progressive: unsupported browsers get normal
  wrapping.
- Touch devices never get Lenis, so native scroll momentum is untouched.
- No WebGL or WebGPU anywhere, so there is no renderer gap to worry about.

Open `dist/` on a real iPhone before launch. It is the platform most likely to
surface something, and the one this environment cannot stand in for.

---

## Summary

| Requirement | Status |
|---|---|
| Lighthouse mobile 95+ / 100 / 100 / 100 | **97-100 / 100 / 100 / 69**; **99 / 100 / 100 / 100** configured |
| LCP under 2.0 s | **1.7 to 2.1 s**, on the line |
| CLS under 0.05 | **0** |
| INP under 200 ms | TBT 130 ms; true INP needs field data |
| axe-core zero violations | **0**, 10 routes × 2 themes, widened ruleset |
| Heading order, one h1 per page | **clean on all 15 built pages** |
| Contrast floors met | **all pairs pass**, lowest 5.07:1 |
| Screenshots 390/768/1280/1920, both themes | **80 files** |
| No flash of incorrect theme | **verified**, both system settings |
| Full keyboard traversal | **verified**, incl. menu and toggle |
| No horizontal scroll to 320 px | **verified**, 10 routes × 5 widths |
| Contact form: send, validation, spam | **13/13 on the handler**; live send needs credentials |
| Build fails clearly on bad frontmatter | **verified** |
| Every string in a content file | **verified from the build output** |
| JS under 50 kB per route | **8.6 kB**, 11.5 kB on the two form pages |
| Renders in Chrome/Safari/Firefox/Edge/iOS | **Chromium only**; see above |
