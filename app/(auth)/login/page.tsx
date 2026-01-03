"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Lock, Mail, Sparkles } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  email: z.string().email("Voer een geldig e-mailadres in"),
  password: z.string().min(6, "Minimaal 6 tekens"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPagina() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
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
    <div className="space-y-8 rounded-[32px] bg-white/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-slate-100">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB • Invisible UI
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welkom terug</h1>
        <p className="text-sm text-slate-600">Cinematic login met mesh glow. Log in en ga direct premium aan het werk.</p>
      </div>

      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-800" htmlFor="email">
            <Mail className="h-4 w-4 text-slate-400" aria-hidden />
            E-mailadres
          </label>
          <input
            id="email"
            type="email"
            required
            className="w-full border-0 border-b border-slate-200 bg-transparent px-1 pb-3 pt-1 text-sm text-slate-900 transition-all duration-300 focus:border-b-[2px] focus:border-indigo-500 focus:outline-none focus:ring-0"
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
            className="w-full border-0 border-b border-slate-200 bg-transparent px-1 pb-3 pt-1 text-sm text-slate-900 transition-all duration-300 focus:border-b-[2px] focus:border-indigo-500 focus:outline-none focus:ring-0"
            {...form.register("password")}
            aria-invalid={!!form.formState.errors.password}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-amber-700">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="mailto:support@zzp-hub.nl?subject=Wachtwoord%20vergeten"
            className="text-indigo-700 underline-offset-4 hover:underline"
          >
            Wachtwoord vergeten?
          </Link>
          <Link href="/register" className="text-slate-600 hover:text-slate-800">
            Nog geen account? <span className="text-indigo-700">Meld je aan</span>
          </Link>
        </div>

        {error ? <p className="text-xs text-amber-700">{error}</p> : null}

        <button
          type="submit"
          className={buttonVariants(
            "primary",
            "w-full justify-center text-base py-3 shadow-indigo-500/20 shadow-lg hover:shadow-indigo-500/35"
          )}
          disabled={loading}
        >
          {loading ? "Bezig met inloggen..." : "Inloggen"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="flex flex-col items-start gap-2 text-xs text-slate-500">
        <p>Mesh gradient beveiligd, invisible inputs, premium flow.</p>
        <p className="text-slate-400">Beveiligde sessies via NextAuth en rolgebaseerde toegang.</p>
      </div>
    </div>
  );
}
