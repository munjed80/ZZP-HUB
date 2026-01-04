import Link from "next/link";
import type { ReactNode } from "react";
import { FileQuestion } from "lucide-react";
import { buttonVariants } from "./button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
  className?: string;
};

export function EmptyState({
  title = "Nog geen facturen gevonden",
  description = "Start met je eerste factuur om betalingen en herinneringen te automatiseren.",
  actionHref = "/facturen/nieuw",
  actionLabel = "Maak je eerste factuur aan",
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 px-6 py-10 text-center shadow-[0_14px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/5 text-slate-900 ring-1 ring-slate-200">
        {icon ?? <FileQuestion className="h-5 w-5" aria-hidden />}
      </div>
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <Link href={actionHref} className={buttonVariants("primary")}>
        {actionLabel}
      </Link>
    </div>
  );
}
