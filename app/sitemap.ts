import { type MetadataRoute } from "next";

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  return [
    {
      url: "https://matrixtop.com",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://matrixtop.com/dashboard",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://matrixtop.com/facturen",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://matrixtop.com/offertes",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://matrixtop.com/btw-aangifte",
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://matrixtop.com/support",
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://matrixtop.com/instellingen",
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
