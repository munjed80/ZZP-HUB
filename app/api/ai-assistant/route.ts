import { NextResponse } from "next/server";
import { answerFromGuide, assistantGuide } from "@/lib/assistant/knowledge";

const scopeMessage =
  "Deze assistent antwoordt uitsluitend vanuit de interne productgids over: product, starten, facturen/offertes, BTW, uren (1225), prijzen/abonnement en support.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawQuestion = typeof body?.question === "string" ? body.question.trim() : "";

  if (!rawQuestion) {
    return NextResponse.json({ error: "Geen vraag ontvangen." }, { status: 400 });
  }

  const { answer, topic, followUps } = answerFromGuide(rawQuestion);

  return NextResponse.json({
    answer,
    topic,
    followUps,
    guide: assistantGuide,
    scope: scopeMessage,
  });
}
