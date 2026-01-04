import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SonnerToaster } from "@/components/providers/sonner-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";
import { InstallPWA } from "@/components/ui/install-pwa";

export const metadata: Metadata = {
  metadataBase: new URL("https://zzp-hub.nl"),
  title: "Elite Business Hub | Slimmer Ondernemen voor ZZP'ers",
  applicationName: "ZZP HUB",
  description:
    "Beheer je facturen, ritten en agenda met de snelheid van licht. De #1 keuze voor professionele koeriers en ondernemers.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Elite Business Hub | Slimmer Ondernemen voor ZZP'ers",
    description:
      "Beheer je facturen, ritten en agenda met de snelheid van licht. De #1 keuze voor professionele koeriers en ondernemers.",
    url: "https://zzp-hub.nl",
    siteName: "Elite Business Hub",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Elite Hub social preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Elite Business Hub | Slimmer Ondernemen voor ZZP'ers",
    description:
      "Beheer je facturen, ritten en agenda met de snelheid van licht. De #1 keuze voor professionele koeriers en ondernemers.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZZP HUB",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0f4c5c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="antialiased bg-[var(--background-secondary)] text-[var(--foreground)]"
      >
        {children}
        <SonnerToaster />
        <CookieBanner />
        <ServiceWorkerRegister />
        <InstallPWA />
      </body>
    </html>
  );
}
