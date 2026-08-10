/* ==========================================================================
   SITE CONFIGURATION

   The one file to edit for anything that identifies the site: name, contact
   details, links, navigation, SEO defaults, feature switches.

   Anything still reading "TODO:" has not been filled in yet. Those values are
   deliberately not invented. The build prints a warning listing every one
   still outstanding, and anything that would publish a placeholder link hides
   it instead of shipping a dead link.

   This file must not import anything. It is read by astro.config.ts at config
   time, where Astro-specific imports are not available.
   ========================================================================== */

/** Marks a value as not yet supplied. */
export const TODO = "TODO:" as const;

/** True when a value is still an unfilled placeholder. */
export function isPlaceholder(value: string | undefined | null): boolean {
  return !value || value.startsWith(TODO);
}

/* --------------------------------------------------------------------------
   1. IDENTITY
   -------------------------------------------------------------------------- */

export const identity = {
  /** The name. Appears in the logotype, the hero script and the footer. */
  fullName: "Alexandra Denton",

  /** Informal short form, used in the calls to action. */
  shortName: "Alexandra",

  /** How the signature under the About copy reads. */
  signature: "Alexandra D.",

  /**
   * The logotype text. This is the name rather than a company, so the
   * logotype is a single line: there is no second line under it.
   */
  brand: "Alexandra Denton",

  /** Job title. Used in the meta description and JSON-LD. */
  jobTitle: "Real Estate Specialist",

  /** Shown in the footer and used in the JSON-LD address. */
  location: "Denver, Colorado",
} as const;

export const contact = {
  /**
   * Public email, stored split so the rendered markup never contains a
   * scrapeable "user@domain" string. See src/components/EmailLink.astro.
   */
  emailUser: "TODO: the part before the @",
  emailDomain: "TODO: the part after the @",

  /** Full URLs including https://. Any left as TODO is simply not rendered. */
  linkedin: "TODO: https://www.linkedin.com/in/...",
  instagram: "TODO: https://www.instagram.com/...",
  facebook: "TODO: https://www.facebook.com/...",

  /**
   * A phone number IS appropriate on a real estate site, unlike the earlier
   * build. Leave it as TODO to omit it everywhere.
   */
  phone: "TODO: (303) 555-0100",

  /** Office address, shown on the contact page. Optional. */
  office: "TODO: 1234 Street Name, Denver, CO 80202",
} as const;

export const assets = {
  /**
   * The portrait. Drop the file at src/assets/portrait.jpg and set this to
   * true. Until then every portrait slot shows a designed plate at the right
   * aspect ratio, so the layout is already the shape it will be.
   */
  portraitReady: true,
  portraitAlt:
    "Alexandra Denton, seated in an armchair in a black blazer over a white top, smiling toward the camera",

  /** The hero background photograph, at src/assets/hero.jpg. */
  heroReady: false,
  heroAlt: "City skyline at dusk",

  /** The lead magnet cover, at src/assets/guidebook.jpg. */
  guidebookReady: false,
  guidebookAlt: "The Ultimate Home Buying Guide, cover",
} as const;

/**
 * Canonical origin, no trailing slash. Used for the sitemap, RSS, canonical
 * URLs and Open Graph. Until this is real, absolute URLs are wrong.
 */
export const siteUrl = "https://example.com";

/** Set once siteUrl above is the real domain. Guards indexing. */
export const siteUrlIsReal = false;

/* --------------------------------------------------------------------------
   2. NAVIGATION
   Order here is the order in the header and the mobile menu.
   -------------------------------------------------------------------------- */

export const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "CV", href: "/cv" },
  { label: "Blog", href: "/blog" },
] as const;

/* --------------------------------------------------------------------------
   3. FEATURE SWITCHES
   -------------------------------------------------------------------------- */

export const features = {
  /** The blog. Set false to hide the route and drop it from the nav. */
  blog: true,

  /**
   * The contact page at /consultation, linked from the header button. It is
   * the only contact route: the standalone /contact page was removed, so
   * switching this off leaves no way to make contact through the site.
   */
  consultation: true,

  /** Smooth scrolling, desktop pointer devices only, never on touch. */
  smoothScroll: true,

  /** Cloudflare Web Analytics. Cookieless. Needs a token to do anything. */
  analytics: false,
  analyticsToken: "TODO: Cloudflare Web Analytics token",
} as const;

/* --------------------------------------------------------------------------
   4. SEO DEFAULTS
   Per-page titles and descriptions come from each page and override these.
   -------------------------------------------------------------------------- */

export const seo = {
  titleTemplate: "%s · " + identity.brand,
  /* The logotype is already the full name, so the old
     "%BRAND% by %NAME%" pattern would read "Alexandra Denton by
     Alexandra Denton". */
  defaultTitle: `${identity.fullName} · ${identity.jobTitle}`,
  defaultDescription:
    "Superior living experiences for extraordinary residents. Denver, Colorado.",
  knowsAbout: [
    "Property management",
    "Resident relations",
    "Leasing and occupancy",
    "Affordable housing compliance",
    "Denver housing market",
  ],
  /** Employer or agency. Leave as TODO to omit the field. */
  worksFor: "TODO: employer name, or leave as TODO to omit",
} as const;

/* --------------------------------------------------------------------------
   5. DERIVED
   Nothing below needs editing.
   -------------------------------------------------------------------------- */

export const emailAddress = isPlaceholder(contact.emailUser)
  ? ""
  : `${contact.emailUser}@${contact.emailDomain}`;

/** Every outstanding placeholder, for the build-time warning. */
export function outstandingPlaceholders(): string[] {
  const out: string[] = [];
  const check = (path: string, value: string) => {
    if (isPlaceholder(value)) out.push(path);
  };
  check("contact.emailUser", contact.emailUser);
  check("contact.emailDomain", contact.emailDomain);
  check("contact.phone", contact.phone);
  check("contact.linkedin", contact.linkedin);
  check("contact.instagram", contact.instagram);
  check("contact.facebook", contact.facebook);
  check("contact.office", contact.office);
  if (!siteUrlIsReal) out.push("siteUrl (still https://example.com)");
  if (!assets.portraitReady) out.push("assets.portrait (src/assets/portrait.jpg)");
  if (!assets.heroReady) out.push("assets.hero (src/assets/hero.jpg)");
  if (!assets.guidebookReady) out.push("assets.guidebook (src/assets/guidebook.jpg)");
  return out;
}
