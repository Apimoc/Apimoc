/* ==========================================================================
   INTERFACE STRINGS

   Every word that appears on screen but is not prose in an MDX file lives
   here. Button labels, link text, empty states, form errors, screen reader
   text, all of it. No user-facing string is written into a .astro file
   anywhere in this project.

   To change any word on the site, it is either in an MDX file under
   src/content/, or it is here. There is no third place to look.

   House style:
   - American English, US date formats.
   - No em dashes.
   - No exclamation marks. No rhetorical questions as headings.
   - Errors say what to do next. They do not apologize and are never vague.
   ========================================================================== */

export const ui = {
  /* --- Global chrome ---------------------------------------------------- */
  skipToContent: "Skip to content",
  siteNavLabel: "Primary",
  footerNavLabel: "Footer",
  socialNavLabel: "Social",

  header: {
    /* The logotype deliberately has no aria-label: see Header.astro. Its
       accessible name is the brand and name it already displays. */
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menuLabel: "Site menu",
    /** The button at the right of the header. */
    cta: "Contact me",
  },

  theme: {
    toLight: "Switch to light theme",
    toDark: "Switch to dark theme",
  },

  footer: {
    emailLabel: "Email",
    phoneLabel: "Phone",
    officeLabel: "Office",
    basedLabel: "Based in",
    linkedinLabel: "LinkedIn",
    instagramLabel: "Instagram",
    facebookLabel: "Facebook",
    /** %YEAR% and %NAME% are substituted at build time. */
    copyright: "© %YEAR% %NAME%. All rights reserved.",
    exploreHeading: "Explore",
    connectHeading: "Connect",
    tagline: "Superior living experiences for extraordinary residents.",
  },

  /* --- Page headers -------------------------------------------------------
     The eyebrow, heading and standfirst at the top of each page. Kept here
     rather than typed into the page files, so every word on the site is
     still in one of two places. */
  pages: {
    cv: {
      eyebrow: "The record",
      heading: "CV",
      standfirst:
        "Where I have worked, what I did there, and what I am qualified in.",
      description: "Roles, education and credentials.",
    },
    consultation: {
      eyebrow: "Say hello",
      heading: "Contact me",
      standfirst:
        "Tell me what you are looking for and I will come back to you within one business day.",
      description: "Get in touch by email, phone or through the form.",
    },
    about: {
      description: "%NAME%, %ROLE% in %LOCATION%.",
    },
    blog: {
      eyebrow: "Field notes",
      heading: "Blog",
      description: "Notes on the work and the market.",
    },
  },

  /* --- Landing page ---------------------------------------------------------
     Labels for the bands that carry no visible heading, so a screen reader
     user gets a region name where a sighted reader gets a visual break. */
  home: {
    pillarsLabel: "How I work",
  },

  /* --- Calls to action --------------------------------------------------- */
  cta: {
    myStory: "My story",
    moreAboutMe: "More about me",
    readMore: "Read more",
    readAllPosts: "Read all posts",
    contactMe: "Contact me",
    viewCV: "See the full CV",
    downloadGuide: "Download the guide",
    emailMe: "Email %NAME%",
    callMe: "Call %NAME%",
    backToBlog: "All posts",
    previous: "← Previous",
    next: "Next →",
    home: "Back to home",
  },

  /* --- CV ------------------------------------------------------------------
     The three groups, in the order they appear. `kind` matches the field of
     the same name in each entry's frontmatter. */
  cv: {
    groups: [
      { kind: "role", label: "Experience" },
      { kind: "education", label: "Education" },
      { kind: "credential", label: "Credentials" },
    ],
    empty:
      "No CV entries yet. Add one by copying src/content/cv/_template.mdx and editing the frontmatter.",
    /** Screen reader text for the placeholder plate on a photo slot. */
    photoPending: "Photograph to come",
  },

  /* --- Testimonials -------------------------------------------------------- */
  testimonials: {
    regionLabel: "What clients say",
    empty:
      "No testimonials yet. Add one by copying src/content/testimonials/_template.mdx and editing the frontmatter.",
  },

  /* --- Blog ---------------------------------------------------------------- */
  blog: {
    allTags: "All",
    filterLabel: "Filter by topic",
    empty: "No posts yet.",
    emptyFiltered: "No posts with that tag. Choose All to see everything.",
    rssLabel: "RSS feed",
    metaSeparator: " · ",
  },

  /* --- Contact page --------------------------------------------------------
     Lives at /consultation and is the site's only contact route. It is a
     form rather than a third-party embed, so nothing is loaded from another
     host. */
  consultation: {
    stepsHeading: "How it works",
    steps: [
      {
        title: "Tell me what you need",
        body: "Fill in the form below. The more you can tell me about the situation and the timeline, the more useful the first conversation will be.",
      },
      {
        title: "We talk it through",
        body: "A short call, at no cost. I will be straight with you about what is realistic and what it would take.",
      },
      {
        title: "We agree what happens next",
        body: "If it is a fit, I will put together a plan with the specifics attached. If it is not, I will say so.",
      },
    ],
    typeLabel: "What can I help with?",
    typeBuying: "A role or a position",
    typeSelling: "A property that needs steadying",
    typeBoth: "A question about my work",
    typeOther: "Something else",
    timelineLabel: "Your timeline",
    timelineOptions: [
      "As soon as possible",
      "Within three months",
      "Within six months",
      "Just making contact",
    ],
  },

  /* --- Contact form --------------------------------------------------------
     Every field has a persistent visible label. Placeholder-only labeling is
     a failure, so no field here relies on one. */
  contact: {
    formHeading: "Send a message",
    nameLabel: "Your name",
    emailLabel: "Your email",
    phoneLabel: "Your phone",
    phoneOptional: "Optional",
    messageLabel: "Message",
    submit: "Send message",
    submitting: "Sending",
    directHeading: "Or reach me directly",
    honeypotLabel: "Leave this field empty",

    success: {
      heading: "Message sent",
      body: "I read everything that comes through here and will reply within one business day.",
    },

    errors: {
      nameRequired: "Enter your name.",
      emailRequired: "Enter your email address.",
      emailInvalid: "Enter an email address in the form name@company.com.",
      messageRequired: "Enter a message.",
      messageTooShort: "Add a little more detail, at least 20 characters.",
      messageTooLong: "Shorten this to 4000 characters or fewer.",
      turnstileRequired: "Complete the verification check below the message field.",
      turnstileFailed:
        "The verification check did not pass. Reload the page and try again.",
      rateLimited: "Too many messages sent from this connection. Try again in an hour.",
      server: "The message did not send. Email me directly at the address below.",
      network: "No connection. Check your network and send again.",
    },

    errorSummaryHeading: "Fix these before sending",
  },

  /* --- 404 ------------------------------------------------------------------ */
  notFound: {
    code: "404",
    heading: "That page is not here",
    body: "The link may be out of date, or the address may have a typo in it.",
  },

  /* --- Placeholder notices --------------------------------------------------
     Shown where a photograph has not been supplied yet, so an empty slot
     reads as deliberate rather than broken. */
  placeholder: {
    badge: "Photo to come",
    hint: "Add the file and switch it on in src/content/site.ts",
  },
} as const;

/** Substitutes %TOKEN% placeholders in a UI string. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (out, [key, value]) => out.split(`%${key}%`).join(String(value)),
    template,
  );
}
