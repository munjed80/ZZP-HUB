import { LandingContent } from "@/components/landing/landing-content";
import { getServerAuthSession } from "@/lib/auth";

export default async function LandingPagina() {
  const session = await getServerAuthSession();

  return <LandingContent isLoggedIn={!!session?.user} />;
}
