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

   Written against Zod 4. Every field carries a custom error message, so a
   typo in frontmatter fails the build with something actionable rather than
   a type dump: which file, which field, and what the field wants.
   ========================================================================== */

const dateField = (label: string) =>
  z.coerce.date({
    error: `${label} must be a date in YYYY-MM-DD form, for example 2026-03-04. Wrap it in quotes.`,
  });

const text = (label: string, min = 1) =>
  z.string({ error: `${label} is required.` }).min(min, {
    error:
      min > 1
        ? `${label} needs at least ${min} characters.`
        : `${label} cannot be empty.`,
  });

/* --------------------------------------------------------------------------
   HOME
   One file per section of the landing page. `section` must match an id in
   the homeSections array in src/content/theme.ts.
   -------------------------------------------------------------------------- */

const home = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/home" }),
  schema: z.object({
    section: text("section"),
    /** The script flourish above a heading. Keep it to two or three words. */
    eyebrow: z.string().optional(),
    heading: z.string().optional(),
    /** The line under the heading. */
    standfirst: z.string().optional(),

    /** Hero only. */
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
    secondaryLabel: z.string().optional(),
    secondaryHref: z.string().optional(),
    scrollHint: z.string().optional(),

    /** The three pillars under the hero, and the numbered "why work with me". */
    pillars: z
      .array(
        z.object({
          icon: z
            .enum(["trophy", "clock", "handshake", "key", "shield", "chart"], {
              error:
                'icon must be one of: trophy, clock, handshake, key, shield, chart.',
            })
            .default("trophy"),
          title: text("pillars[].title"),
          body: text("pillars[].body"),
        }),
      )
      .optional(),

    /** The paired panels: My Expertise and Work Ethic. */
    panels: z
      .array(
        z.object({
          title: text("panels[].title"),
          body: text("panels[].body"),
        }),
      )
      .optional(),

    /** The "why trust me" figures. */
    figures: z
      .array(
        z.object({
          value: text("figures[].value"),
          label: text("figures[].label"),
          /** The script line under the label. Two or three words. */
          flourish: z.string().optional(),
        }),
      )
      .max(4, {
        error: "At most 4 figures. More than that stops scanning in one pass.",
      })
      .optional(),

    /** The signature image or typed name under the about copy. */
    signature: z.string().optional(),
  }),
});

/* --------------------------------------------------------------------------
   CV
   One file per entry. `kind` decides which group it lands in on the page, so
   roles, education and credentials all share one folder and one schema
   rather than needing three of everything.
   -------------------------------------------------------------------------- */

const cv = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/cv" }),
  schema: z.object({
    title: text("title"),
    /** Employer, school or awarding body. */
    org: text("org"),
    /** "Denver, CO". Optional: a credential has no location. */
    location: z.string().optional(),

    kind: z
      .enum(["role", "education", "credential"], {
        error: 'kind must be exactly "role", "education" or "credential".',
      })
      .default("role"),

    /**
     * Free text rather than a date, so an entry can read "2019" or
     * "March 2019" or "2019 to present" without the schema arguing. A CV is
     * read, not sorted on, and `order` below does the sorting.
     *
     * Coerced because YAML reads a bare `period: 2021` as a number, and
     * failing the build over a missing pair of quotes is a bad trade when
     * the field is free text anyway. `.optional()` short-circuits on
     * undefined, so an absent period stays absent rather than becoming the
     * string "undefined".
     */
    period: z.coerce.string().optional(),

    /** One line under the title. */
    summary: z.string().optional(),
    /** What you did. Keep each one to a line. */
    bullets: z.array(z.string()).default([]),

    /** Lower numbers first, within each group. */
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

/* --------------------------------------------------------------------------
   TESTIMONIALS
   -------------------------------------------------------------------------- */

const testimonials = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/testimonials" }),
  schema: z.object({
    /** The person's name, or how they want to be credited. */
    name: text("name"),
    /** "Denver, CO" or "First-time buyer". Shown under the name. */
    detail: z.string().optional(),
    quote: text("quote", 20),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

/* --------------------------------------------------------------------------
   BLOG
   Slugs are semantic and carry no date. The date lives in frontmatter.
   -------------------------------------------------------------------------- */

const blog = defineCollection({
  loader: glob({ pattern: TEMPLATE_SAFE, base: "./src/content/blog" }),
  schema: z.object({
    title: text("title"),
    description: text("description", 20),
    pubDate: dateField("pubDate"),
    updatedDate: dateField("updatedDate").optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { home, cv, testimonials, blog };
