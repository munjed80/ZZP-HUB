"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, Mail, MessageCircle } from "lucide-react";

type SupportFormProps = {
  context?: string;
  minimal?: boolean;
  className?: string;
};

export function SupportForm({ context, minimal, className }: SupportFormProps) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof formState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const payload = {
      ...formState,
      context,
    };

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setError(data?.error ?? "Verzenden mislukt.");
        return;
      }

      setStatus("success");
      setFormState({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Support formulier fout", err);
      setStatus("error");
      setError("Er ging iets mis. Probeer het later opnieuw.");
    }
  }

  if (status === "success") {
    return (
      <div className={cn("space-y-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-slate-800 shadow-sm", className)}>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Verzonden
        </div>
        <p className="text-base font-semibold text-slate-900">Dankjewel! We nemen spoedig contact op.</p>
        <p className="text-sm text-slate-700">
          Je supportverzoek is ontvangen. Je krijgt een bevestiging in je inbox en een reactie van ons team.
        </p>
        <button
          type="button"
          className={cn(buttonVariants("secondary"), "mt-2 w-fit")}
          onClick={() => setStatus("idle")}
        >
          Nieuw bericht sturen
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm backdrop-blur",
        minimal && "border-slate-100 bg-white/70 shadow-none",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <MessageCircle className="h-4 w-4 text-teal-600" aria-hidden />
        <span>Stuur ons een bericht</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">
            Naam
          </label>
          <input
            id="name"
            name="name"
            required
            value={formState.name}
            onChange={handleChange("name")}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formState.email}
              onChange={handleChange("email")}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="subject">
          Onderwerp
        </label>
        <input
          id="subject"
          name="subject"
          required
          value={formState.subject}
          onChange={handleChange("subject")}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="message">
          Bericht
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={minimal ? 4 : 5}
          value={formState.message}
          onChange={handleChange("message")}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {error ? <p className="text-sm text-amber-700">{error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">We antwoorden meestal binnen één werkdag.</p>
        <button
          type="submit"
          className={cn(
            buttonVariants("primary"),
            "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-sm shadow-teal-200",
          )}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Verzenden...
            </>
          ) : (
            "Verstuur bericht"
          )}
        </button>
      </div>
    </form>
  );
}
