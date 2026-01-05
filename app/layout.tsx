import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SonnerToaster } from "@/components/providers/sonner-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";
import { InstallPWA } from "@/components/ui/install-pwa";

export const metadata: Metadata = {
  metadataBase: new URL("https://matrixtop.com"),
  title: {
    default: "ZZP-HUB | Elite Business Hub",
    template: "%s | ZZP-HUB",
  },
  applicationName: "ZZP HUB",
  authors: [{ name: "MHM IT" }],
  description:
    "Professioneel financieel dashboard voor ZZP'ers. Beheer facturen, offertes, BTW-aangifte, uren en planning. De #1 keuze voor Nederlandse ondernemers.",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "ZZP-HUB",
    title: "ZZP-HUB | Elite Business Hub",
    description:
      "Professioneel financieel dashboard voor ZZP'ers. Beheer facturen, offertes, BTW-aangifte, uren en planning. De #1 keuze voor Nederlandse ondernemers.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ZZP-HUB social preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZZP-HUB | Elite Business Hub",
    description:
      "Professioneel financieel dashboard voor ZZP'ers. Beheer facturen, offertes, BTW-aangifte, uren en planning. De #1 keuze voor Nederlandse ondernemers.",
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
