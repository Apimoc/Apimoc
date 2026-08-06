import { defineCollection } from "astro:content";
import { z } from "zod";
import { glob } from "astro/loaders";

/**
 * Match every .mdx file except the _template.mdx copy-me files, so a template
 * never accidentally publishes itself as a real entry.
 */
const TEMPLATE_SAFE = ["**/*.mdx", "!**/_*.mdx"];

/* ==========================================================================
   CONTENT SCHEMAS

   Written against Zod 4, which Astro 6 moved to. Every field carries a
   description and a custom error message, so a typo in a frontmatter field
   fails the build with something actionable rather than a type dump.

   If a build fails and points at one of these, the message tells you which
   file, which field, and what the field wants.
   ========================================================================== */

/** Reusable: a date that must parse, with a message that says the format. */
const dateField = (label: string) =>
  z.coerce.date({
    error: `${label} must be a date in YYYY-MM-DD form, for example 2026-03-04. Wrap it in quotes.`,
  });

/** Reusable: non-empty string with a field-specific message. */
const text = (label: string, min = 1) =>
  z.string({ error: `${label} is required.` }).min(min, {
    error:
      min > 1
        ? `${label} needs at least ${min} characters.`
        : `${label} cannot be empty.`,
  });

/* --------------------------------------------------------------------------
   HOME
   One file per home page section. The id must match an entry in the
   homeSections array in src/content/theme.ts.
   -------------------------------------------------------------------------- */

const home = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/home" }),
  schema: z.object({
    /** Must match a HomeSectionId in theme.ts. */
    section: text("section"),
    /** Hero only. The single largest line on the site. */
    headline: z.string().optional(),
    /** Hero only. The paragraph under the headline. */
    standfirst: z.string().optional(),
    /**
     * The rent-roll strip. Four figures belonging to ONE property, so they
     * tell a single story rather than three disconnected claims.
     */
    figures: z
      .array(
        z.object({
          value: text("figures[].value"),
          label: text("figures[].label"),
        }),
      )
      .max(4, {
        error:
          "The rent-roll strip takes at most 4 figures. More than that stops scanning in one pass.",
      })
      .optional(),
    /** Caption printed under the rent-roll strip. */
    figuresNote: z.string().optional(),
  }),
});

/* --------------------------------------------------------------------------
   EXPERIENCE
   One file per role. Rendered as a rent roll: dated rows with typed columns
   a regional director actually scans for.
   -------------------------------------------------------------------------- */

const experience = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/experience" }),
  schema: z.object({
    title: text("title"),
    org: text("org"),
    location: z.string().optional(),
    startDate: dateField("startDate"),
    /** Leave this out entirely for a role you are still in. */
    endDate: dateField("endDate").optional(),
    /** Unit count. Shown in its own column. */
    units: z.coerce
      .number({ error: "units must be a plain number, for example 153." })
      .int({ error: "units must be a whole number, with no decimal point." })
      .positive({
        error:
          "units must be greater than zero. Delete the units line entirely if the role has no unit count.",
      })
      .optional(),
    /** Program types. Shown in its own column. */
    program: z.array(z.string()).default([]),
    /** Short lines. Each becomes a bullet on /experience. */
    bullets: z.array(z.string()).default([]),
    /** Lower numbers sort first. Ties fall back to startDate, newest first. */
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

/* --------------------------------------------------------------------------
   WORK
   One file per case study. Set as a file jacket: a metrics block that reads
   like an audit summary line, then narrative beneath. One column.

   Describe the arrival state factually and neutrally. "Forty
   recertifications past due" is a fact. "Failing property" is a
   characterization of somebody else's asset on a public, indexed page.
   -------------------------------------------------------------------------- */

const work = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/work" }),
  schema: z.object({
    title: text("title"),
    /** One line, shown in the index list. */
    summary: text("summary"),
    /** Sits at the head of the jacket, like an audit summary line. */
    metrics: z
      .array(
        z.object({
          value: text("metrics[].value"),
          label: text("metrics[].label"),
        }),
      )
      .default([]),
    /** Neutral and factual. See the note above. */
    situation: text("situation"),
    action: text("action"),
    outcome: text("outcome"),
    date: dateField("date").optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

/* --------------------------------------------------------------------------
   CREDENTIALS
   -------------------------------------------------------------------------- */

const credentials = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/credentials" }),
  schema: z.object({
    name: text("name"),
    /** Awarding body, for example IREM. */
    issuer: z.string().optional(),
    /** Year only is fine here. */
    year: z.coerce.number().int().optional(),
    /** "credential" for certifications, "system" for software. */
    kind: z
      .enum(["credential", "system"], {
        error: 'kind must be exactly "credential" or "system".',
      })
      .default("credential"),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

/* --------------------------------------------------------------------------
   JOURNAL
   Slugs are semantic and carry no date. The date lives in frontmatter.
   -------------------------------------------------------------------------- */

const journal = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/journal" }),
  schema: z.object({
    title: text("title"),
    /** Used for the meta description and the index list. */
    description: text("description", 20),
    pubDate: dateField("pubDate"),
    updatedDate: dateField("updatedDate").optional(),
    /** Lowercase, single words where possible. Drives the tag filter. */
    tags: z.array(z.string()).default([]),
    /** Set true to keep a post out of the build entirely. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { home, experience, work, credentials, journal };
