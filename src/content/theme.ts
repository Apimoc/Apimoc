/* ==========================================================================
   THEME AND PAGE COMPOSITION

   Two jobs:
   1. Decide which sections appear on the home page, and in what order.
   2. Point at where the color and type tokens live.

   Reordering the array below reorders the home page. Deleting an entry
   removes that section. Neither breaks the layout: every section is a
   self-contained ruled band that brings its own spacing, so the page simply
   closes up around the gap.
   ========================================================================== */

/** Every section that exists. Add to this union only when you build one. */
export type HomeSectionId =
  | "hero"
  | "rentRoll"
  | "careerSpine"
  | "caseStudies"
  | "about"
  | "contact";

export interface HomeSection {
  id: HomeSectionId;
  /** Set false to hide without deleting the line. */
  enabled: boolean;
  /**
   * Heading shown above the band. The hero has no heading, so it is null
   * there. Headings are plain and functional, not clever.
   */
  heading: string | null;
}

/* --------------------------------------------------------------------------
   HOME PAGE ORDER
   -------------------------------------------------------------------------- */

export const homeSections: HomeSection[] = [
  { id: "hero", enabled: true, heading: null },
  { id: "about", enabled: true, heading: "About" },
  { id: "caseStudies", enabled: true, heading: "Selected work" },
  { id: "contact", enabled: true, heading: "Contact" },

  /* Off by design. The landing page introduces her; the numbers belong on
     the Experience page, where someone has already decided to look properly.
     Set either of these to true to bring it onto the home page. */
  { id: "rentRoll", enabled: false, heading: null },
  { id: "careerSpine", enabled: false, heading: "Career" },
];

/** Only the sections actually switched on, in order. */
export const activeHomeSections = homeSections.filter((s) => s.enabled);

/* --------------------------------------------------------------------------
   TOKENS
   Color and type values live in src/styles/tokens.css, which is the only
   file allowed to contain a hex value. They are not duplicated here: two
   copies of a palette is how a palette goes out of sync. CONTENT.md explains
   how to change them safely, including the contrast floors to respect.
   -------------------------------------------------------------------------- */

export const tokensFile = "src/styles/tokens.css";

/* --------------------------------------------------------------------------
   MOTION
   Durations are in seconds and mirror the custom properties in tokens.css.
   Everything here is disabled wholesale under prefers-reduced-motion.
   -------------------------------------------------------------------------- */

export const motion = {
  /** Heading line-mask reveal. */
  revealDuration: 0.7,
  /** Gap between staggered children, in seconds. Brief calls for 40 to 60ms. */
  stagger: 0.05,
  /** Upward travel on body blocks, in pixels. Transform only, never layout. */
  travel: 18,
  /** How long the Occupancy Stack takes to resolve. A reveal, not a fill. */
  stackReveal: 1.2,
} as const;

/* --------------------------------------------------------------------------
   PERFORMANCE TIERING
   The 3D stack is replaced by the SVG fallback when any of these is true.
   The fallback is a designed deliverable, not a degraded state.
   -------------------------------------------------------------------------- */

export const tiering = {
  /** Devices reporting this much RAM or less get the fallback. */
  minDeviceMemoryGb: 4,
  /** Never render above this device pixel ratio. */
  maxDpr: 1.75,
} as const;
