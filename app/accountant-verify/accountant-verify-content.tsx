"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { CheckCircle2, XCircle, Loader2, Building2, Shield, KeyRound, LogOut } from "lucide-react";

// Error code to friendly message mapping
const ERROR_MESSAGES: Record<string, string> = {
  INVITE_NOT_FOUND: "Uitnodiging niet gevonden. De link is mogelijk ongeldig of verkeerd gekopieerd.",
  INVITE_EXPIRED: "Deze uitnodiging is verlopen. Vraag de uitnodiger om een nieuwe link te sturen.",
  INVITE_USED: "Deze uitnodiging is al geaccepteerd.",
  OTP_EXPIRED: "De verificatiecode is verlopen. Vraag een nieuwe code aan de uitnodiger.",
  OTP_INVALID: "Ongeldige verificatiecode. Controleer de code en probeer het opnieuw.",
  MISSING_TOKEN: "Ongeldige uitnodigingslink. Er ontbreekt een token.",
  DB_ERROR: "Er is een serverfout opgetreden. Probeer het later opnieuw.",
};

interface InviteInfo {
  companyName?: string;
  email?: string;
}

type PageStatus = "loading" | "ready" | "verifying" | "success" | "error";

export function AccountantVerifyContent({ isAccountant = true }: { isAccountant?: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get token from URL
  const token = useMemo(() => searchParams.get("token"), [searchParams]);
  
  // Determine initial state based on whether we have a token
  const [status, setStatus] = useState<PageStatus>(() => token ? "loading" : "error");
  const [message, setMessage] = useState<string>(() => token ? "" : ERROR_MESSAGES.MISSING_TOKEN);
  const [errorCode, setErrorCode] = useState<string | null>(() => token ? null : "MISSING_TOKEN");
  const [inviteInfo, setInviteInfo] = useState<InviteInfo>({});
  
  // OTP input state - 6 individual digits
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Validate the invite token
  const validateInvite = useCallback(async (inviteToken: string) => {
    try {
      const response = await fetch(`/api/accountant-access/validate?token=${encodeURIComponent(inviteToken)}`);
      const data = await response.json();

      if (data.success) {
        setInviteInfo({
          companyName: data.companyName,
          email: data.email,
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

  // Handle OTP input change
  const handleOtpChange = useCallback((index: number, value: string) => {
    // Only allow numeric input
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otpDigits]);

  // Handle backspace
  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otpDigits]);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      
      // Focus last filled input or first empty one
      const lastIndex = Math.min(pastedData.length, 6) - 1;
      inputRefs.current[lastIndex]?.focus();
    }
  }, [otpDigits]);

  // Verify OTP and complete access
  const verifyOTP = useCallback(async () => {
    if (!token) return;

    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      toast.error("Voer alle 6 cijfers van de verificatiecode in.");
      return;
    }

    setStatus("verifying");

    try {
      const response = await fetch("/api/accountant-access/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, otpCode }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        toast.success(data.message);

        // Redirect to accountant portal
        setTimeout(() => {
          router.push("/accountant-portal");
        }, 1500);
      } else {
        setStatus("ready"); // Go back to ready state so user can retry
        setErrorCode(data.errorCode || null);
        const errorMsg = data.errorCode ? ERROR_MESSAGES[data.errorCode] || data.message : data.message;
        setMessage(errorMsg);
        toast.error(errorMsg);
        
        // Clear OTP on invalid code
        if (data.errorCode === "OTP_INVALID") {
          setOtpDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setStatus("ready");
      setErrorCode("DB_ERROR");
      setMessage(ERROR_MESSAGES.DB_ERROR);
      toast.error(ERROR_MESSAGES.DB_ERROR);
    }
  }, [token, otpDigits, router]);

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

  const isOtpComplete = otpDigits.every(d => d !== "");

  if (!isAccountant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Boekhouder-account nodig</h1>
            <p className="text-muted-foreground">
              Je bent ingelogd met een ander accounttype. Log uit en kies &quot;Accountant&quot; bij het inloggen om de uitnodiging te accepteren.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: "/login?type=accountant" })}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Uitloggen en wisselen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          {/* Loading state - validating token */}
          {status === "loading" && (
            <div className="text-center">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Link Valideren
              </h1>
              <p className="text-muted-foreground">
                Even geduld terwijl we uw toegangslink valideren...
              </p>
            </div>
          )}

          {/* Ready state - show OTP input */}
          {status === "ready" && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Verificatie Vereist
              </h1>
              <p className="text-muted-foreground mb-2">
                Voer de 6-cijferige code in die u per e-mail heeft ontvangen.
              </p>
              
              {inviteInfo.companyName && (
                <div className="bg-muted/50 rounded-lg p-3 mb-6 flex items-center justify-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{inviteInfo.companyName}</span>
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <button
                onClick={verifyOTP}
                disabled={!isOtpComplete}
                className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <KeyRound className="h-5 w-5" />
                Verifiëren & Toegang
              </button>

              <p className="text-xs text-muted-foreground mt-4">
                Heeft u geen code ontvangen? Vraag de uitnodiger om een nieuwe code te sturen.
              </p>
            </div>
          )}

          {/* Verifying state - processing */}
          {status === "verifying" && (
            <div className="text-center">
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Code Verifiëren
              </h1>
              <p className="text-muted-foreground">
                Even geduld terwijl we uw code controleren...
              </p>
            </div>
          )}

          {/* Success state */}
          {status === "success" && (
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Toegang Verleend!
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
                Toegang Geweigerd
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              
              {errorCode && (
                <p className="text-xs text-muted-foreground mb-4">
                  Foutcode: {errorCode}
                </p>
              )}

              <button
                onClick={() => router.push("/")}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              >
                Ga naar Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
