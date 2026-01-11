"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Mail, Sparkles, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Voer een geldig e-mailadres in"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || "Er is iets misgegaan. Probeer het opnieuw.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
      toast.success("Als het e-mailadres bestaat, hebben we een resetlink verzonden.");
    } catch (error) {
      console.error(error);
      toast.error("Er is iets misgegaan. Probeer het opnieuw.");
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            ZZP-HUB Dashboard
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Check je inbox</h1>
          <p className="text-sm text-muted-foreground">
            Als het e-mailadres in ons systeem bestaat, hebben we een wachtwoordresetlink verzonden. 
            Check je inbox en spam folder.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Link
            href="/login"
            className={buttonVariants(
              "primary",
              "w-full justify-center text-base py-3 shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] hover:shadow-[0_22px_54px_-32px_rgba(27,73,101,0.32)]"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Terug naar login
          </Link>
        </div>
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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Wachtwoord vergeten?</h1>
        <p className="text-sm text-muted-foreground">
          Vul je e-mailadres in en we sturen je een link om je wachtwoord te resetten.
        </p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground" htmlFor="email">
            <Mail className="h-4 w-4 text-muted-foreground" aria-hidden />
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            {...form.register("email")}
            aria-invalid={!!form.formState.errors.email}
          />
          {form.formState.errors.email && <p className="text-xs text-amber-700">{form.formState.errors.email.message}</p>}
        </div>

        <button
          type="submit"
          className={buttonVariants(
            "primary",
            "w-full justify-center text-base py-3 shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] hover:shadow-[0_22px_54px_-32px_rgba(27,73,101,0.32)]"
          )}
          disabled={loading}
        >
          {loading ? "Bezig met verzenden..." : "Resetlink versturen"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="flex flex-col gap-3 text-sm">
        <Link
          href="/login"
          className="text-primary underline-offset-4 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Terug naar login
        </Link>
      </div>
    </div>
  );
}
