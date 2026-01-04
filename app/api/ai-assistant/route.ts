import { NextResponse } from "next/server";
import { assistantGuide } from "@/lib/assistant/guide";
import { answerFromKnowledge } from "@/lib/assistant/knowledge";

const scopeMessage =
  "Deze assistent antwoordt uitsluitend vanuit de interne productgids over: product, starten, facturen/offertes, BTW, uren (1225), prijzen/abonnement en support.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawQuestion = typeof body?.question === "string" ? body.question.trim() : "";

  if (!rawQuestion) {
    return NextResponse.json({ error: "Geen vraag ontvangen." }, { status: 400 });
  }

  try {
    const { answer, topic, followUps, source } = await answerFromKnowledge(rawQuestion);

    return NextResponse.json({
      answer,
      topic,
      followUps,
      knowledge: source,
      guide: assistantGuide,
      scope: scopeMessage,
    });
  } catch (error) {
    console.error("AI assistent kennisbank fout", error);
    return NextResponse.json({ error: "Assistent niet beschikbaar." }, { status: 500 });
  }
}
