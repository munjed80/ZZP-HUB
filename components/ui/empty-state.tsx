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
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
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

