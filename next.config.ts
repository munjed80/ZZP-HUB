import withPWAInit, { type PluginOptions } from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const isCapacitorBuild = process.env.IS_CAPACITOR === "true";

const pwaOptions: PluginOptions = {
  dest: "public",
  // Disable PWA for Capacitor builds as service workers are handled differently
  disable: process.env.NODE_ENV === "development" || isCapacitorBuild,
  register: true,
  cacheStartUrl: false,
  dynamicStartUrl: true,
  fallbacks: {
    document: "/offline.html",
  },
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }) =>
          request.destination === "style" ||
          request.destination === "script" ||
          request.destination === "font",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-assets",
        },
      },
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "image-assets",
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
};

const withPWA = withPWAInit(pwaOptions);

const nextConfig: NextConfig = {
  turbopack: {},
  // Use static export for Capacitor builds
  output: isCapacitorBuild ? "export" : "standalone",
  images: {
    // Images must be unoptimized for static export
    unoptimized: isCapacitorBuild,
  },
  // Note: async headers() is not supported with output: "export"
  // Headers configuration only applies to standalone builds
  ...(!isCapacitorBuild && {
    async headers() {
      return [
        {
          source: "/sw.js",
          headers: [
            {
              key: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
            },
            {
              key: "Service-Worker-Allowed",
              value: "/",
            },
          ],
        },
        {
          source: "/manifest.webmanifest",
          headers: [
            {
              key: "Content-Type",
              value: "application/manifest+json",
            },
            {
              key: "Cache-Control",
              value: "public, max-age=0, must-revalidate",
            },
          ],
        },
        {
          source: "/offline.html",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=0, must-revalidate",
            },
          ],
        },
        {
          source: "/og-image.png",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, must-revalidate",
            },
          ],
        },
        {
          source: "/favicon.ico",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, must-revalidate",
            },
          ],
        },
        {
          source: "/favicon-16x16.png",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, must-revalidate",
            },
          ],
        },
        {
          source: "/favicon-32x32.png",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, must-revalidate",
            },
          ],
        },
        {
          source: "/apple-touch-icon.png",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=3600, must-revalidate",
            },
          ],
        },
      ];
    },
  }),
};

export default withPWA(nextConfig);
