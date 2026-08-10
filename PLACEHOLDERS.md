# What is not filled in yet

Nothing in this list has been invented. Each value below is a placeholder that
has to be replaced with something real before the site goes live.

The build prints this same list every time it runs, so it cannot be forgotten:

```
  ┌─ Not filled in yet ──────────────────────────────────────────────
  │  contact.emailUser
  │  contact.emailDomain
  │  contact.phone
  │  contact.linkedin
  │  contact.instagram
  │  contact.facebook
  │  contact.office
  │  siteUrl (still https://example.com)
  │  assets.hero (src/assets/hero.jpg)
  │  assets.guidebook (src/assets/guidebook.jpg)
  │
  │  Edit src/content/site.ts. See PLACEHOLDERS.md.
  └──────────────────────────────────────────────────────────────────
```

Everything except the three photographs is in **one file**:
`src/content/site.ts`.

---

## Already filled in

These are set, and are what you see on the site now. Change them in the same
file if any of it is wrong.

| Value | Currently |
|---|---|
| `identity.fullName` | Alexandra Denton |
| `identity.shortName` | Alexandra |
| `identity.signature` | Alexandra D. |
| `identity.brand` | Alexandra Denton |
| `identity.jobTitle` | Real Estate Specialist |
| `identity.location` | Denver, Colorado |

**The portrait is in place.** It is at `src/assets/portrait.jpg` and
`portraitReady` is `true`, so it appears in the hero arch on the landing page
and again in the About section and on `/about`. Replace the file with the same
name to change it; nothing else needs editing.

---

## Required before launch

| Value | Where | Notes |
|---|---|---|
| `contact.emailUser` | `site.ts` | Part before the `@`. Use a dedicated address |
| `contact.emailDomain` | `site.ts` | Part after the `@` |
| `contact.phone` | `site.ts` | Formatted as you want it read, e.g. `(303) 555-0100` |
| `siteUrl` + `siteUrlIsReal` | `site.ts` | The real domain. See below |
| `assets.hero` | `src/assets/hero.jpg` | Then set `heroReady: true` |
| `assets.guidebook` | `src/assets/guidebook.jpg` | Then set `guidebookReady: true` |

Leaving the phone as `TODO:` is safe: it is omitted everywhere rather than
published half-finished, and the contact form still works without it.

## Optional

| Value | Where | Effect if left as-is |
|---|---|---|
| `contact.linkedin` | `site.ts` | The link is not rendered |
| `contact.instagram` | `site.ts` | The link is not rendered |
| `contact.facebook` | `site.ts` | The link is not rendered |
| `contact.office` | `site.ts` | The address block is omitted from the contact page |
| `seo.worksFor` | `site.ts` | The employer field is omitted from JSON-LD |
| `features.analyticsToken` | `site.ts` | No analytics. Cloudflare Web Analytics is cookieless |
| `assets.portraitAlt` | `site.ts` | Needed once a portrait exists, for screen readers |

---

## How placeholders behave until they are replaced

They do not ship as broken links or empty boxes. Each one has a designed
unfilled state:

- **Email, phone and social links** are not rendered at all, rather than
  pointing nowhere. On the contact page this means the direct-contact column is
  shorter than it will be; the form itself works regardless.
- **Photographs** show a ruled plate at the correct aspect ratio, inside the
  same arch crop the real photo will get. The layout is already the shape it
  will be, so dropping in a file shifts nothing.
- **JSON-LD fields** are omitted individually. Search engines treat a
  placeholder as a factual claim, so an unconfigured site emits a small
  correct graph instead of a large wrong one.
- **The site is not indexable.** While `siteUrlIsReal` is `false`,
  `robots.txt` disallows everything and every page carries `noindex`.

That last one is why the Lighthouse SEO score is currently held below 100. It
is not a defect to fix; it is the guard working. `ACCEPTANCE.md` has both
numbers, with and without the config filled in.

---

## The content itself

Unlike the personal details, the **copy is written**. Every section on every
page has real text in it, taken from the template the design follows. What is
placeholder is the factual detail behind it.

```
src/content/home/         10 files, one per landing page section
src/content/cv/           6 blank entries: 3 roles, 1 education, 2 credentials
src/content/testimonials/ 4 example testimonials
src/content/blog/         3 example posts
```

**The CV is deliberately blank.** Every entry under `src/content/cv/` is a
fill-in skeleton reading "Most recent role title", "Organization name" and
"Replace this line". That is what was asked for: the structure, not invented
career history.

The testimonials and blog posts are **examples with the right shape, not real
records**. Read them before launch and either replace them or delete them. One
needs attention above the others:

- **Testimonials name real-sounding clients.** Publishing a testimonial that
  nobody gave is a straightforward misrepresentation, and in the US it is one
  the FTC has rules about. Replace all four with real quotes, with permission,
  or delete the section from `src/content/theme.ts`.

Each folder also holds a `_template.mdx` with instructions in it. Files whose
name starts with an underscore are ignored by the build, so a template can
never publish itself.

Nothing breaks if a folder ends up empty: each page has a written empty state
telling you which file to copy.

`CONTENT.md` explains how to fill all of this in, written for someone who has
never used a terminal.

---

## Accounts needed before the contact form works

The form is built and its handler is tested against every path, including all
the spam ones, but it needs two accounts and five environment variables set in
the Cloudflare Pages dashboard. Until they are set, the form validates and
reports an error rather than silently failing. `README.md` has the setup steps.

| Variable | From |
|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile. Public by design |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile. Secret |
| `RESEND_API_KEY` | Resend. Secret |
| `CONTACT_FROM` | A verified sender on your domain |
| `CONTACT_TO` | Where messages should arrive |

Direct email and phone links work without any of this, as soon as `site.ts` is
filled in.
