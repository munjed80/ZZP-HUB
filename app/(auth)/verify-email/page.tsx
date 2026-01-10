"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react";
import { verifyEmailToken } from "./actions";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus("error");
        setMessage("Geen verificatietoken gevonden.");
        return;
      }

      const result = await verifyEmailToken(token);
      
      if (result.success) {
        setStatus("success");
        // Redirect to setup after a short delay
        setTimeout(() => {
          router.push("/setup");
        }, 2000);
      } else {
        setStatus("error");
        setMessage(result.message || "Verificatie mislukt.");
      }
    }

    verify();
  }, [token, router]);

  return (
    <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB • E-mailverificatie
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {status === "loading" && "E-mail verifiëren..."}
          {status === "success" && "E-mail geverifieerd!"}
          {status === "error" && "Verificatie mislukt"}
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
            Een moment geduld, we verifiëren je e-mailadres...
          </p>
        )}
        {status === "success" && (
          <>
            <p className="text-sm text-card-foreground">
              Je e-mailadres is succesvol geverifieerd!
            </p>
            <p className="text-xs text-muted-foreground">
              Je wordt doorgestuurd naar de setup...
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-sm text-card-foreground">{message}</p>
            <div className="space-y-3 pt-4">
              <Link
                href="/resend-verification"
                className={buttonVariants(
                  "primary",
                  "w-full justify-center text-base py-3"
                )}
              >
                Nieuwe verificatie-e-mail aanvragen
              </Link>
              <Link
                href="/login"
                className="block text-center text-sm text-primary underline-offset-4 hover:underline"
              >
                Terug naar inloggen
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-16 w-16 animate-spin text-primary" aria-hidden />
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
