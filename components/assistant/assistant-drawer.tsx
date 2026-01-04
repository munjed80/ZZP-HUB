"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Loader2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

const exampleQuestions = [
  "Wat doet ZZP HUB voor mijn facturen?",
  "Hoe start ik met ZZP HUB?",
  "Hoe houd ik het 1225-urencriterium bij?",
  "Wat kost het abonnement?",
  "Wat zit er in het BTW-overzicht?",
];

export function AssistantDrawer() {
  const [open, setOpen] = useState(false);
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
      const response = await fetch("/api/ai-assistant", {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          buttonVariants("primary"),
          "fixed bottom-24 right-4 z-40 shadow-lg shadow-teal-200/60 px-4 py-2 text-sm md:right-6 md:bottom-6",
        )}
      >
        <MessageCircle className="h-4 w-4" aria-hidden />
        Hulp nodig?
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <button
            aria-label="Sluit hulp"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-full max-w-md bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">AI product assistent</p>
                  <h3 className="text-lg font-semibold text-slate-900">Snelle hulp binnen het product</h3>
                  <p className="text-xs text-slate-600">
                    Beantwoordt alleen vragen over ZZP HUB, facturen, BTW, uren en abonnement.
                  </p>
                </div>
                <ShieldCheck className="h-5 w-5 text-teal-600" aria-hidden />
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-600">
                  Geen open chat. Kies een voorbeeldvraag of stel één gerichte vraag binnen de scope. Buiten scope? Dan
                  verwijzen we naar support.
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-800">Voorbeeldvragen</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {exampleQuestions.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => askAssistant(q)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/60"
                      >
                        <span className="flex items-start gap-2">
                          <Sparkles className="mt-0.5 h-4 w-4 text-teal-600" aria-hidden />
                          {q}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800" htmlFor="assistant-question">
                    Eigen vraag (één onderwerp)
                  </label>
                  <textarea
                    id="assistant-question"
                    value={question}
                    maxLength={260}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Bijvoorbeeld: Hoe maak ik mijn eerste factuur?"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                <button
                  type="button"
                  onClick={() => askAssistant(question)}
                  className={cn(
                    buttonVariants("primary"),
                    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-sm shadow-teal-200",
                  )}
                  disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
                    Vraag beantwoording
                  </button>
                </div>

                {error ? <p className="text-sm text-amber-700">{error}</p> : null}

                {answer ? (
                  <div className="space-y-2 rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-slate-800 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Antwoord</p>
                    <p>{answer}</p>
                    <p className="text-xs text-slate-600">Binnen scope. Voor andere vragen kun je contact opnemen met support.</p>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-3 text-xs text-slate-600">
                Heb je andere vragen? Mail ons via support@zzp-hub.nl of ga naar de{" "}
                <a href="/support" className="font-semibold text-teal-700 underline underline-offset-4">
                  supportpagina
                </a>
                .
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
