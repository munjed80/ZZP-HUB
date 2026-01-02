"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
    defaultValues: { bedrijfsnaam: "", email: "", wachtwoord: "" },
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
        password: data.wachtwoord,
      });

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <Card className="overflow-hidden border-slate-100 bg-white/95 shadow-xl">
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">ZZP-HUB</p>
        <CardTitle className="text-2xl text-slate-900">Start gratis proefperiode</CardTitle>
        <p className="text-sm text-slate-600">Geen creditcard nodig.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800" htmlFor="bedrijfsnaam">
              Bedrijfsnaam
            </label>
            <input
              id="bedrijfsnaam"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              {...form.register("bedrijfsnaam")}
              aria-invalid={!!form.formState.errors.bedrijfsnaam}
            />
            {form.formState.errors.bedrijfsnaam && (
              <p className="text-xs text-amber-700">{form.formState.errors.bedrijfsnaam.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800" htmlFor="email">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              {...form.register("email")}
              aria-invalid={!!form.formState.errors.email}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-amber-700">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800" htmlFor="wachtwoord">
              Wachtwoord
            </label>
            <input
              id="wachtwoord"
              type="password"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              {...form.register("wachtwoord")}
              aria-invalid={!!form.formState.errors.wachtwoord}
            />
            {form.formState.errors.wachtwoord && (
              <p className="text-xs text-amber-700">{form.formState.errors.wachtwoord.message}</p>
            )}
          </div>

          {error ? <p className="text-xs text-amber-700">{error}</p> : null}

          <button
            type="submit"
            className={buttonVariants("primary", "w-full justify-center text-base py-2.5")}
            disabled={isPending}
          >
            {isPending ? "Bezig met aanmaken..." : "Account aanmaken"}
          </button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2 text-sm text-slate-600">
        <Link href="/login" className="text-blue-700 hover:text-blue-800">
          Al een account? Log in
        </Link>
        <p className="text-xs text-slate-500">Maak een account aan om te starten met ZZP-HUB.</p>
      </CardFooter>
    </Card>
  );
}
