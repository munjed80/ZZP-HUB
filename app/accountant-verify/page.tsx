import { AccountantVerifyContent } from "./accountant-verify-content";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Accountant Toegang",
  description: "Voer uw verificatiecode in om toegang te krijgen.",
};

export default function AccountantVerifyPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const tokenParam = searchParams?.token ? `?token=${encodeURIComponent(searchParams.token)}` : "";
  redirect(`/accountant-invite${tokenParam}`);
}
