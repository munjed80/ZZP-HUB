import { SUPPORT_EMAIL } from "@/config/emails";

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
    { question: "Hoe verstuur ik?", answer: "Open de factuur en kies Acties → Verstuur via e-mail of Download PDF." },
    { question: "Wat kost het?", answer: "Premium/Pro, maandelijks opzegbaar." },
    { question: "Hoe houd ik 1225 uur bij?", answer: "Log uren in Uren; voortgang zie je op het dashboard." },
    { question: "Hoe krijg ik support?", answer: `Gebruik het supportformulier of mail ${SUPPORT_EMAIL}.` },
  ],
} as const;
