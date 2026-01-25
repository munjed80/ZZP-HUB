import { requireOwnerPage } from "@/lib/auth/route-guards";
import { AIAssistClient } from "./ai-assist-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Assist",
  description: "AI-gestuurde assistent voor het maken van facturen, offertes en meer.",
};

export default async function AIAssistPage() {
  // Owner-only page guard
  await requireOwnerPage();

  return <AIAssistClient />;
}
