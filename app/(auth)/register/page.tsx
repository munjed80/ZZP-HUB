"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import { registerCompany } from "./actions";
import { registerSchema, type RegisterInput } from "./schema";
import { useState, useTransition } from "react";

export default function RegisterPagina() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "ZZP", bedrijfsnaam: "", email: "", password: "" },
  });

  const onSubmit = (data: RegisterInput) => {
    setError(null);
    startTransition(async () => {
      const result = await registerCompany(data);
      if (!result.success) {
        setError(result.message ?? "Registratie mislukt.");
        return;
      }

      // Redirect to check email page instead of auto-login
      router.push("/check-email");
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Account aanmaken</h1>
        <p className="text-sm text-white/70">Start vandaag nog met 14 dagen gratis</p>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/90" htmlFor="bedrijfsnaam">
            <Building2 className="h-4 w-4 text-white/60" aria-hidden />
            Bedrijfsnaam
          </label>
          <input
            id="bedrijfsnaam"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 transition-all duration-200 focus:border-emerald-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            placeholder="Jouw bedrijfsnaam"
            {...form.register("bedrijfsnaam")}
            aria-invalid={!!form.formState.errors.bedrijfsnaam}
          />
          {form.formState.errors.bedrijfsnaam && (
            <p className="text-xs text-amber-300">{form.formState.errors.bedrijfsnaam.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/90" htmlFor="email">
            <Mail className="h-4 w-4 text-white/60" aria-hidden />
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 transition-all duration-200 focus:border-emerald-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            placeholder="jouw@email.nl"
            {...form.register("email")}
            aria-invalid={!!form.formState.errors.email}
          />
          {form.formState.errors.email && <p className="text-xs text-amber-300">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/90" htmlFor="password">
            <Lock className="h-4 w-4 text-white/60" aria-hidden />
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 transition-all duration-200 focus:border-emerald-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            placeholder="Minimaal 6 tekens"
            {...form.register("password")}
            aria-invalid={!!form.formState.errors.password}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-amber-300">{form.formState.errors.password.message}</p>
          )}
        </div>

        {error ? <p className="text-sm text-amber-300">{error}</p> : null}

        <button
          type="submit"
          className={buttonVariants(
            "primary",
            "w-full justify-center rounded-xl py-3 text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30"
          )}
          disabled={isPending}
        >
          {isPending ? "Bezig met aanmaken..." : "Account aanmaken"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-white/60">
          Al een account?{" "}
          <Link href="/login" className="font-medium text-emerald-300 transition-colors hover:text-emerald-200">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
