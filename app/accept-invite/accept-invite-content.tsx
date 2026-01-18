"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Loader2, Building2, Mail, UserPlus } from "lucide-react";

// Error code to friendly message mapping
const ERROR_MESSAGES: Record<string, string> = {
  INVITE_NOT_FOUND: "Uitnodiging niet gevonden. De link is mogelijk ongeldig of verkeerd gekopieerd.",
  INVITE_EXPIRED: "Deze uitnodiging is verlopen. Vraag de uitnodiger om een nieuwe link te sturen.",
  INVITE_USED: "Deze uitnodiging is al geaccepteerd. U kunt inloggen om toegang te krijgen.",
  EMAIL_INVALID: "Het e-mailadres in de uitnodiging is ongeldig. Neem contact op met de uitnodiger.",
  LINK_FAILED: "Er is een fout opgetreden bij het koppelen van uw account. Probeer het later opnieuw.",
  DB_ERROR: "Er is een serverfout opgetreden. Probeer het later opnieuw.",
  MISSING_TOKEN: "Ongeldige uitnodigingslink. Er ontbreekt een token.",
};

interface InviteInfo {
  companyName?: string;
  email?: string;
  isNewUser?: boolean;
}

type PageStatus = "loading" | "ready" | "accepting" | "success" | "error";

export function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get token from URL
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  
  // Determine initial state based on whether we have a token
  const [status, setStatus] = useState<PageStatus>(() => token ? "loading" : "error");
  const [message, setMessage] = useState<string>(() => token ? "" : ERROR_MESSAGES.MISSING_TOKEN);
  const [errorCode, setErrorCode] = useState<string | null>(() => token ? null : "MISSING_TOKEN");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo>({});

  // Validate the invite token
  const validateInvite = useCallback(async (inviteToken: string) => {
    try {
      const response = await fetch(`/api/invite/accept?token=${encodeURIComponent(inviteToken)}`);
      const data = await response.json();

      if (data.success) {
        setInviteInfo({
          companyName: data.companyName,
          email: data.email,
          isNewUser: data.isNewUser,
        });
        setStatus("ready");
      } else {
        setStatus("error");
        setErrorCode(data.errorCode || null);
        setMessage(data.errorCode ? ERROR_MESSAGES[data.errorCode] || data.message : data.message);
        toast.error(data.errorCode ? ERROR_MESSAGES[data.errorCode] || data.message : data.message);
      }
    } catch (error) {
      console.error("Error validating invite:", error);
      setStatus("error");
      setErrorCode("DB_ERROR");
      setMessage(ERROR_MESSAGES.DB_ERROR);
    }
  }, []);

  // Accept the invite
  const acceptInvitation = useCallback(async () => {
    if (!token) return;

    setStatus("accepting");

    try {
      const response = await fetch("/api/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setInviteInfo((prev) => ({
          ...prev,
          isNewUser: data.isNewUser,
        }));
        toast.success(data.message);

        // Redirect to accountant portal for all users
        // New users will have a session created automatically
        setTimeout(() => {
          router.push("/accountant-portal");
        }, 1500);
      } else {
        setStatus("error");
        setErrorCode(data.errorCode || null);
        setMessage(data.errorCode ? ERROR_MESSAGES[data.errorCode] || data.message : data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      setStatus("error");
      setErrorCode("DB_ERROR");
      setMessage(ERROR_MESSAGES.DB_ERROR);
      toast.error(ERROR_MESSAGES.DB_ERROR);
    }
  }, [token, router]);

  useEffect(() => {
    // Skip if no token - state is already set in initialization
    if (!token) {
      return;
    }

    // Note: validateInvite is an async function that fetches data and updates state based on response.
    // This is a valid use case for calling an async function from useEffect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    validateInvite(token);
  }, [token, validateInvite]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* Loading state - validating token */}
          {status === "loading" && (
            <div className="text-center">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Uitnodiging Laden
              </h1>
              <p className="text-muted-foreground">
                Even geduld terwijl we uw uitnodiging valideren...
              </p>
            </div>
          )}

          {/* Ready state - show accept button */}
          {status === "ready" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Uitnodiging Ontvangen
              </h1>
              <p className="text-muted-foreground mb-6">
                U bent uitgenodigd om toegang te krijgen tot:
              </p>
              
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-lg font-semibold text-foreground">
                  {inviteInfo.companyName || "Bedrijf"}
                </p>
                {inviteInfo.email && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{inviteInfo.email}</span>
                  </div>
                )}
              </div>

              {inviteInfo.isNewUser && (
                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4 mb-6 text-left">
                  <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Nieuw account wordt aangemaakt
                    </p>
                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                      Er wordt automatisch een account voor u aangemaakt. U krijgt direct toegang na acceptatie.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={acceptInvitation}
                disabled={false}
                className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                Uitnodiging Accepteren
              </button>
            </div>
          )}

          {/* Accepting state - processing */}
          {status === "accepting" && (
            <div className="text-center">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Uitnodiging Verwerken
              </h1>
              <p className="text-muted-foreground">
                Even geduld terwijl we uw uitnodiging accepteren...
              </p>
            </div>
          )}

          {/* Success state */}
          {status === "success" && (
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Uitnodiging Geaccepteerd!
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <p className="text-sm text-muted-foreground">
                U wordt doorgestuurd naar het Accountant Portal...
              </p>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="text-center">
              <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Fout bij Uitnodiging
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              {errorCode && (
                <p className="text-xs text-muted-foreground mb-4">
                  Foutcode: {errorCode}
                </p>
              )}

              <div className="space-y-3">
                {errorCode === "INVITE_USED" && (
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                  >
                    Ga naar Inloggen
                  </button>
                )}
                <button
                  onClick={() => router.push("/")}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${
                    errorCode === "INVITE_USED"
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  Ga naar Homepage
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
