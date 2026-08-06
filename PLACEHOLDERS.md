# What is not filled in yet

Nothing in this list has been invented. Each value below is a placeholder that
has to be replaced with something real before the site goes live.

The build prints this same list every time it runs, so it cannot be forgotten:

```
  ┌─ Not filled in yet ──────────────────────────────────────────────
  │  identity.fullName
  │  contact.emailUser
  │  ...
  └──────────────────────────────────────────────────────────────────
```

Everything except the two files is in **one file**: `src/content/site.ts`.

---

## Required before launch

| Value | Where | Notes |
|---|---|---|
| `identity.location` | `site.ts` | `Greater Boston`, or `Rome, NY → Greater Boston` |
| `contact.emailUser` | `site.ts` | Part before the `@`. Use a dedicated address |
| `contact.emailDomain` | `site.ts` | Part after the `@` |
| `contact.linkedin` | `site.ts` | Full URL including `https://` |
| `seo.defaultDescription` | `site.ts` | One sentence, under 160 characters |
| `siteUrl` + `siteUrlIsReal` | `site.ts` | The real domain. See below |
| `assets.portrait` | `src/assets/portrait.jpg` | Then set `portraitReady: true` |
| `assets.cv` | `public/cv.pdf` | Then set `cvReady: true` |

Name, short name, post-nominals and job title are now filled in
(`Alexandra Denton, ARM®`, Multi-Site Property Manager). Change them in the
same file if any of it is wrong.

## Optional

| Value | Where | Effect if left as-is |
|---|---|---|
| `seo.worksFor` | `site.ts` | The employer field is omitted from JSON-LD |
| `seo.alumniOf` | `site.ts` | The education field is omitted from JSON-LD |
| `features.analyticsToken` | `site.ts` | No analytics. Cloudflare Web Analytics is cookieless |
| `assets.portraitAlt` | `site.ts` | Needed once a portrait exists, for screen readers |

---

## How placeholders behave until they are replaced

They do not ship as broken links or empty boxes. Each one has a designed
unfilled state:

- **Email and LinkedIn** links are not rendered at all, rather than pointing
  nowhere. This means **the two call-to-action buttons on the home page are
  currently absent.** They appear as soon as `contact.emailUser` is set.
- **The CV download button** appears only once `cvReady` is `true`.
- **The portrait** shows a ruled plate at the correct aspect ratio, so the
  layout is already the shape it will be with the real photo in place.
- **The meta description** is omitted rather than published as `TODO:`.
- **JSON-LD fields** are omitted individually. Search engines treat a
  placeholder as a factual claim, so an unconfigured site emits a small
  correct graph instead of a large wrong one.
- **The site is not indexable.** While `siteUrlIsReal` is `false`,
  `robots.txt` disallows everything and every page carries `noindex`.

That last one is why the SEO score is currently 58 rather than 100. With the
config filled in it measures 100. Both numbers are in `ACCEPTANCE.md`.

---

## The content itself

The CV content is intentionally blank templates rather than real career data.
Every `.mdx` file under `src/content/` is a fill-in-the-blanks skeleton:

```
src/content/home/         hero, rent-roll figures, about, contact
src/content/experience/   role-one, role-two, role-three
src/content/work/         case-study-one, -two, -three
src/content/credentials/  cred-one to -three, system-one, -two
src/content/journal/      first-post, second-post
```

Each folder also holds a `_template.mdx` with instructions in it. Files whose
name starts with an underscore are ignored by the build, so a template can
never publish itself.

Delete the numbered placeholder files once real entries exist. Nothing breaks
if a folder ends up empty: each page has a written empty state telling you
which file to copy.

`CONTENT.md` explains how to fill all of this in, written for someone who has
never used a terminal.

---

## Accounts needed before the contact form works

The form is built and its handler is tested, but it needs two accounts and
four environment variables set in the Cloudflare Pages dashboard. Until they
are set, the form validates and reports an error rather than silently
failing. `README.md` has the setup steps.

| Variable | From |
|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile. Public by design |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile. Secret |
| `RESEND_API_KEY` | Resend. Secret |
| `CONTACT_FROM` | A verified sender on your domain |
| `CONTACT_TO` | Where messages should arrive |

Direct email and LinkedIn links on the contact page work without any of this,
as soon as `site.ts` is filled in.
