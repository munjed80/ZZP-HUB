import { NextResponse } from "next/server";

const scopeMessage =
  "Beperk antwoorden tot: wat ZZP HUB doet, starten met het product, facturen, btw/vat, urenregistratie (1225 uur), abonnement en prijs.";

type Topic = {
  id: string;
  keywords: string[];
  answer: string;
  followUps?: string[];
};

const knowledgeBase: Topic[] = [
  {
    id: "platform",
    keywords: ["wat doet", "zzp hub", "product", "platform", "hub"],
    answer:
      "ZZP HUB is een lichte financiële hub voor zzp'ers. Je beheert facturen, BTW-sync, urenregistratie en rapportages in één dashboard, inclusief automatische opvolging en veilige opslag.",
    followUps: ["Hoe start ik met ZZP HUB?", "Hoe maak ik mijn eerste factuur?", "Welke rapportages kan ik zien?"],
  },
  {
    id: "getting-started",
    keywords: ["start", "beginnen", "aanmelden", "hoe begin", "onboarding", "registreren"],
    answer:
      "Zo start je: 1) Registreer en log in, 2) vul je bedrijfsgegevens in Instellingen → Bedrijfsprofiel, 3) voeg klanten toe, 4) maak een factuur of offerte. Alles staat in het dashboard met duidelijke stappen.",
    followUps: ["Waar vul ik mijn bedrijfsgegevens in?", "Hoe voeg ik een klant toe?", "Hoe maak ik een factuur?"],
  },
  {
    id: "invoices",
    keywords: ["factuur", "facturen", "betalingen", "invoice"],
    answer:
      "Facturen maak je via Facturen → Nieuwe factuur. Je voegt regels toe, verstuurt via e-mail en volgt status (concept, verzonden, betaald). Betalingsstatus zie je direct in het overzicht.",
    followUps: ["Hoe verstuur ik een factuur?", "Kan ik PDF downloaden?", "Hoe zie ik of een factuur betaald is?"],
  },
  {
    id: "vat",
    keywords: ["btw", "vat", "aangifte", "belasting"],
    answer:
      "Bij BTW-aangifte toont ZZP HUB je omzet, voorbelasting en te betalen bedrag per periode. Ga naar BTW-aangifte in het dashboard voor een samenvatting die je kunt gebruiken bij het indienen bij de Belastingdienst.",
    followUps: ["Wat zie ik in het BTW-overzicht?", "Kan ik BTW periodes exporteren?", "Welke data heb ik nodig?"],
  },
  {
    id: "hours",
    keywords: ["uren", "1225", "urencriterium", "tijd", "registratie"],
    answer:
      "Houd het 1225-urencriterium bij via Uren. Start timers of log handmatig. Het dashboard toont je voortgang per periode zodat je weet of je op schema ligt.",
    followUps: ["Hoe start ik een timer?", "Kan ik uren handmatig toevoegen?", "Hoe zie ik mijn voortgang?"],
  },
  {
    id: "pricing",
    keywords: ["prijs", "abonnement", "kosten", "subscription", "pricing"],
    answer:
      "ZZP HUB heeft één premium plan: €4,99 per maand met 14 dagen gratis proberen. Inclusief facturen, BTW-overzicht, urenregistratie, rapportages en support. Opzeggen kan altijd.",
    followUps: ["Hoe werkt de proefperiode?", "Wat zit er in het abonnement?", "Kan ik later opzeggen?"],
  },
];

function findTopic(question: string): Topic | null {
  const normalized = question.toLowerCase();
  return knowledgeBase.find((topic) => topic.keywords.some((keyword) => normalized.includes(keyword))) ?? null;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawQuestion = typeof body?.question === "string" ? body.question.trim() : "";

  if (!rawQuestion) {
    return NextResponse.json({ error: "Geen vraag ontvangen." }, { status: 400 });
  }

  const topic = findTopic(rawQuestion);
  const answer =
    topic?.answer ?? "Voor andere vragen kun je contact opnemen met support.";

  return NextResponse.json({
    answer,
    topic: topic?.id ?? "out-of-scope",
    followUps: topic?.followUps ?? [],
    scope: scopeMessage,
  });
}
