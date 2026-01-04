import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SonnerToaster } from "@/components/providers/sonner-provider";
import { CookieBanner } from "@/components/ui/cookie-banner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "ZZP-HUB | Elite Business Management for Professionals",
  description:
    "Elite Business Management for Professionals. All-in-one administratie, facturen, uren en BTW-aangifte in een premium financiële uitstraling.",
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: "ZZP-HUB | Elite Business Management voor Professionals",
    description:
      "Beheer je business met een premium financiële look: facturen, uren, BTW en rapportages in één strak dashboard.",
    url: "https://zzp-hub.nl",
    siteName: "ZZP-HUB",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "ZZP-HUB premium hero" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZZP-HUB | Elite Business Management",
    description:
      "Premium financieel dashboard voor ZZP'ers met facturen, uren, BTW en rapportages.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8F9FA] text-slate-900`}
      >
        {children}
        <SonnerToaster />
        <CookieBanner />
      </body>
    </html>
  );
}
