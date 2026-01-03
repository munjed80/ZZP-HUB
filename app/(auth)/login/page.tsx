"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Voer een geldig e-mailadres in"),
  wachtwoord: z.string().min(6, "Minimaal 6 tekens"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPagina() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", wachtwoord: "" },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.wachtwoord,
    });

    if (result?.error) {
      setError("Ongeldige inloggegevens.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <Card className="relative overflow-hidden border border-slate-200/70 bg-white/80 shadow-[0_25px_90px_-45px_rgba(79,70,229,0.35)] backdrop-blur-xl ring-1 ring-white/70">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-indigo-200/50 blur-3xl" aria-hidden />
      <CardHeader className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Welkom terug</CardTitle>
        <p className="text-sm text-slate-600">Log in om je administratie te beheren.</p>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800" htmlFor="email">
              E-mailadres
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 pl-10 text-sm text-slate-900 shadow-[0_10px_40px_-28px_rgba(15,23,42,0.45)] transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/70 focus:shadow-[0_18px_50px_-34px_rgba(79,70,229,0.55)]"
                {...form.register("email")}
                aria-invalid={!!form.formState.errors.email}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-xs text-amber-700">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-800" htmlFor="wachtwoord">
              Wachtwoord
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" aria-hidden />
              <input
                id="wachtwoord"
                type="password"
                required
                className="w-full rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 pl-10 text-sm text-slate-900 shadow-[0_10px_40px_-28px_rgba(15,23,42,0.45)] transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300/70 focus:shadow-[0_18px_50px_-34px_rgba(79,70,229,0.55)]"
                {...form.register("wachtwoord")}
                aria-invalid={!!form.formState.errors.wachtwoord}
              />
            </div>
            {form.formState.errors.wachtwoord && (
              <p className="text-xs text-amber-700">{form.formState.errors.wachtwoord.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <Link
              href="mailto:support@zzp-hub.nl?subject=Wachtwoord%20vergeten"
              className="text-blue-700 hover:text-blue-800"
            >
              Wachtwoord vergeten?
            </Link>
            <Link href="/register" className="text-slate-600 hover:text-slate-800">
              Nog geen account? <span className="text-blue-700">Meld je aan</span>
            </Link>
          </div>

          {error ? <p className="text-xs text-amber-700">{error}</p> : null}

          <button
            type="submit"
            className={buttonVariants(
              "primary",
              "w-full justify-center text-base py-2.5 shadow-indigo-500/20 shadow-lg hover:-translate-y-0.5 hover:shadow-indigo-500/35 transition-all"
            )}
            disabled={loading}
          >
            {loading ? "Bezig met inloggen..." : "Inloggen"}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2 text-xs text-slate-500">
        <p className="text-center">Log in met je geregistreerde account.</p>
        <p className="text-center text-slate-400">Beveiligde sessies via NextAuth en rolgebaseerde toegang.</p>
      </CardFooter>
    </Card>
  );
}
