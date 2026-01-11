"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Suspense, useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  password: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn"),
  confirmPassword: z.string().min(8, "Wachtwoord moet minimaal 8 tekens zijn"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [loading, setLoading] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error("Ongeldige resetlink. Vraag een nieuwe aan.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Er is iets misgegaan. Probeer het opnieuw.");
        setLoading(false);
        return;
      }

      toast.success("Wachtwoord succesvol gewijzigd. Je kunt nu inloggen.");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            ZZP-HUB Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Ongeldige link</h1>
          <p className="text-sm text-muted-foreground">
            Deze resetlink is ongeldig of verlopen. Vraag een nieuwe aan.
          </p>
        </div>

        <Link
          href="/forgot-password"
          className={buttonVariants(
            "primary",
            "w-full justify-center text-base py-3 shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] hover:shadow-[0_22px_54px_-32px_rgba(27,73,101,0.32)]"
          )}
        >
          Nieuwe resetlink aanvragen
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB Dashboard
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nieuw wachtwoord instellen</h1>
        <p className="text-sm text-muted-foreground">
          Kies een sterk wachtwoord van minimaal 8 tekens.
        </p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground" htmlFor="password">
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
            Nieuw wachtwoord
          </label>
          <input
            id="password"
            type="password"
            required
            className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            {...form.register("password")}
            aria-invalid={!!form.formState.errors.password}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-amber-700">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground" htmlFor="confirmPassword">
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
            Bevestig wachtwoord
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            {...form.register("confirmPassword")}
            aria-invalid={!!form.formState.errors.confirmPassword}
          />
          {form.formState.errors.confirmPassword && (
            <p className="text-xs text-amber-700">{form.formState.errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          className={buttonVariants(
            "primary",
            "w-full justify-center text-base py-3 shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] hover:shadow-[0_22px_54px_-32px_rgba(27,73,101,0.32)]"
          )}
          disabled={loading}
        >
          {loading ? "Bezig met opslaan..." : "Wachtwoord opslaan"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="flex flex-col gap-3 text-sm">
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline text-center"
        >
          Terug naar login
        </Link>
      </div>
    </div>
  );
}
