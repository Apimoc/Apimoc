# Editing this site

This guide assumes you have never used a terminal. Everything here can be done
from GitHub in a web browser, without installing anything.

The site rebuilds and republishes itself automatically about a minute after you
save a change.

---

## The one rule

Every word on this site lives in a file under `src/content/`. Nothing else
needs to be touched to change any text, anywhere.

There are two kinds of file in there:

- **`.mdx` files** hold writing: journal posts, case studies, roles.
- **`.ts` files** hold settings: your name, your email, which sections appear.

Both are just text. You edit them the same way.

---

## How to edit any file on GitHub

1. Open the repository on github.com.
2. Click through the folders to the file you want.
3. Click the **pencil icon** at the top right of the file.
4. Make your change.
5. Scroll down, type a short note about what you changed, click
   **Commit changes**.

That is the whole process. Every task below is a variation on it.

---

## Filling in your details

**File:** `src/content/site.ts`

This is the most important file. Open it and you will see a block near the top
of everything that still needs filling in. Anything still reading `TODO:` has
not been set yet.

Each line looks like this:

```ts
fullName: "TODO: Full name, for example Alexandra Denton",
```

Replace everything between the quote marks, keeping the quote marks:

```ts
fullName: "Alexandra Denton",
```

Work down the list: your name, your job title, your location, your email, your
LinkedIn address.

**Your email is split into two halves** so that automated address harvesters
cannot read it off the page:

```ts
emailUser: "hello",
emailDomain: "alexandradenton.com",
```

That produces `hello@alexandradenton.com`. Put the part before the `@` in the
first line and the part after it in the second.

**Your phone number is deliberately not in this file and must not be added.**
It appears nowhere on the site by design.

### Once you have a real domain

Two lines near the middle of the file:

```ts
export const siteUrl = "https://example.com";
export const siteUrlIsReal = false;
```

Change the first to your real address and the second to `true`. Until you do,
the site tells search engines not to list it, which is deliberate: a
half-finished site appearing in search results is worse than one that does not.

---

## Adding a journal post

1. Go to `src/content/journal/`.
2. Open `_template.mdx` and copy everything in it.
3. Click **Add file → Create new file**.
4. Name it after what the post is about, lowercase, with dashes instead of
   spaces, ending in `.mdx`. For example `catching-up-recerts.mdx`.
   That name becomes the web address:
   `yoursite.com/journal/catching-up-recerts`.
   **Do not put the date in the file name.** The date goes in the file itself.
5. Paste in what you copied, fill in the top section, write the post underneath.
6. Commit.

The top section between the two `---` lines looks like this:

```
---
title: Catching up forty recertifications in six weeks
description: >-
  What I found, the order I worked in, and what I would do differently.
pubDate: "2026-03-04"
tags:
  - compliance
draft: false
---
```

- `pubDate` must be in year-month-day order, in quotes. `"2026-03-04"` is
  March 4th 2026.
- `tags` drive the filter buttons on the journal page. Keep them lowercase and
  reuse the same ones so the list stays short.
- `draft: true` keeps a post off the site while you work on it. Change it to
  `false` when you are ready.

Below the second `---`, write normally. A blank line starts a new paragraph.
Two extra things you can use:

- A line starting with `##` becomes a section break, which shows as a short
  centered rule.
- A line starting with `>` becomes a pull quote.

### Turning the journal on

The journal is built but switched off, so an empty journal never greets a
recruiter. When you have a post or two ready, open `src/content/site.ts` and
change:

```ts
journal: false,
```

to:

```ts
journal: true,
```

That one change adds the Journal link to the menu, lists it in the site map,
and allows search engines to find it.

---

## Adding a role to your CV

1. Go to `src/content/experience/`.
2. Copy `_template.mdx`, create a new file, name it something short like
   `multi-site-manager.mdx`.
3. Fill in the fields.

```
---
title: Multi-Site Property Manager
org: Company name
location: Rome, NY
startDate: "2024-01-01"
units: 439
program:
  - LIHTC
  - Rural Development
  - Market rate
bullets:
  - Something you did, with the number attached to it.
  - Something you changed, and what it moved from and to.
order: 1
draft: false
---
```

- **Leave out the `endDate` line entirely** if this is your current role. The
  site shows it as ongoing.
- `units` must be a plain number with no commas. `439`, not `439 units`.
- `program` entries appear in their own column, so keep them short.
- `order` controls the sort. `1` appears at the top, then `2`, then `3`.

Delete the three placeholder files (`role-one.mdx`, `role-two.mdx`,
`role-three.mdx`) once you have added your own.

---

## Adding a case study

Same process, in `src/content/work/`. Copy `_template.mdx`.

Case studies have three required sections: what was true when you arrived, what
you changed, and what the result was. That structure stays, because it is how
this work actually gets assessed.

**One thing to be careful about.** These pages are public and search engines
will index them. Describe the arrival state factually:

- Good: "Forty recertifications past due."
- Avoid: "A failing property."

The second one characterizes somebody else's building in public. The first says
more anyway. If you are unsure, describe the property by type and size rather
than by name: "a 153-unit LIHTC property" rather than naming it.

---

## Adding a credential or a system

In `src/content/credentials/`. Copy `_template.mdx`.

Set `kind: credential` for designations and certifications, `kind: system` for
software you work in. The page groups the two automatically under separate
headings, so you do not have to do anything else.

---

## Changing the home page

**File:** `src/content/theme.ts`

Near the top is the list that controls the home page:

```ts
export const homeSections: HomeSection[] = [
  { id: "hero",        enabled: true, heading: null },
  { id: "rentRoll",    enabled: true, heading: null },
  { id: "careerSpine", enabled: true, heading: "Career" },
  { id: "caseStudies", enabled: true, heading: "Case studies" },
  { id: "about",       enabled: true, heading: "About" },
  { id: "contact",     enabled: true, heading: "Contact" },
];
```

- **To reorder the page,** move the lines around.
- **To hide a section,** change its `enabled: true` to `enabled: false`.
- **To rename a heading,** edit the text in quotes.

Two sections are switched **off** by default: `rentRoll` and `careerSpine`.
The landing page is an introduction, not a stat sheet, so the unit counts and
the dated career rows live on the Experience page instead. Set either to
`enabled: true` if you want them on the front page after all.

Nothing breaks when you remove a section. Each one carries its own spacing, so
the page closes up around the gap.

### The words in those sections

The headline, the paragraph underneath it, and the four figures all live in
`src/content/home/`:

- `hero.mdx` is the big headline and the paragraph under it.
- `rent-roll.mdx` is the row of four figures.
- `about.mdx` is the short paragraph, which is also used on the About page.
- `contact.mdx` is the line inviting people to get in touch.

The four figures should all belong to **one property**, so they tell a single
story rather than four disconnected claims. Four is the maximum; the build will
stop and tell you if you add a fifth.

---

## Changing the 3D buildings

**File:** `src/content/scenes.ts`

Every page has its own building. One line each:

```ts
home: { floors: 6, unitsPerFloor: 5, occupancy: 0.78, spin: 1.5, yaw: -0.35 },
```

| Field | What it does |
|---|---|
| `floors` | How many storeys. 3 to 8 works well; more than 10 gets small |
| `unitsPerFloor` | How many homes across. 4 to 6 reads best |
| `occupancy` | Roughly how many units are lit, from 0 to 1 |
| `spin` | How far a full page scroll turns it, in radians. 1.5 is about a quarter turn |
| `yaw` | The starting angle, so each page opens on a different face |

Change a number and everything follows: the 3D building, the flat drawing
shown on phones that cannot run it, and the unit numbers on every door.

The unit numbers are generated, not typed. Floor 1 is 101, 102, 103; floor 2
is 201, 202, 203, and so on.

**To turn the 3D off entirely**, open `src/content/site.ts` and set
`buildingScene: false`. Every page then shows the flat drawing instead. It
is a real drawing, not a broken state, so this is a safe thing to do.

---

## Swapping the portrait

1. Save your photo as `portrait.jpg`.
2. In the repository, open the `src/assets/` folder and use
   **Add file → Upload files**.
3. Open `src/content/site.ts` and change `portraitReady: false` to
   `portraitReady: true`.
4. On the line below, replace the `portraitAlt` text with a short description
   of the photo, for people using screen readers. "Alexandra Denton, standing
   in front of a brick apartment building" is the right level of detail.

Until you do this, the site shows a neutral ruled rectangle in the right shape,
so nothing looks broken while you are still setting up.

## Adding your CV as a PDF

1. Upload the file into the `public/` folder, named `cv.pdf`.
2. In `src/content/site.ts`, change `cvReady: false` to `cvReady: true`.

The download button only appears once that is set, so there is never a button
that leads to a missing file.

---

## Changing the colors

**File:** `src/styles/tokens.css`

This is the only file in the whole project that contains a color. Everything
else refers back to it, so a change here updates the entire site at once.

There are two blocks: one for the light theme, one for the dark theme.

```css
--paper:        #EFE8DA;   /* page background */
--paper-raised: #F7F2E8;   /* cards, form fields */
--ink:          #2A2019;   /* main text */
--ink-muted:    #6B5B4A;   /* smaller, quieter text */
--brass:        #7E5B18;   /* links, accents, focus outlines */
--umber:        #4A3728;   /* thin dividing lines */
```

**Before you change one, read this.** Text has to stand out enough from its
background to be readable, and there is a legal standard for how much. Several
of these colors sit close to the line. The numbers in the comments in that file
are the measured values.

After any color change, check it still passes:

```
npm run audit:contrast
```

That prints every combination with its measured ratio and tells you if one has
dropped below what it needs. If it says `FAIL`, the color needs to be darker
(in the light theme) or lighter (in the dark theme).

One deliberate oddity: in the dark theme, `--umber` is too faint to be used for
anything a person needs to see. It is only used for decorative lines. Anything
you actually interact with, like the border of a form field, uses `--line-ui`
instead. Do not point `--line-ui` back at `--umber`.

---

## If something goes wrong

**The site did not update.** Check the Actions tab on GitHub. A red mark means
the build stopped.

**The build stopped with a message about a file.** This is the safety net
working. The message names the file, the field, and what it expected:

```
journal → first-post data does not match collection schema.
  pubDate: pubDate must be a date in YYYY-MM-DD form,
           for example 2026-03-04. Wrap it in quotes.
```

Fix that field in that file and it will build. The most common causes:

- A date not in `"2026-03-04"` form, or missing its quote marks.
- A missing required field, like a post with no `description`.
- `units` written as `439 units` instead of `439`.
- Indentation changed on a `tags:` or `bullets:` list. Those lines must stay
  lined up under each other, each starting with two spaces and a dash.

**You want to undo something.** On GitHub, open the file, click **History**,
find the version before your change, and revert it.

---

## For a developer

Running locally needs Node 22 or newer:

```
npm install
npm run dev
```

Then open `http://localhost:4321`.

Checks, all of which print real measurements rather than pass/fail assertions:

```
npm run build            # fails loudly on invalid content
npm run audit:contrast   # every color pair, measured
npm run audit:budget     # JavaScript per route, gzipped
npm run audit:strings    # proves no string is hardcoded in a component
npm run test:contact     # the contact form handler, including spam paths
npm run audit:a11y       # axe-core, every route, both themes
npm run verify           # theme, tiering, keyboard, form, in a real browser
npm run shots            # screenshots at 390/768/1280/1920, both themes
```

The last four need the site running. Build it, serve `dist/`, then point the
script at it, for example `npm run audit:a11y -- http://localhost:4321`.
