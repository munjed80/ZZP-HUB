"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type SidebarBrandProps = {
  collapsed?: boolean;
  className?: string;
};

export function SidebarBrand({ collapsed, className }: SidebarBrandProps) {
  if (collapsed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-border bg-card/90 p-2 shadow-sm",
          className,
        )}
      >
        <div className="relative">
          <Image src="/favicon.svg" alt="ZZP HUB" width={32} height={32} className="h-8 w-8" priority />
          <span className="absolute -right-1 -top-1 inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-2xl border border-border bg-card/95 px-3 py-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
          <Image src="/favicon.svg" alt="ZZP HUB" width={28} height={28} className="h-7 w-7" priority />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-semibold tracking-tight text-foreground">ZZP HUB</p>
          <p className="text-xs text-muted-foreground">Financiën &amp; abonnement</p>
        </div>
      </div>
      <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
        Pro
      </span>
    </div>
  );
}
