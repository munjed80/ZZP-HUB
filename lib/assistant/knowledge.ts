export const assistantGuide = {
  product: {
    name: "ZZP HUB",
    description:
      "Premium financieel dashboard voor zzp'ers. Eén plek voor facturen, offertes, BTW-overzicht, urenregistratie en rapportage.",
    positioning: "Rustig, helder en betrouwbaar voor dagelijkse administratie.",
  },
  gettingStarted: [
    "Registreer en log in.",
    "Vul Bedrijfsprofiel in via Instellingen → Bedrijfsprofiel.",
    "Voeg relaties/klanten toe in Relaties.",
    "Maak je eerste factuur of offerte en verstuur per e-mail of download de PDF.",
    "Bekijk BTW-overzicht en uren voortgang in het dashboard.",
  ],
  features: [
    { title: "Facturen & Offertes", detail: "Maak, mail of download; status volgen (concept, verzonden, betaald)." },
    { title: "BTW-overzicht", detail: "Te betalen BTW per periode met omzet, kosten en voorbelasting." },
    { title: "Urenregistratie", detail: "Handmatige logging en timers voor het 1225-urencriterium." },
    { title: "Rapportage", detail: "Dashboard met omzet, kosten, winst, reservering en recente documenten." },
    { title: "Support", detail: "Supportformulier vanuit dashboard en Instellingen." },
  ],
  pricing: {
    plan: "Premium",
    pricePerMonth: "€4,99 per maand",
    trial: "14 dagen gratis proberen",
    cancellation: "Maandelijks opzegbaar",
    includes: ["Facturen & offertes", "BTW en uren", "Rapportages", "E-mail verzending", "Support NL"],
  },
  faq: [
    {
      question: "Hoe start ik?",
      answer: "Vul je bedrijfsprofiel in, voeg een klant toe en maak vanuit Facturen → Nieuwe factuur.",
    },
    { question: "Hoe verstuur ik?", answer: "Open de factuur en kies Delen → Verstuur via e-mail of Download PDF." },
    { question: "Wat kost het?", answer: "Premium €4,99 p/m, 14 dagen gratis, maandelijks opzegbaar." },
    { question: "Hoe houd ik 1225 uur bij?", answer: "Log uren in Uren; voortgang zie je op het dashboard." },
    { question: "Hoe krijg ik support?", answer: "Gebruik het supportformulier of mail support@zzp-hub.nl." },
  ],
} as const;

type MatchedAnswer = {
  topic: string;
  answer: string;
  followUps: string[];
};

const keywordRoutes: { keywords: string[]; topic: MatchedAnswer["topic"]; builder: () => MatchedAnswer }[] = [
  {
    keywords: ["start", "begin", "aanmelden", "registreren", "onboarding"],
    topic: "getting-started",
    builder: () => ({
      topic: "getting-started",
      answer: [
        "Zo begin je met ZZP HUB:",
        ...assistantGuide.gettingStarted.map((step, index) => `${index + 1}. ${step}`),
      ].join("\n"),
      followUps: ["Waar vul ik mijn bedrijfsprofiel in?", "Hoe voeg ik klanten toe?", "Hoe verstuur ik mijn eerste factuur?"],
    }),
  },
  {
    keywords: ["factuur", "facturen", "offerte", "verstuur", "betaald", "betaling", "pdf"],
    topic: "documents",
    builder: () => ({
      topic: "documents",
      answer: [
        "Facturen en offertes in ZZP HUB:",
        "- Maak een document via Facturen of Offertes.",
        "- Verstuur via Delen → E-mail of Download PDF.",
        "- Status volgt: concept, verzonden, betaald.",
      ].join("\n"),
      followUps: ["Hoe download ik de PDF?", "Kan ik opnieuw verzenden via e-mail?", "Hoe zie ik de betaalstatus?"],
    }),
  },
  {
    keywords: ["btw", "vat", "aangifte", "belasting"],
    topic: "vat",
    builder: () => ({
      topic: "vat",
      answer:
        "BTW-overzicht: toont omzet, kosten, te betalen BTW en voorbelasting per periode. Gebruik het overzicht bij je Belastingdienst-aangifte.",
      followUps: ["Welke periodes zie ik?", "Kan ik bedragen exporteren?", "Hoe wordt BTW berekend?"],
    }),
  },
  {
    keywords: ["uren", "1225", "urencriterium", "tijd"],
    topic: "hours",
    builder: () => ({
      topic: "hours",
      answer: "Urenregistratie: log handmatig of met timers. Het dashboard toont je voortgang richting 1225 uur.",
      followUps: ["Hoe start ik een timer?", "Kan ik uren corrigeren?", "Waar zie ik mijn totaal?"],
    }),
  },
  {
    keywords: ["prijs", "kosten", "abonnement", "trial", "proef"],
    topic: "pricing",
    builder: () => ({
      topic: "pricing",
      answer: `Pricing: ${assistantGuide.pricing.pricePerMonth} (${assistantGuide.pricing.plan}), ${assistantGuide.pricing.trial}, ${assistantGuide.pricing.cancellation}. Inclusief ${assistantGuide.pricing.includes.join(
        ", ",
      )}.`,
      followUps: ["Kan ik maandelijks opzeggen?", "Wat zit er in de trial?", "Welke features zijn inbegrepen?"],
    }),
  },
  {
    keywords: ["support", "help", "ondersteuning", "contact"],
    topic: "support",
    builder: () => ({
      topic: "support",
      answer: "Support: gebruik het supportformulier in het dashboard of mail support@zzp-hub.nl. Reactie binnen één werkdag.",
      followUps: ["Waar vind ik het supportformulier?", "Hoe snel krijg ik antwoord?"],
    }),
  },
];

export function answerFromGuide(question: string): MatchedAnswer {
  const normalized = question.toLowerCase();
  const matchedRoute = keywordRoutes.find((route) => route.keywords.some((keyword) => normalized.includes(keyword)));

  if (matchedRoute) {
    return matchedRoute.builder();
  }

  return {
    topic: "product-overview",
    answer: [
      `${assistantGuide.product.name}: ${assistantGuide.product.description}`,
      `Belangrijk: ${assistantGuide.product.positioning}`,
      `Prijs: ${assistantGuide.pricing.pricePerMonth} (${assistantGuide.pricing.trial}).`,
      "Features:",
      ...assistantGuide.features.map((feature) => `- ${feature.title}: ${feature.detail}`),
    ].join("\n"),
    followUps: assistantGuide.faq.map((item) => item.question),
  };
}
