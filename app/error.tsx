"use client";

import { useEffect } from "react";
import { RefreshCw, AlertCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    // In development, log to console for debugging
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
    // TODO: Send to error reporting service like Sentry in production
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4">
      <div className="text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-red-100 p-6">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
        </div>
        <h2 className="mb-4 text-3xl font-bold text-slate-900">
          Er is iets misgegaan.
        </h2>
        <p className="mb-8 text-lg text-slate-600">
          We konden je verzoek niet verwerken. Probeer het opnieuw.
        </p>
        <button
          onClick={() => reset()}
          className={buttonVariants("primary", "inline-flex items-center gap-2 px-6 py-3 text-base font-semibold shadow-lg")}
        >
          <RefreshCw className="h-5 w-5" />
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}
