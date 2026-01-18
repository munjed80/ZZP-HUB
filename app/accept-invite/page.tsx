import { AcceptInviteContent } from "./accept-invite-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Uitnodiging Accepteren",
  description: "Accepteer de uitnodiging om toegang te krijgen tot een bedrijf.",
};

export default function AcceptInvitePage() {
  return <AcceptInviteContent />;
}
