import { LandingContent } from "@/components/landing/landing-content";
import { getServerAuthSession } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Professioneel financieel dashboard voor ZZP'ers. Beheer facturen, offertes, BTW-aangifte, uren en planning. Start vandaag nog met slimmer ondernemen.",
};

export default async function LandingPagina() {
  let isLoggedIn = false;

  try {
    const session = await getServerAuthSession();
    isLoggedIn = !!session?.user;
  } catch (error) {
    console.error("[landing] Failed to load session, rendering logged-out view:", error);
  }

  return <LandingContent isLoggedIn={isLoggedIn} />;
}
