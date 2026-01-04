import type { Metadata } from "next";
import "./globals.css";
import { SonnerToaster } from "@/components/providers/sonner-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";

export const metadata: Metadata = {
  title: "Elite Business Hub | Slimmer Ondernemen voor ZZP'ers",
  applicationName: "ZZP HUB",
  description:
    "Beheer je facturen, ritten en agenda met de snelheid van licht. De #1 keuze voor professionele koeriers en ondernemers.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
  themeColor: "#0A2E50",
  manifest: "/manifest.webmanifest",
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
        <link rel="apple-touch-icon" href="/favicon.svg" />
      </head>
      <body
        className="antialiased bg-[var(--background-secondary)] text-[var(--foreground)]"
      >
        {children}
        <SonnerToaster />
        <CookieBanner />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
