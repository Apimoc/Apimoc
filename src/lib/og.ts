import { readFileSync } from "node:fs";
import satori from "satori";
import sharp from "sharp";
import { lightTokens } from "./tokens";

/**
 * Build-time Open Graph images.
 *
 * Rendered from a single template in the site's own typefaces and palette, so
 * a link pasted into a message or a LinkedIn post carries the same identity
 * as the site itself.
 *
 * Static font instances are used here rather than the variable files the site
 * ships: satori's font parser cannot read the `fvar` table of a variable
 * font. The rendered weights are chosen to match the variable instances used
 * on the page, so the two look the same.
 */

const fonts = [
  {
    name: "Fraunces",
    data: readFileSync(
      "node_modules/@fontsource/fraunces/files/fraunces-latin-500-normal.woff",
    ),
    weight: 500 as const,
    style: "normal" as const,
  },
  {
    name: "Instrument Sans",
    data: readFileSync(
      "node_modules/@fontsource/instrument-sans/files/instrument-sans-latin-500-normal.woff",
    ),
    weight: 500 as const,
    style: "normal" as const,
  },
];

type Node = Record<string, unknown>;

const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, ...(children === undefined ? {} : { children }) },
});

/** The arch, the recurring shape of the design, drawn as a mark on the card
    so a shared link is recognisably from this site. */
function mark(): Node {
  return el(
    "div",
    {
      display: "flex",
      width: 260,
      height: 330,
      borderRadius: "130px 130px 0 0",
      border: `2px solid ${lightTokens.brass}`,
      alignItems: "flex-end",
      justifyContent: "center",
      padding: 18,
    },
    el("div", {
      display: "flex",
      width: 196,
      height: 210,
      borderRadius: "98px 98px 0 0",
      backgroundColor: lightTokens.brass,
      opacity: 0.16,
    }),
  );
}

export interface OgOptions {
  /** The large line. */
  heading: string;
  /** Small uppercase line above the heading. */
  eyebrow?: string;
  /** Small line at the foot. */
  footer?: string;
}

export async function renderOgImage(options: OgOptions): Promise<Buffer> {
  const { heading, eyebrow, footer } = options;

  const left = el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      flex: 1,
      height: "100%",
      paddingRight: 48,
    },
    [
      el(
        "div",
        { display: "flex", flexDirection: "column" },
        [
          ...(eyebrow
            ? [
                el(
                  "div",
                  {
                    display: "flex",
                    fontFamily: "Instrument Sans",
                    fontSize: 22,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: lightTokens.inkMuted,
                    marginBottom: 20,
                  },
                  eyebrow,
                ),
              ]
            : []),
          // The brass hairline, the same device used on the journal posts.
          el("div", {
            display: "flex",
            width: 96,
            height: 2,
            backgroundColor: lightTokens.brass,
            marginBottom: 28,
          }),
          el(
            "div",
            {
              display: "flex",
              fontFamily: "Fraunces",
              fontSize: heading.length > 60 ? 56 : 68,
              lineHeight: 1.08,
              letterSpacing: -1.5,
              color: lightTokens.ink,
            },
            heading,
          ),
        ],
      ),
      ...(footer
        ? [
            el(
              "div",
              {
                display: "flex",
                fontFamily: "Instrument Sans",
                fontSize: 22,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: lightTokens.inkMuted,
              },
              footer,
            ),
          ]
        : []),
    ],
  );

  const tree = el(
    "div",
    {
      display: "flex",
      width: "100%",
      height: "100%",
      backgroundColor: lightTokens.paper,
      padding: 72,
      alignItems: "stretch",
    },
    [left, el("div", { display: "flex", alignItems: "center" }, mark())],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
