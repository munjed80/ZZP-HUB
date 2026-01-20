import { type MetadataRoute } from "next";

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  return [
    {
      url: "https://zzpershub.nl",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://zzpershub.nl/dashboard",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://zzpershub.nl/facturen",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://zzpershub.nl/offertes",
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://zzpershub.nl/btw-aangifte",
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://zzpershub.nl/support",
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://zzpershub.nl/instellingen",
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
