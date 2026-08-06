import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { identity, seo, isPlaceholder } from "../../content/site";

export async function GET(context: APIContext) {
  const posts = (await getCollection("journal", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime(),
  );

  return rss({
    title: isPlaceholder(identity.fullName)
      ? seo.defaultTitle
      : `${identity.fullName} · Journal`,
    description: isPlaceholder(seo.defaultDescription)
      ? ""
      : seo.defaultDescription,
    site: context.site ?? "https://example.com",
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/journal/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: "<language>en-us</language>",
  });
}
