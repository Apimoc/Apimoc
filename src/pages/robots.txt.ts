import type { APIContext } from "astro";
import { siteUrlIsReal } from "../content/site";

/**
 * Generated rather than static, so the sitemap URL always matches the
 * configured domain. While the domain is still a placeholder, crawling is
 * disallowed outright: a half-built site indexed under example.com is worse
 * than one that is not indexed at all.
 */
export function GET(context: APIContext) {
  const sitemap = new URL("/sitemap-index.xml", context.site).href;

  const body = siteUrlIsReal
    ? `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`
    : `User-agent: *\nDisallow: /\n`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
