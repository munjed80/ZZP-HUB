"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Lock, Mail, Sparkles, Home } from "lucide-react";
import { Suspense, useState } from "react";
import { safeNextUrl } from "@/lib/auth/safe-next";

const schema = z.object({
  email: z.string().email("Voer een geldig e-mailadres in"),
  password: z.string().min(6, "Minimaal 6 tekens"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPagina() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    const requestedRedirect = searchParams.get("next") ?? searchParams.get("callbackUrl");
    const target = safeNextUrl(requestedRedirect, "/dashboard");
    router.push(target);
    router.refresh();
  };

  return (
    <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            ZZP-HUB Dashboard
          </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">Inloggen voor ZZP’ers en bedrijfseigenaren.</p>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welkom terug</h1>
          <p className="text-sm text-muted-foreground">Log in en beheer je facturen, klanten en BTW op één overzichtelijke plek.</p>
        </div>
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

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground" htmlFor="password">
            <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
            Wachtwoord
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

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/forgot-password"
            className="text-primary underline-offset-4 hover:underline"
          >
            Wachtwoord vergeten?
          </Link>
          <Link href="/register" className="text-muted-foreground hover:text-card-foreground">
            Nog geen account? <span className="text-primary">Meld je aan</span>
          </Link>
        </div>

        {error ? <p className="text-xs text-amber-700">{error}</p> : null}

        <button
          type="submit"
          className={buttonVariants(
            "primary",
            "w-full justify-center text-base py-3 shadow-[0_18px_48px_-30px_rgba(10,46,80,0.36)] hover:shadow-[0_22px_54px_-32px_rgba(27,73,101,0.32)]"
          )}
          disabled={loading}
        >
          {loading ? "Bezig met inloggen..." : "Inloggen"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="flex flex-col items-start gap-2 text-xs text-muted-foreground">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
        >
          <Home className="h-4 w-4" aria-hidden />
          Terug naar home
        </Link>
        <p>Veilig inloggen met je account.</p>
        <p className="text-muted-foreground">Beveiligde sessies via NextAuth en rolgebaseerde toegang.</p>
      </div>
    </div>
  );
}
