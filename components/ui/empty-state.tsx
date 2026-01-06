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
  tone?: "neutral" | "dark";
};

export function EmptyState({
  title = "Nog geen facturen gevonden",
  description = "Start met je eerste factuur om betalingen en herinneringen te automatiseren.",
  actionHref = "/facturen/nieuw",
  actionLabel = "Maak je eerste factuur aan",
  icon,
  className,
  tone = "neutral",
}: EmptyStateProps) {
  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center",
        isDark ? "border-[#123C37] bg-[#0F2F2C]/70 shadow-[0_18px_46px_-30px_rgba(0,0,0,0.6)]" : "border-border bg-muted/30",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border",
          isDark ? "border-[#1FBF84]/30 bg-[#123C37] text-[#CFEDEA]" : "bg-muted text-muted-foreground border-border",
        )}
      >
        {icon ?? <FileQuestion className="h-5 w-5" aria-hidden />}
      </div>
      <div className="space-y-1">
        <p className={cn("text-lg font-semibold", isDark ? "text-white" : "text-foreground")}>{title}</p>
        <p className={cn("text-sm", isDark ? "text-[#9FCBC4]" : "text-muted-foreground")}>{description}</p>
      </div>
      <Link
        href={actionHref}
        className={buttonVariants(
          "primary",
          isDark
            ? "bg-gradient-to-r from-[#0F5E57] via-[#0E6F64] to-[#0B4E48] text-white shadow-[0_18px_44px_-24px_rgba(15,94,87,0.85)]"
            : undefined,
        )}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
