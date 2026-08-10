# Copy review

Every line of text on this site, and where it came from, so it can be checked
and rewritten in her own voice before launch.

There are three sources, and it matters which is which:

| Source | What it is |
|---|---|
| **Template** | Taken from the Squarespace real estate template this design follows, as requested |
| **Mine** | Written for this build because the section needed words and the template had none |
| **Example** | Invented records with the right shape: listings, testimonials, blog posts |

---

## Read this first

**Two of the three sources need action before launch, for different reasons.**

**Template copy** is the demo text from a commercial Squarespace template.
Using it was an explicit instruction, and this document is not relitigating
that. But two practical notes: a demo template's copy is on every other site
that started from the same template, so it does not differentiate, and it
makes factual claims (see the figures below) that are currently not true of
anybody. Rewriting it in her voice is the single highest-value edit available.

**Example records** are invented and one category of them is a legal problem,
not a taste problem. See section 6.

---

## 1. Landing page

### Hero, `home/hero.mdx` — **Template**

> **Sarah Brown**
> Superior living experiences for extraordinary customers
> Explore listings
> Scroll down to see more

### The three pillars, `home/pillars.mdx` — **Template**

| Title | Body |
|---|---|
| Professional guidance | Experience true professional guidance as we navigate the intricacies of the market together. |
| Responsive execution | I apply swift and precise execution, ensuring your transactions move seamlessly from concept to reality. |
| Rewarding results | Join me and discover a community of families and individuals whom I helped find their dream home. |

### About, `home/about.mdx` — **Template**

Also used at the top of `/about`.

> **About me · Meet your real estate specialist**
>
> Hello, I'm Sarah Brown, your dedicated real estate professional based in
> Denver, Colorado.
>
> With a genuine passion for creating meaningful connections and turning
> property dreams into reality, I bring a personalized touch to every client's
> journey.

### Paired panels, `home/panels.mdx` — **Template**

My Expertise and Work Ethic, both verbatim from the template.

### Figures, `home/figures.mdx` — **Template, and factually unverified**

| | | |
|---|---|---|
| 12+ | Years of Professional | *experience* |
| 1K+ | Customers Served | *with success* |
| 99% | Satisfaction Rate | *of my clients* |

**These three numbers are the most important thing in this document.** They are
the template's demo figures. They are presented on the site as statements of
fact about a named person, under the heading "Why trust me?". Publishing them
unchanged asserts three things that nobody has verified.

`99% Satisfaction Rate` is the sharpest of the three: a satisfaction rate is a
measurement, and a specific one implies a survey that produced it.

Replace all three with real numbers, or delete the section by setting
`{ id: "figures", enabled: false }` in `src/content/theme.ts`.

### Guidebook, `home/guidebook.mdx` — **Template**

> **Now available · The ultimate home buying guidebook**
>
> I'm thrilled to offer you my latest creation, "The Ultimate Home Buying
> Guide". Tailored for both first-time buyers and seasoned investors, this
> guide walks you through every stage of a purchase, from the first showing to
> the closing table.

**There is no guidebook.** The button points at the contact page. Either write
the guide and wire the download up, or turn the section off.

### Why work with me, `home/whyWorkWithMe.mdx` — **Mine**

| Title | Body |
|---|---|
| Expertise that serves you | I stay close to the numbers so you do not have to. You get a clear read on what a property is worth and what it will take to get it. |
| Experienced guidance | Every transaction has a moment where it could go sideways. I have seen most of them, and I will tell you plainly what your options are. |
| Comprehensive knowledge | Neighborhood by neighborhood, I know what has sold, what has stalled and what is coming. That is what a good offer is built on. |

The template supplied only the three headings. The bodies are mine, written to
be specific rather than warm, which is the opposite register from the template
copy above them. That inconsistency is deliberate and worth a decision: pick
one voice for the whole page.

### Section headings and closing, **Mine**

| Section | Text |
|---|---|
| Listings | Featured · Currently on the market |
| Testimonials | Kind words · What my clients say |
| Blog | From the blog · Notes on the market |
| Closing | Let's talk · Let's start making your move |

> Whether you are buying your first home or listing one you have loved for
> years, the first conversation costs nothing and usually saves time.

---

## 2. Page headers

**File:** `src/content/ui.ts`, under `pages`. All **mine**.

| Page | Eyebrow | Heading | Standfirst |
|---|---|---|---|
| Services | What I do | My services | Four ways I work with clients. Most people need one of them. Some need two. |
| Listings | On the market | Featured listings | Everything currently listed, plus a few recent sales for reference. |
| Consultation | Let's talk | Book a consultation | Thirty minutes, at no cost, and no obligation at the end of it. |
| Contact | Say hello | Get in touch | Tell me what you are looking for and I will come back to you within one business day. |
| Blog | Field notes | Blog | |

Two of these make promises. "Thirty minutes, at no cost" and "within one
business day" are commitments to a stranger. Change them if either is wrong.

---

## 3. Interface strings

**File:** `src/content/ui.ts`. All **mine**. The ones worth a second look:

| String | Where | Note |
|---|---|---|
| `Email %NAME%` / `Call %NAME%` | Contact, footer | Fills in `shortName`. Becomes "Email Sarah" |
| `Superior living experiences for extraordinary customers.` | Footer tagline | The hero line, reused. Change both together or they read as a mistake |
| `Interested in this property?` | Single listing | The one rhetorical question on the site, kept because it labels an action |
| `Photograph to come` / `Photo to come` | Unfilled photo slots | Visitors should never see these. They mean a photo is missing |
| `Add the file and switch it on in src/content/site.ts` | Unfilled photo slots | Aimed at whoever is editing, not at a visitor |

### The consultation steps — **Mine**

| Step | Body |
|---|---|
| Tell me what you are looking for | Fill in the form below. The more you can tell me about your timeline and your budget, the more useful our first conversation will be. |
| We talk it through | A thirty minute call, at no cost. I will be straight with you about what is realistic in the current market. |
| We make a plan | If it is a fit, I will put together a plan for your search or your sale, with the numbers attached. |

### Theme toggle and navigation

| String | Note |
|---|---|
| `Switch to dark theme` / `Switch to light theme` | Screen reader labels. They say what pressing it will do, not what state it is in |
| `Skip to content` | Standard, first thing a keyboard user reaches |
| `Open menu` / `Close menu` | Screen reader labels on the mobile menu button |
| `Home` | Screen reader label on the logotype |

---

## 4. Empty states — **Mine**

Aimed at whoever is editing the site rather than at a visitor, because that is
who will see them.

> No listings yet. Add one by copying `src/content/listings/_template.mdx` and
> editing the frontmatter.

> No services yet. Add one by copying `src/content/services/_template.mdx` and
> editing the frontmatter.

> No testimonials yet. Add one by copying
> `src/content/testimonials/_template.mdx` and editing the frontmatter.

> No posts yet.

> No posts with that tag. Choose All to see everything.

The last one is the only empty state a visitor is likely to hit, and it names
the way out.

---

## 5. Forms — **Mine**

**Contact labels.** Your name, Your email, Your phone, Message. "Your phone" is
marked Optional in the label itself rather than by leaving it unmarked.

**Consultation adds** two selects: "What can I help with?" (Buying, Selling,
Both, Something else) and "Your timeline" (As soon as possible, Within three
months, Within six months, Just starting to look).

**Success message**, and the line most worth replacing with her own:

> **Message sent**
> I read everything that comes through here and will reply within one business
> day.

That promises a response time. It matches the contact page standfirst; change
both together.

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

The server error routes to the direct email address rather than asking the
visitor to try again later. A buyer who wants to make contact should never be
blocked by a form.

**Error summary heading.** "Fix these before sending."

---

## 6. Example records — **not real, and one is a legal problem**

### Testimonials, `src/content/testimonials/` — **delete or replace**

Four testimonials, attributed to Joanne, Marcus, Priya and Dev, with locations
and buyer types. **Nobody said any of them.** They exist to show the section's
shape.

Publishing an invented testimonial attributed to a client is a
misrepresentation. In the US the FTC's endorsement rules cover exactly this,
and they apply to a small agent's website the same as to a national brand.

Three options, in order of preference: replace all four with real quotes given
with permission; delete the four files and let the written empty state show; or
turn the section off in `src/content/theme.ts`.

### Listings, `src/content/listings/` — **replace**

Four properties: Cherry Creek Townhome, Wash Park Bungalow, LoHi Loft, Sloan's
Lake New Build. Every price, address, bed count and square footage is invented.
Real listings also carry MLS and brokerage disclosure requirements that vary by
state and are not modeled here.

### Blog posts, `src/content/blog/` — **replace**

Three posts. The advice in them is generic and defensible, but it is not hers
and it is not written in her voice.

---

## 7. The 404 page — **Mine**

> **404**
> That page is not here
> The link may be out of date, or the address may have a typo in it.
> Back to home

No apology, no joke. Two plausible causes and a way out.

---

## 8. House style

Applied to everything marked **Mine**:

- American English, US date formats.
- No em dashes anywhere.
- No exclamation marks, no rhetorical questions as headings.
- Errors say what to do next. They do not apologize and are never vague.
- Avoided: passionate about, results-driven, detail-oriented, proven track
  record, dynamic professional, leverage, spearheaded, seasoned, dedicated
  professional, wearing many hats, hit the ground running.

**The template copy does not follow it**, and was not edited to, because the
instruction was to use the template's text as it stands. Specifically it
contains "a genuine passion for", "dedicated real estate professional" and
"seasoned investors", all three of which the house style rules out, plus one
exclamation-adjacent "I'm thrilled to offer you".

That is a real inconsistency between the two halves of the landing page. It is
flagged here rather than silently fixed, because the instruction was explicit.
Say the word and the template copy gets rewritten to the house style in one
pass.

---

## 9. Where the decorative arrows live

Arrows a screen reader announces (`← Previous`, `Next →` on the blog and
listing pagers) are part of the label text in `ui.ts`, so they can be changed
or removed there.

Arrows that are purely decorative, the `→` after "View all listings" and
similar links, are generated by CSS and are not in `ui.ts`. A screen reader
never announces them, so they are presentation rather than copy. They live in
the component's stylesheet, which is the one deliberate exception to "every
string is in a content file".
