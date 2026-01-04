"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Sparkles, Wand2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const demoQuestions = [
  "Hoe start ik met ZZP HUB?",
  "Hoe maak ik een factuur?",
  "Hoe zie ik mijn BTW-overzicht?",
];

export function AssistantDemo({ className }: { className?: string }) {
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk(q: string) {
    setLoading(true);
    setQuestion(q);
    setAnswer(null);

    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await response.json();
      setAnswer(data.answer ?? "Voor andere vragen kun je contact opnemen met support.");
    } catch (error) {
      console.error("assistant demo", error);
      setAnswer("Er ging iets mis. Probeer het later opnieuw.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn("space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-100">
            <Wand2 className="h-4 w-4" aria-hidden />
            Product assistent
          </p>
          <h3 className="text-xl font-semibold tracking-tight text-slate-900">Vraag & antwoord, binnen scope</h3>
          <p className="text-sm text-slate-600">Alleen productvragen over facturen, BTW, uren, prijzen en starten.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {demoQuestions.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleAsk(q)}
            className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50/80"
          >
            <Sparkles className="mt-0.5 h-4 w-4 text-teal-600" aria-hidden />
            {q}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
        {!question && <p>Kies een voorbeeldvraag om te zien hoe de assistent reageert.</p>}
        {question && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-teal-700 ring-1 ring-teal-100">Vraag</span>
              {question}
            </div>
            <div className="flex items-start gap-2">
              <span className="rounded-full bg-teal-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">Antwoord</span>
              <p className="text-slate-800">
                {loading ? (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Even kijken...
                  </span>
                ) : (
                  answer ?? "Voor andere vragen kun je contact opnemen met support."
                )}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-teal-100 bg-teal-50/60 px-4 py-3 text-xs text-slate-700">
        <div className="flex items-center gap-2 font-semibold text-teal-800">
          <ArrowRight className="h-4 w-4" aria-hidden />
          Buiten scope?
        </div>
        <p className="text-xs text-slate-600">Voor andere vragen kun je contact opnemen met support.</p>
        <a
          href="#support"
          className={cn(
            buttonVariants("secondary"),
            "w-fit rounded-lg bg-white text-sm font-semibold text-teal-800 shadow-sm",
          )}
        >
          Naar support
        </a>
      </div>
    </div>
  );
}
