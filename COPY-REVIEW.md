# Copy review

Every line of text on this site that was written rather than supplied, listed
so it can be rewritten in her own voice.

The CV content itself is **not** here: it was deliberately left as blank
templates. What follows is the interface copy, which had to say something in
order for the site to function.

House style applied throughout, from the brief:

- American English, US date formats.
- No em dashes anywhere.
- No exclamation marks, no rhetorical questions as headings.
- Section headings plain and functional, not clever.
- Errors say what to do next. They do not apologize and are never vague.
- Banned phrases avoided: passionate about, results-driven, detail-oriented,
  proven track record, dynamic professional, leverage, spearheaded, seasoned,
  dedicated professional, wearing many hats, hit the ground running.

---

## 1. Interface strings

**File:** `src/content/ui.ts`. All of it is mine. The ones worth a second look:

| String | Where | Note |
|---|---|---|
| `Email %NAME%` | Home, contact | Fills in `shortName`. Becomes "Email Allie" |
| `Download CV, PDF` | Home, experience | Comma rather than parentheses, to match the document register |
| `Full CV` | Home | Link under the career rows |
| `All case studies` | Home | |
| `More about how I work` | Home | First person, matching the About page |
| `On arrival` / `What I changed` / `Result` | Case studies | The three-part structure, in plain language rather than Situation/Action/Result |
| `Summary` | Case studies | Labels the metrics block |
| `Units` / `Leased` / `Occupancy` / `To stabilize` | Home figures | Column labels. In `home/rent-roll.mdx`, not `ui.ts` |
| `Period` / `Role` / `Units` / `Program` | Career table | Column headings |
| `Issued by` | Credentials | |
| `Systems` | Credentials | Heading for the software group |
| The 3D building description | Screen readers, in place of the canvas | Describes the cutaway, the door numbers and the lit units |
| `Set in Fraunces and Instrument Sans.` | Footer | Delete if unwanted. It is a designer's habit, not a requirement |

### Theme toggle

| String | Note |
|---|---|
| `Switch to dark theme` / `Switch to light theme` | Screen reader labels. They say what pressing it will do, not what state it is in |
| `Light` / `Dark` | Not currently displayed; available if a visible label is ever wanted |

### Navigation

| String | Note |
|---|---|
| `Skip to content` | Standard, first thing a keyboard user reaches |
| `Open menu` / `Close menu` | Screen reader labels on the mobile menu button |
| `Home` | Screen reader label on the logotype |

---

## 2. Empty states

Written to tell the reader exactly what to do next, and aimed at whoever is
editing the site rather than at a visitor, because that is who will see them.

> No roles yet. Add one by copying a file in `src/content/experience/` and
> editing the frontmatter.

> No case studies yet. Add one by copying `src/content/work/_template.mdx` and
> editing the frontmatter.

> No credentials yet. Add one by copying a file in `src/content/credentials/`
> and editing the frontmatter.

> No posts yet.

> No posts with that tag. Choose All to see everything.

The last one is the only empty state a visitor is likely to hit, and it names
the way out.

---

## 3. Contact form

**Labels.** Your name, Your email, Company, Message. "Company" is marked
Optional in the label itself rather than by leaving it unmarked.

**Success message.** Mine, and the line most worth replacing with her own:

> **Message sent**
> I read everything that comes through here and will reply within two business
> days.

That promises a response time. Change or delete it if two business days is not
right.

**Errors.** Each says what to do, in the imperative:

| Error | Text |
|---|---|
| Name missing | Enter your name. |
| Email missing | Enter your email address. |
| Email malformed | Enter an email address in the form name@company.com. |
| Message missing | Enter a message. |
| Message too short | Add a little more detail, at least 20 characters. |
| Message too long | Shorten this to 4000 characters or fewer. |
| Verification missing | Complete the verification check below the message field. |
| Verification failed | The verification check did not pass. Reload the page and try again. |
| Rate limited | Too many messages sent from this connection. Try again in an hour. |
| Server error | The message did not send. Email me directly at the address below. |
| Offline | No connection. Check your network and send again. |

The server error deliberately routes to the direct email address rather than
asking the visitor to try again later. A regional director who wants to make
contact should never be blocked by a form.

**Error summary heading.** "Fix these before sending."

---

## 4. The 404 page

> **404**
> That page is not here
> The link may be out of date, or the address may have a typo in it.
> Back to home

No apology, no joke. Two plausible causes and a way out.

---

## 4b. Landing page copy, NEW and entirely mine

The landing page was rewritten from a stat sheet into an introduction. Every
line below is written by me and is the first thing to replace in her own
voice. It is deliberately written as a reusable property-management template
rather than tied to her specific numbers.

**Headline** (`src/content/home/hero.mdx`):

> I take over properties that are behind and get them compliant and occupied.

**Standfirst**, same file:

> Multi-site property manager working across affordable and market rate
> housing. I go into sites that are understaffed or behind on compliance and
> hand them back stable.

**About paragraph** (`src/content/home/about.mdx`), also used on `/about`:

> I manage multifamily properties, and most of my work starts after something
> has gone sideways: a lease-up that stalled, recertifications that piled up,
> a site that lost its manager mid-year.
>
> The work is unglamorous and specific. Get the files current. Get the units
> turned and leased. Get the staff trained so the site holds together after I
> leave. I would rather hand a property back running quietly than tell you a
> story about it.

**Contact invitation** (`src/content/home/contact.mdx`):

> I am open to multi-site and regional roles. If you have a property that
> needs steadying, or a portfolio that needs someone who can walk into any of
> it, get in touch.

The last line of the About paragraph is the one with the most personality and
the most risk. It is a point of view about how she works, not a fact, so it
should either be kept because she agrees with it or cut entirely.

No unit counts, no occupancy percentages and no property names appear on the
landing page by design. Those live on Experience and Work.

---

## 5. Placeholder content in the MDX files

These are instructions to whoever fills the site in, not copy. Every one of
them gets deleted as the real content goes in. They are listed so none is
missed.

| File | Placeholder text |
|---|---|
| `home/rent-roll.mdx` | `000` / `00%` / `0 months` and their labels. Not shown on the landing page; used if `rentRoll` is switched on |
| `experience/role-*.mdx` | "Most recent role title", "Organization name", bullets |
| `work/case-study-*.mdx` | "First case study title" and the three sections |
| `credentials/*.mdx` | "First credential name", "Awarding body" |
| `journal/*.mdx` | "First post title" and the body |

Search the repository for `Replace this line` and `TODO:` to find anything
outstanding. `npm run build` prints the config placeholders on every run.

---

## 6. Page descriptions

Used as meta descriptions in search results. Mine, and worth a pass:

| Page | Description |
|---|---|
| About | How I work, and what I take on. |
| Experience | Roles, unit counts and programs. |
| Case studies | What each site looked like on arrival, what changed, and the numbers attached to it. |
| Credentials | Designations, certifications and the systems I work in. |
| Journal | Notes on compliance, lease-up and running sites. |
| Contact | Get in touch by email or through the form. |

The site-wide default description in `site.ts` is still a `TODO:` and is not
published until it is written. That one matters most: it is what appears under
the site's name in a search result.

---

## 7. A note on the arrows

Arrows that a screen reader announces (`← Previous`, `Next →` on the case study
and journal pagers) are part of the label text in `ui.ts`, so they can be
changed or removed there.

Arrows that are purely decorative (the `→` after "Full CV" and similar links)
are generated by CSS and are not in `ui.ts`. A screen reader never announces
them, so they are presentation rather than copy. They live in the component's
stylesheet, which is the one deliberate exception to "every string is in a
content file".
