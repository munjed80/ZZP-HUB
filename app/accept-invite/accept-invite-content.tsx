"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptInvite } from "@/app/actions/accountant-access-actions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const processInvite = useCallback(async (token: string) => {
    const result = await acceptInvite(token);

    if (result.success) {
      setStatus("success");
      setMessage(result.message);
      toast.success(result.message);
      
      // Redirect to accountant portal after 2 seconds
      setTimeout(() => {
        router.push("/accountant-portal");
      }, 2000);
    } else {
      setStatus("error");
      setMessage(result.message);
      toast.error(result.message);
    }
  }, [router]);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Ongeldige uitnodigingslink. Er ontbreekt een token.");
      return;
    }

    processInvite(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Uitnodiging Verwerken
              </h1>
              <p className="text-muted-foreground">
                Even geduld terwijl we uw uitnodiging verwerken...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Uitnodiging Geaccepteerd!
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground">
                U wordt doorgestuurd naar het Accountant Portal...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Fout bij Accepteren
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                Ga naar Dashboard
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
