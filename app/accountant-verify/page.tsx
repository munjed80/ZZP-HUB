import { AccountantVerifyContent } from "./accountant-verify-content";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Accountant Toegang",
  description: "Voer uw verificatiecode in om toegang te krijgen.",
};

export default async function AccountantVerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await searchParams;
  const tokenParam = resolvedParams?.token ? `?token=${encodeURIComponent(resolvedParams.token)}` : "";
  redirect(`/accountant-invite${tokenParam}`);
}
