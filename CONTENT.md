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

- **`.mdx` files** hold writing: blog posts, listings, services, testimonials,
  and each section of the home page.
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

This is the most important file. Anything still reading `TODO:` has not been
set yet.

Each line looks like this:

```ts
phone: "TODO: (303) 555-0100",
```

Replace everything between the quote marks, keeping the quote marks:

```ts
phone: "(303) 555-0100",
```

**Your email is split into two halves** so that automated address harvesters
cannot read it off the page:

```ts
emailUser: "hello",
emailDomain: "sarahbrownrealty.com",
```

That produces `hello@sarahbrownrealty.com`. Put the part before the `@` in the
first line and the part after it in the second.

Your name, brand, job title and location are already filled in. Change them
here if any of it is wrong; it updates the header, the footer, the page titles
and the search-engine data all at once.

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

## Adding a listing

1. Go to `src/content/listings/`.
2. Open `_template.mdx` and copy everything in it.
3. Click **Add file → Create new file**.
4. Name it after the property, lowercase, with dashes instead of spaces,
   ending in `.mdx`. For example `park-hill-victorian.mdx`. That name becomes
   the web address: `yoursite.com/listings/park-hill-victorian`.
5. Paste in what you copied, fill in the top section, write the description
   underneath.
6. Commit.

The top section between the two `---` lines looks like this:

```
---
title: Cherry Creek Townhome
location: Cherry Creek North, Denver
price: "$1,250,000"
status: for-sale
beds: 3
baths: 2.5
sqft: 2400
summary: >-
  One line about the property, used on the card and in search results.
features:
  - Chef's kitchen with a marble island
  - Rooftop terrace with mountain views
image: cherry-creek-townhome.jpg
imageAlt: Brick townhome with a black steel front door
order: 1
featured: true
draft: false
---
```

- `price` is in quotes because of the dollar sign. It is free text, so
  `"Price on request"` works just as well as a number.
- `status` must be exactly `for-sale`, `pending` or `sold`. The badge on the
  card follows it.
- `sqft` must be a plain number with no commas. `2400`, not `2,400 sq ft`.
- `featured: true` puts it on the home page. The home page shows three; change
  that number in `src/content/theme.ts`.
- `order` controls the sort. `1` appears first, then `2`, then `3`.
- `draft: true` keeps it off the site while you work on it.

### The listing photographs

Photos go in `src/assets/listings/`. Upload them there with
**Add file → Upload files**, then put the filename in the `image` line.

Until a photo is there, the card shows a ruled plate in the right shape rather
than a broken image, so nothing looks broken while you are setting up.

**Write the `imageAlt` line.** It is what somebody using a screen reader hears
instead of the photo. Describe what is in it: "Brick townhome with a black
steel front door", not "listing photo".

---

## Adding a blog post

1. Go to `src/content/blog/`.
2. Copy `_template.mdx`, create a new file, name it after what the post is
   about. For example `what-to-ask-at-a-showing.mdx`.
   **Do not put the date in the file name.** The date goes in the file itself.
3. Fill in the top section, write the post underneath.

```
---
title: What your offer says about you
description: >-
  Price is one line of a contract. Here is what sellers read in the rest of it.
pubDate: "2026-03-04"
tags:
  - buying
draft: false
---
```

- `pubDate` must be in year-month-day order, in quotes. `"2026-03-04"` is
  March 4th 2026.
- `tags` drive the filter buttons on the blog page. Keep them lowercase and
  reuse the same ones so the list stays short.
- `description` needs at least 20 characters. It is used on the card, in
  search results and in the link preview when someone shares the post.

Below the second `---`, write normally. A blank line starts a new paragraph.
Two extra things you can use:

- A line starting with `##` becomes a section heading.
- A line starting with `>` becomes a pull quote.

### Turning the blog off

If you would rather not have a blog, open `src/content/site.ts` and change
`blog: true` to `blog: false`. That removes the link from the menu, drops the
routes, and takes the recent-posts section off the home page.

---

## Adding or changing a service

In `src/content/services/`. Copy `_template.mdx`.

```
---
title: Buying
summary: One line about what this covers.
order: 1
icon: key
points:
  - Something specific you do
  - Something else, kept short
draft: false
---
```

`icon` must be one of: `trophy`, `clock`, `handshake`, `key`, `shield`,
`chart`. The build will stop and tell you if it is anything else.

Keep `points` short. They are set on one line each in the layout, and a long
one wraps awkwardly.

---

## Adding a testimonial

In `src/content/testimonials/`. Copy `_template.mdx`.

```
---
name: Joanne R.
detail: First-time buyer, Denver
quote: >-
  What they actually said, at least 20 characters.
order: 1
draft: false
---
```

**Read this before you publish one.** The four testimonials currently in the
folder are examples with the right shape. They are not real, and nobody named
in them said anything. Publishing an invented testimonial is a
misrepresentation, and in the US the FTC has specific rules about endorsements.

Replace all four with real quotes, from real clients, with their permission,
or remove the section entirely by opening `src/content/theme.ts` and setting
`{ id: "testimonials", enabled: false }`.

The same caution applies to the four example listings: the prices, addresses
and square footage in them are invented.

---

## Changing the home page

**File:** `src/content/theme.ts`

Near the top is the list that controls the home page:

```ts
export const homeSections: HomeSection[] = [
  { id: "hero",          enabled: true },
  { id: "pillars",       enabled: true },
  { id: "about",         enabled: true },
  { id: "panels",        enabled: true },
  { id: "figures",       enabled: true },
  { id: "guidebook",     enabled: true },
  { id: "listings",      enabled: true },
  { id: "whyWorkWithMe", enabled: true },
  { id: "testimonials",  enabled: true },
  { id: "blog",          enabled: true },
  { id: "cta",           enabled: true },
];
```

- **To reorder the page,** move the lines around.
- **To hide a section,** change its `enabled: true` to `enabled: false`.

Nothing breaks when you remove a section. Each one carries its own spacing, so
the page closes up around the gap.

Further down the same file:

```ts
export const listingsConfig = {
  featuredOnHome: 3,
  postsOnHome: 3,
};
```

How many listings and how many blog posts the home page shows.

### The words in those sections

Each section has one file in `src/content/home/`, named after its id:

| Section | File | What it holds |
|---|---|---|
| `hero` | `hero.mdx` | The big headline, the buttons, the scroll hint |
| `pillars` | `pillars.mdx` | The three cards under the hero |
| `about` | `about.mdx` | The introduction, also used on the About page |
| `panels` | `panels.mdx` | My Expertise and Work Ethic |
| `figures` | `figures.mdx` | The three big numbers |
| `guidebook` | `guidebook.mdx` | The free download offer |
| `whyWorkWithMe` | `whyWorkWithMe.mdx` | The numbered list |
| `cta` | `cta.mdx` | The closing invitation |

`listings`, `testimonials` and `blog` pull from their own folders; their files
here only hold the heading above the section.

The **figures** are capped at four. The build will stop and tell you if you add
a fifth, because more than four stops being scannable in one pass.

---

## Changing the words that are not in a content file

**File:** `src/content/ui.ts`

Button labels, form error messages, the empty states, the words above each
page. Anything that is part of the interface rather than the writing.

If you find yourself wanting to change a word and cannot find it in
`src/content/`, it is in here.

---

## Swapping the photographs

There are three site-wide photographs plus one per listing.

| Photo | Where it goes | Then set | Status |
|---|---|---|---|
| Portrait | `src/assets/portrait.jpg` | `portraitReady: true` | **in place** |
| Hero background | `src/assets/hero.jpg` | `heroReady: true` | not supplied |
| Guidebook cover | `src/assets/guidebook.jpg` | `guidebookReady: true` | not supplied |

The portrait is already there and switched on. To change it, upload a new file
with the same name; nothing else needs editing. For the other two:

1. Save your photo with exactly that filename.
2. In the repository, open the `src/assets/` folder and use
   **Add file → Upload files**.
3. Open `src/content/site.ts` and change the matching `...Ready: false` to
   `true`.
4. On the line below, replace the `...Alt` text with a short description of
   the photo, for people using screen readers. "Sarah Brown, seated and
   smiling in a dark blazer" is the right level of detail.

Until you do this, the site shows a neutral ruled rectangle in the right shape,
so nothing looks broken while you are still setting up. The shape does not
change when the real photo arrives, so nothing on the page moves.

---

## Changing the colors

**File:** `src/styles/tokens.css`

This is the only file in the whole project that contains a color. Everything
else refers back to it, so a change here updates the entire site at once.

There are two blocks: one for the dark theme, one for the light theme. **Dark
is the default**, so it is the block at the top, under `:root`.

```css
--paper:        #14110F;   /* page background */
--paper-raised: #1E1A17;   /* cards, form fields */
--ink:          #F0E9DF;   /* main text */
--ink-muted:    #A99C8C;   /* smaller, quieter text */
--brass:        #D3A75C;   /* links, accents, focus outlines */
--umber:        #3A322A;   /* thin dividing lines */
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
dropped below what it needs. If it says `FAIL`, the color needs to be lighter
(in the dark theme) or darker (in the light theme).

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
blog → what-your-offer-says data does not match collection schema.
  pubDate: pubDate must be a date in YYYY-MM-DD form,
           for example 2026-03-04. Wrap it in quotes.
```

Fix that field in that file and it will build. The most common causes:

- A date not in `"2026-03-04"` form, or missing its quote marks.
- A missing required field, like a post with no `description`.
- `sqft` written as `2,400` instead of `2400`.
- A `price` with a dollar sign but no quote marks around it.
- `status` set to something other than `for-sale`, `pending` or `sold`.
- Indentation changed on a `tags:`, `points:` or `features:` list. Those lines
  must stay lined up under each other, each starting with two spaces and a dash.

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
npm run verify           # theme, keyboard, form, overflow, in a real browser
npm run shots            # screenshots at 390/768/1280/1920, both themes
```

The last three need the site running. Build it, serve `dist/`, then point the
script at it, for example `npm run audit:a11y -- http://localhost:4321`.
