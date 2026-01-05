import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SonnerToaster } from "@/components/providers/sonner-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { ServiceWorkerRegister } from "@/components/providers/service-worker-register";
import { InstallPWA } from "@/components/ui/install-pwa";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeScript } from "@/components/providers/theme-script";

export const metadata: Metadata = {
  metadataBase: new URL("https://zzp-hub.app"),
  title: {
    default: "ZZP-HUB | Financieel dashboard voor zzp'ers",
    template: "%s | ZZP-HUB",
  },
  applicationName: "ZZP HUB",
  authors: [{ name: "MHM IT" }],
  description:
    "Professioneel, mobiel-first financieel dashboard voor ZZP'ers. Beheer facturen, offertes, BTW-aangifte, uren en planning met premium templates en PWA support.",
  keywords: [
    "zzp hub",
    "facturatie",
    "btw aangifte",
    "urenregistratie",
    "pwa",
    "financieel dashboard",
    "zzp app",
  ],
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
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: "https://zzp-hub.app/",
    siteName: "ZZP-HUB",
    title: "ZZP-HUB | Financieel dashboard voor zzp'ers",
    description:
      "Professioneel, mobiel-first financieel dashboard voor ZZP'ers met facturen, offertes, BTW en PWA-ondersteuning.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ZZP-HUB social preview" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZZP-HUB | Financieel dashboard voor zzp'ers",
    description:
      "Modern ZZP-dashboard met facturatie, BTW-hulp en agenda. Optimaliseer je business mobiel-first.",
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
    <html lang="nl" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className="antialiased bg-[var(--background-secondary)] text-[var(--foreground)]"
      >
        <ThemeProvider>
          {children}
          <SonnerToaster />
          <CookieBanner />
          <ServiceWorkerRegister />
          <InstallPWA />
        </ThemeProvider>
      </body>
    </html>
  );
}
