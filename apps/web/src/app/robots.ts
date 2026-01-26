import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://zollpilot.de";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/blog/*", "/faq", "/faq/*"],
        disallow: [
          "/app",
          "/app/*",
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}

