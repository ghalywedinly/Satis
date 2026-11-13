import type { MetadataRoute } from "next";
import { PROTECTED_PREFIXES } from "@/lib/auth/routes";
import { siteOrigin } from "@/lib/seo";

/** Search engines may read the public site; signed-in areas and APIs stay out of results. */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = PROTECTED_PREFIXES.flatMap((p) => [p, `/en${p}`]);
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/s/", "/monitoring", "/ingest/", ...privatePaths] },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
