/* ==========================================================================
   PAGE COMPOSITION

   Which sections appear on the landing page, and in what order.

   Reordering the array reorders the page. Setting `enabled: false` removes a
   section. Neither breaks the layout: every section is a self-contained band
   that brings its own spacing, so the page closes up around the gap.
   ========================================================================== */

export type HomeSectionId =
  | "hero"
  | "pillars"
  | "about"
  | "panels"
  | "figures"
  | "guidebook"
  | "whyWorkWithMe"
  | "testimonials"
  | "blog"
  | "cta";

export interface HomeSection {
  id: HomeSectionId;
  enabled: boolean;
}

export const homeSections: HomeSection[] = [
  { id: "hero", enabled: true },
  { id: "pillars", enabled: true },
  { id: "about", enabled: true },
  { id: "panels", enabled: true },
  { id: "figures", enabled: true },
  { id: "guidebook", enabled: true },
  { id: "whyWorkWithMe", enabled: true },
  { id: "testimonials", enabled: true },
  { id: "blog", enabled: true },
  { id: "cta", enabled: true },
];

/** Only the sections actually switched on, in order. */
export const activeHomeSections = homeSections.filter((s) => s.enabled);

/* --------------------------------------------------------------------------
   TOKENS
   Color and type values live in src/styles/tokens.css, which is the only file
   allowed to contain a hex value. They are not duplicated here: two copies of
   a palette is how a palette goes out of sync. CONTENT.md explains how to
   change them safely, including the contrast floors to respect.
   -------------------------------------------------------------------------- */

export const tokensFile = "src/styles/tokens.css";

/* --------------------------------------------------------------------------
   MOTION
   Durations in seconds. All of it is disabled wholesale under
   prefers-reduced-motion, and the library is never even downloaded there.
   -------------------------------------------------------------------------- */

export const motion = {
  /** Heading line-mask reveal. */
  revealDuration: 0.8,
  /** Gap between staggered children, in seconds. */
  stagger: 0.06,
  /** Upward travel on body blocks, in pixels. Transform only, never layout. */
  travel: 20,
} as const;

/* --------------------------------------------------------------------------
   LANDING PAGE FEEDS
   -------------------------------------------------------------------------- */

export const feedConfig = {
  /** How many blog posts the landing page shows. */
  postsOnHome: 3,
} as const;
