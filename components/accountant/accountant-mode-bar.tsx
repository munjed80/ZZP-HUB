"use client";

import Link from "next/link";
import { LogOut, ArrowLeft } from "lucide-react";
import { signOut } from "next-auth/react";
import { PeriodFilter } from "@/components/ui/period-filter";

type AccountantModeBarProps = {
  companyName: string;
  backHref?: string;
};

export function AccountantModeBar({ companyName, backHref = "/accountant-portal" }: AccountantModeBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase">Accountant mode</span>
          <span className="text-sm font-semibold text-foreground truncate max-w-[260px]" title={companyName}>
            {companyName}
          </span>
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Terug naar bedrijven
          </Link>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Uitloggen
        </button>
      </div>
      <PeriodFilter />
    </div>
  );
}
