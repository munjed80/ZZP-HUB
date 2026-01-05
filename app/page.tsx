import { LandingContent } from "@/components/landing/landing-content";
import { getServerAuthSession } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Professioneel financieel dashboard voor ZZP'ers. Beheer facturen, offertes, BTW-aangifte, uren en planning. Start vandaag nog met slimmer ondernemen.",
};

export default async function LandingPagina() {
  const session = await getServerAuthSession();

  return <LandingContent isLoggedIn={!!session?.user} />;
}
