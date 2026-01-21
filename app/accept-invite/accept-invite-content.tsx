"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle, Sparkles, ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { safeNextUrl } from "@/lib/auth/safe-next";

type Status = "loading" | "success" | "error";

export function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    async function acceptInvite() {
      if (!token) {
        setStatus("error");
        setMessage("Geen uitnodiging gevonden.");
        return;
      }

      const response = await fetch("/api/accountants/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.status === 401) {
        const current = safeNextUrl(`${pathname}?token=${token}`, "/dashboard");
        const next = encodeURIComponent(current);
        router.push(`/login?next=${next}`);
        return;
      }

      if (!response.ok) {
        setStatus("error");
        setMessage("Uitnodiging ongeldig of verlopen.");
        return;
      }

      setStatus("success");
    }

    acceptInvite();
  }, [pathname, router, token]);

  return (
    <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB • Accountant toegang
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {status === "loading" && "Uitnodiging verwerken..."}
          {status === "success" && "Toegang verleend"}
          {status === "error" && "Uitnodiging ongeldig of verlopen"}
        </h1>
      </div>

      <div className="flex items-center justify-center py-8">
        {status === "loading" && (
          <div className="rounded-full bg-primary/10 p-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" aria-hidden />
          </div>
        )}
        {status === "success" && (
          <div className="rounded-full bg-success/10 p-6">
            <CheckCircle className="h-16 w-16 text-success" aria-hidden />
          </div>
        )}
        {status === "error" && (
          <div className="rounded-full bg-destructive/10 p-6">
            <XCircle className="h-16 w-16 text-destructive" aria-hidden />
          </div>
        )}
      </div>

      <div className="space-y-4 text-center">
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">
            Een moment geduld, we controleren je uitnodiging...
          </p>
        )}
        {status === "success" && (
          <div className="space-y-3">
            <p className="text-sm text-card-foreground">
              Je hebt nu toegang tot het dashboard.
            </p>
            <Link
              href="/dashboard"
              className={buttonVariants(
                "primary",
                "inline-flex items-center justify-center text-base py-3"
              )}
            >
              Ga naar dashboard
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-card-foreground">{message}</p>
            <p className="text-xs text-muted-foreground">
              Vraag de bedrijfseigenaar om een nieuwe uitnodiging te sturen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
