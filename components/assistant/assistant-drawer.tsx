"use client";

import { useState } from "react";
import { ArrowRight, Loader2, MessageCircle, ShieldCheck, Sparkles, X } from "lucide-react";
import { assistantGuide } from "@/lib/assistant/guide";
import { getPublicSupportEmail } from "@/lib/publicConfig";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildAbsoluteUrl } from "@/lib/base-url";

const SUPPORT_EMAIL = getPublicSupportEmail();

const exampleQuestions = [
  "Wat doet ZZP HUB voor mijn facturen?",
  "Hoe start ik met ZZP HUB?",
  "Hoe houd ik het 1225-urencriterium bij?",
  "Wat kost het abonnement?",
  "Wat zit er in het BTW-overzicht?",
];

type AssistantDrawerProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AssistantDrawer({ open: controlledOpen, onOpenChange }: AssistantDrawerProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  async function askAssistant(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setQuestion(trimmed);

    try {
      const response = await fetch(buildAbsoluteUrl("/api/ai-assistant"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? "Kon geen antwoord ophalen.");
        return;
      }
      setAnswer(data.answer);
    } catch (err) {
      console.error("AI assistant fout", err);
      setError("Er ging iets mis. Probeer het opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:inset-auto md:bottom-4 md:left-4 md:z-40 md:flex md:flex-col md:items-start md:gap-3 lg:bottom-6 lg:left-6 xl:bottom-8 xl:left-8">
      {/* Mobile backdrop */}
      <div
        className="absolute inset-0 bg-black/40 md:hidden"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      
      {/* Drawer content */}
      <div className="absolute bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto w-full md:w-[20rem] md:max-w-[calc(100vw-2rem)] rounded-t-2xl md:rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-teal-200/50 backdrop-blur animate-in slide-in-from-bottom md:slide-in-from-left duration-300">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700 ring-1 ring-teal-100">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              Product assistent
            </p>
            <p className="text-sm font-semibold text-slate-900">Snelle hulp binnen het dashboard</p>
            <p className="text-xs text-slate-600">
              Antwoorden uit interne gids over facturen, BTW, uren, starten en prijzen.
            </p>
          </div>
          <button
            type="button"
            aria-label="Sluit assistent"
            onClick={() => setOpen(false)}
            className="rounded-full p-1.5 text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary)/0.08)]"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-3 space-y-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">{assistantGuide.product.name}</p>
          <p>{assistantGuide.product.description}</p>
        </div>

        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Snelle vragen</p>
          <div className="flex flex-wrap gap-2">
            {exampleQuestions.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => askAssistant(q)}
                className="rounded-full border border-[rgb(var(--brand-primary))/0.28] bg-white px-3 py-1.5 text-xs font-medium text-[rgb(var(--brand-primary))] shadow-sm transition hover:-translate-y-0.5 hover:border-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary)/0.08)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-[rgb(var(--brand-primary))]" aria-hidden />
                  {q}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <label className="text-sm font-semibold text-slate-800" htmlFor="assistant-question">
            Stel een korte vraag
          </label>
          <textarea
            id="assistant-question"
            value={question}
            maxLength={260}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Bijvoorbeeld: Hoe verstuur ik mijn factuur?"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="button"
            onClick={() => askAssistant(question)}
            className={cn(
              buttonVariants("primary"),
              "w-full justify-center rounded-xl text-sm shadow-teal-200",
            )}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
            {loading ? "Beantwoorden..." : "Vraag beantwoorden"}
          </button>
        </div>

        {error ? <p className="mt-2 text-xs text-amber-700">{error}</p> : null}

        {answer ? (
          <div className="mt-3 space-y-2 rounded-xl border border-teal-100 bg-teal-50/80 p-3 text-sm text-slate-800 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Antwoord</p>
            <p>{answer}</p>
            <p className="text-[11px] text-slate-600">
              Binnen scope van de interne gids. Andere vragen? Gebruik het supportformulier.
            </p>
          </div>
        ) : null}

        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] text-slate-600">
          <p className="inline-flex items-center gap-2 font-semibold text-slate-800">
            <MessageCircle className="h-3.5 w-3.5 text-teal-600" aria-hidden />
            Extra hulp nodig?
          </p>
          <p>
            Mail {SUPPORT_EMAIL} of open{" "}
            <a href="/support" className="font-semibold text-teal-700 underline underline-offset-4">
              support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
