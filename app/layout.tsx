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
  title: "Elite Business Hub | Slimmer Ondernemen voor ZZP'ers",
  description:
    "Beheer je facturen, ritten en agenda met de snelheid van licht. De #1 keuze voor professionele koeriers en ondernemers.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
  manifest: "/manifest.json",
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
        <link rel="apple-touch-icon" href="/favicon.ico" />
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
