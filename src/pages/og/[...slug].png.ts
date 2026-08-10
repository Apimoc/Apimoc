import type { APIContext, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../lib/og";
import { identity } from "../../content/site";
import { ui } from "../../content/ui";
import { formatDateLong } from "../../lib/format";

/**
 * One Open Graph image per page, generated at build time from a single
 * template. The slug mirrors the page it belongs to, so /journal/foo gets
 * /og/journal/foo.png.
 */

/* Falls back to the placeholder badge rather than rendering an empty card, so
   an unconfigured site produces something obviously unfinished instead of
   something that looks broken. The build warning names the field to fix. */
const siteName = () =>
  identity.fullName;

const role = () => identity.jobTitle;

export const getStaticPaths = (async () => {
  const paths: {
    params: { slug: string };
    props: { heading: string; eyebrow?: string; footer?: string };
  }[] = [
    {
      params: { slug: "default" },
      props: { heading: siteName(), eyebrow: role(), footer: role() },
    },
    {
      params: { slug: "about" },
      props: { heading: "About", eyebrow: siteName(), footer: role() },
    },
    {
      params: { slug: "services" },
      props: { heading: "My services", eyebrow: siteName(), footer: role() },
    },
    {
      params: { slug: "listings" },
      props: { heading: "Featured listings", eyebrow: siteName(), footer: role() },
    },
    {
      params: { slug: "consultation" },
      props: { heading: "Book a consultation", eyebrow: siteName(), footer: role() },
    },
    {
      params: { slug: "blog" },
      props: { heading: "Blog", eyebrow: siteName(), footer: role() },
    },
    {
      params: { slug: "contact" },
      props: { heading: "Contact", eyebrow: siteName(), footer: role() },
    },
  ];

  const posts = await getCollection("blog", ({ data }) => !data.draft);
  posts.forEach((post) => {
    paths.push({
      params: { slug: `blog/${post.id}` },
      props: {
        heading: post.data.title,
        eyebrow: siteName(),
        footer: formatDateLong(post.data.pubDate),
      },
    });
  });

  const listings = await getCollection("listings", ({ data }) => !data.draft);
  listings.forEach((item) => {
    paths.push({
      params: { slug: `listings/${item.id}` },
      props: {
        heading: item.data.title,
        eyebrow: siteName(),
        footer: item.data.location,
      },
    });
  });

  return paths;
}) satisfies GetStaticPaths;

export async function GET(context: APIContext) {
  const { heading, eyebrow, footer } = context.props as {
    heading: string;
    eyebrow?: string;
    footer?: string;
  };

  const png = await renderOgImage({ heading, eyebrow, footer });

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
