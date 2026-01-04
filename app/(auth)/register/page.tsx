"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Building2, Lock, Mail, Sparkles } from "lucide-react";
import { registerCompany } from "./actions";
import { registerSchema, type RegisterInput } from "./schema";
import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";

export default function RegisterPagina() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { bedrijfsnaam: "", email: "", password: "" },
  });

  const onSubmit = (data: RegisterInput) => {
    setError(null);
    startTransition(async () => {
      const result = await registerCompany(data);
      if (!result.success) {
        setError(result.message ?? "Registratie mislukt.");
        return;
      }

      await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="space-y-8 rounded-[32px] bg-white/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-slate-100">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0a2e50]">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB • Elite aanmelding
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Start gratis proefperiode</h1>
        <p className="text-sm text-slate-600">Invisible inputs, cinematic flow en 14 dagen volledig gratis.</p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800" htmlFor="bedrijfsnaam">
            <Building2 className="h-4 w-4 text-slate-400" aria-hidden />
            Bedrijfsnaam
          </label>
          <input
            id="bedrijfsnaam"
            required
            className="w-full border-0 border-b border-slate-200 bg-transparent px-1 pb-3 pt-1 text-sm text-slate-900 transition-all duration-300 focus:border-b-[2px] focus:border-[#4A5568] focus:outline-none focus:ring-0"
            {...form.register("bedrijfsnaam")}
            aria-invalid={!!form.formState.errors.bedrijfsnaam}
          />
          {form.formState.errors.bedrijfsnaam && (
            <p className="text-xs text-amber-700">{form.formState.errors.bedrijfsnaam.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800" htmlFor="email">
            <Mail className="h-4 w-4 text-slate-400" aria-hidden />
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full border-0 border-b border-slate-200 bg-transparent px-1 pb-3 pt-1 text-sm text-slate-900 transition-all duration-300 focus:border-b-[2px] focus:border-[#4A5568] focus:outline-none focus:ring-0"
            {...form.register("email")}
            aria-invalid={!!form.formState.errors.email}
          />
          {form.formState.errors.email && <p className="text-xs text-amber-700">{form.formState.errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800" htmlFor="password">
            <Lock className="h-4 w-4 text-slate-400" aria-hidden />
            Wachtwoord
          </label>
          <input
            id="password"
            type="password"
            required
            className="w-full border-0 border-b border-slate-200 bg-transparent px-1 pb-3 pt-1 text-sm text-slate-900 transition-all duration-300 focus:border-b-[2px] focus:border-[#4A5568] focus:outline-none focus:ring-0"
            {...form.register("password")}
            aria-invalid={!!form.formState.errors.password}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-amber-700">{form.formState.errors.password.message}</p>
          )}
        </div>

        {error ? <p className="text-xs text-amber-700">{error}</p> : null}

        <button
          type="submit"
          className={buttonVariants(
            "primary",
            "w-full justify-center text-base py-3 shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] hover:shadow-[0_22px_54px_-32px_rgba(27,73,101,0.32)]"
          )}
          disabled={isPending}
        >
          {isPending ? "Bezig met aanmaken..." : "Account aanmaken"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="flex flex-col items-start gap-2 text-sm text-slate-600">
        <Link href="/login" className="text-[#0a2e50] underline-offset-4 hover:underline">
          Al een account? Log in
        </Link>
        <p className="text-xs text-slate-500">Gelaagde beveiliging, premium UX, powered by MHM IT.</p>
      </div>
    </div>
  );
}
