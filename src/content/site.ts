/* ==========================================================================
   SITE CONFIGURATION

   This is the one file to edit for anything that identifies the site: name,
   contact details, links, navigation, SEO defaults, feature switches.

   Anything still reading "TODO:" has not been filled in yet. Those values
   are deliberately not invented. The build prints a warning listing every
   one that is still outstanding, and pages that would publish a placeholder
   link hide it instead of shipping a dead link.

   This file must not import anything. It is read by astro.config.ts at
   config time, where Astro-specific imports are not available.
   ========================================================================== */

/** Marks a value as not yet supplied. */
export const TODO = "TODO:" as const;

/** True when a value is still an unfilled placeholder. */
export function isPlaceholder(value: string | undefined | null): boolean {
  return !value || value.startsWith(TODO);
}

/* --------------------------------------------------------------------------
   1. FILL THESE IN
   -------------------------------------------------------------------------- */

export const identity = {
  /** Displayed everywhere as the primary name. */
  fullName: "TODO: Full name, for example Alexandra Denton",

  /** Informal short form. Used in the contact copy only. */
  shortName: "TODO: Short name, for example Allie",

  /** Post-nominals shown after the name in the header and JSON-LD. */
  postNominals: "TODO: for example ARM®",

  /** Job title. Used in the header, meta description and JSON-LD. */
  jobTitle: "TODO: for example Multi-site Property Manager",

  /** Shown in the header and footer. */
  location: "TODO: for example Greater Boston",
} as const;

export const contact = {
  /**
   * Public email. Use a dedicated address, not a personal one.
   * Stored split so the rendered markup never contains a scrapeable
   * "user@domain" string. See src/components/EmailLink.astro.
   */
  emailUser: "TODO: the part before the @",
  emailDomain: "TODO: the part after the @",

  /** Full profile URL including https://. */
  linkedin: "TODO: https://www.linkedin.com/in/...",

  /**
   * Phone is intentionally absent and must stay that way. It appears
   * nowhere on this site in any form. Contact form and email only.
   */
} as const;

export const assets = {
  /** Drop the file at public/images/portrait.jpg, then set this to true. */
  portraitReady: false,
  portrait: "/images/portrait.jpg",
  portraitAlt: "TODO: describe the portrait for screen readers",

  /** Drop the file at public/cv.pdf, then set this to true. */
  cvReady: false,
  cv: "/cv.pdf",
} as const;

/**
 * Canonical origin, no trailing slash. Used for sitemap, RSS, canonical
 * URLs and Open Graph. Until this is real, absolute URLs are wrong.
 */
export const siteUrl = "https://example.com";

/** Set once siteUrl above is the real domain. Guards indexing. */
export const siteUrlIsReal = false;

/* --------------------------------------------------------------------------
   2. THE SIGNATURE ELEMENT
   The Occupancy Stack renders directly from these numbers. Change them here
   and the 3D stack, the SVG fallback and the text equivalent all follow.
   -------------------------------------------------------------------------- */

export const occupancy = {
  /** Total unit volumes in the lattice. */
  totalUnits: 153,
  /** How many are lit. The remainder cluster as a single corner notch. */
  leasedUnits: 142,
  /** Units per floor plate. Drives the shape of the stack. */
  unitsPerFloor: 9,
  /** Free-text period, shown in the label. */
  period: "9 months",
  /** Shown beside the stack. A stated figure, never an animated counter. */
  label: "142 of 153 leased · 9 months",
  /** Read by screen readers in place of the canvas. */
  textEquivalent:
    "A lattice of 153 unit volumes representing a lease-up. 142 are lit, showing 93 percent occupancy reached in 9 months. The 11 unlit units form a single notch at one corner of the stack.",
} as const;

/* --------------------------------------------------------------------------
   3. NAVIGATION
   Order here is the order in the header and the mobile menu. Remove an entry
   and it disappears from both. Entries whose route is switched off in
   theme.ts are filtered out automatically.
   -------------------------------------------------------------------------- */

export const nav = [
  { label: "About", href: "/about" },
  { label: "Experience", href: "/experience" },
  { label: "Work", href: "/work" },
  { label: "Credentials", href: "/credentials" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
] as const;

/* --------------------------------------------------------------------------
   4. FEATURE SWITCHES
   -------------------------------------------------------------------------- */

export const features = {
  /**
   * The journal is fully built: index, post layout, tag filter, RSS,
   * BlogPosting schema. It is switched off so an empty journal never greets
   * a recruiter. Set this to true to publish it. That single change adds the
   * nav link, lists it in the sitemap and removes the noindex.
   */
  journal: false,

  /** The 3D hero. Set false to always serve the SVG fallback. */
  occupancyStack3D: true,

  /** Smooth scrolling, desktop pointer devices only, never on touch. */
  smoothScroll: true,

  /** Cloudflare Web Analytics. Cookieless. Needs a token to do anything. */
  analytics: false,
  analyticsToken: "TODO: Cloudflare Web Analytics token",
} as const;

/* --------------------------------------------------------------------------
   5. SEO DEFAULTS
   Per-page titles and descriptions come from each page's frontmatter and
   override these.
   -------------------------------------------------------------------------- */

export const seo = {
  titleTemplate: "%s · " + identity.fullName,
  defaultTitle: identity.fullName,
  defaultDescription:
    "TODO: one sentence, under 160 characters, describing what she does and where.",
  /** Subjects for JSON-LD knowsAbout. */
  knowsAbout: [
    "LIHTC compliance",
    "Rural Development housing",
    "Property lease-up",
    "Fair Housing",
    "Affordable housing operations",
  ],
  /** Employer for JSON-LD worksFor. Leave as TODO to omit the field. */
  worksFor: "TODO: employer name, or leave as TODO to omit",
  /** Institution for JSON-LD alumniOf. Leave as TODO to omit the field. */
  alumniOf: "TODO: institution name, or leave as TODO to omit",
} as const;

/* --------------------------------------------------------------------------
   6. DERIVED
   Nothing below needs editing.
   -------------------------------------------------------------------------- */

export const emailAddress = isPlaceholder(contact.emailUser)
  ? ""
  : `${contact.emailUser}@${contact.emailDomain}`;

export const displayName = isPlaceholder(identity.postNominals)
  ? identity.fullName
  : `${identity.fullName}, ${identity.postNominals}`;

/** Every outstanding placeholder, for the build-time warning. */
export function outstandingPlaceholders(): string[] {
  const out: string[] = [];
  const check = (path: string, value: string) => {
    if (isPlaceholder(value)) out.push(path);
  };
  check("identity.fullName", identity.fullName);
  check("identity.shortName", identity.shortName);
  check("identity.postNominals", identity.postNominals);
  check("identity.jobTitle", identity.jobTitle);
  check("identity.location", identity.location);
  check("contact.emailUser", contact.emailUser);
  check("contact.emailDomain", contact.emailDomain);
  check("contact.linkedin", contact.linkedin);
  check("seo.defaultDescription", seo.defaultDescription);
  if (!siteUrlIsReal) out.push("siteUrl (still https://example.com)");
  if (!assets.portraitReady) out.push("assets.portrait (no file at public/images/portrait.jpg)");
  if (!assets.cvReady) out.push("assets.cv (no file at public/cv.pdf)");
  return out;
}
