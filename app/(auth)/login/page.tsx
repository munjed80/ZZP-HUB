"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Suspense, useState } from "react";
import { safeNextUrl } from "@/lib/auth/safe-next";

const schema = z.object({
  email: z.string().email("Voer een geldig e-mailadres in"),
  password: z.string().min(6, "Minimaal 6 tekens"),
});

type FormData = z.infer<typeof schema>;

/**
 * Fetch user profile from /api/auth/me to get the actual role from database.
 * Returns the role or null if the request fails.
 */
async function fetchUserRole(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return null;
    const data = await response.json();
    console.log("[LOGIN] ME endpoint response:", data);
    return data.role || null;
  } catch (error) {
    console.error("[LOGIN] Failed to fetch user role:", error);
    return null;
  }
}

/**
 * Determine the default landing page based on user role.
 * - ACCOUNTANT -> /accountant (accountant portal)
 * - Others (COMPANY_ADMIN, STAFF, SUPERADMIN) -> /dashboard
 */
function getDefaultLandingPage(role: string | null): string {
  if (role === "ACCOUNTANT") {
    return "/accountant";
  }
  return "/dashboard";
}

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

    // Fetch user role to determine the correct landing page
    const userRole = await fetchUserRole();
    const defaultLanding = getDefaultLandingPage(userRole);
    
    // If user explicitly requested a specific page, use that (validated)
    // Otherwise, use role-based default landing page
    const requestedRedirect = searchParams.get("next") ?? searchParams.get("callbackUrl");
    const target = requestedRedirect 
      ? safeNextUrl(requestedRedirect, defaultLanding)
      : defaultLanding;
    
    console.log("[LOGIN] Redirecting to:", target, "Role:", userRole);
    router.push(target);
    router.refresh();
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
      {/* Header */}
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welkom terug</h1>
        <p className="text-sm text-white/70">Log in om je dashboard te openen</p>
      </div>

      {/* Form */}
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
            placeholder="••••••••"
            {...form.register("password")}
            aria-invalid={!!form.formState.errors.password}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-amber-300">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-emerald-300 transition-colors hover:text-emerald-200"
          >
            Wachtwoord vergeten?
          </Link>
        </div>

        {error ? <p className="text-sm text-amber-300">{error}</p> : null}

        <button
          type="submit"
          className={buttonVariants(
            "primary",
            "w-full justify-center rounded-xl py-3 text-base font-semibold shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/30"
          )}
          disabled={loading}
        >
          {loading ? "Bezig met inloggen..." : "Inloggen"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-white/60">
          Nog geen account?{" "}
          <Link href="/register" className="font-medium text-emerald-300 transition-colors hover:text-emerald-200">
            Registreer gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
