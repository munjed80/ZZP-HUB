import fs from "fs/promises";
import path from "path";
import { assistantGuide } from "./guide";

type KnowledgeSection = {
  heading: string;
  content: string;
};

const knowledgePath = path.join(process.cwd(), "content", "help", "zzp-hub-knowledge.md");
let cachedKnowledge: { text: string; sections: KnowledgeSection[] } | null = null;

async function loadKnowledge(): Promise<{ text: string; sections: KnowledgeSection[] }> {
  if (cachedKnowledge) return cachedKnowledge;
  const text = await fs.readFile(knowledgePath, "utf8");
  const sections = text
    .split(/^##\s+/m)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (index === 0 && block.startsWith("#")) {
        const [headingLine, ...rest] = block.split("\n");
        return { heading: headingLine.replace(/^#+\s*/, "").trim(), content: rest.join("\n").trim() };
      }
      const [headingLine, ...rest] = block.split("\n");
      return { heading: headingLine.trim(), content: rest.join("\n").trim() };
    });

  cachedKnowledge = { text, sections };
  return cachedKnowledge;
}

const keywordToHeading: { keywords: string[]; heading: string; topic: string }[] = [
  { keywords: ["start", "begin", "onboarding", "eerste stap", "aanmelden"], heading: "Eerste stappen", topic: "getting-started" },
  { keywords: ["factuur", "facturen", "offerte", "pdf", "betaald", "onbetaald"], heading: "Features", topic: "documents" },
  { keywords: ["btw", "aangifte", "belasting"], heading: "Features", topic: "vat" },
  { keywords: ["uren", "1225"], heading: "Features", topic: "hours" },
  { keywords: ["support", "help", "contact"], heading: "Support", topic: "support" },
  { keywords: ["prijs", "kosten", "abonnement"], heading: "Features", topic: "pricing" },
  { keywords: ["faq", "vraag", "vragen"], heading: "Veelgestelde vragen", topic: "faq" },
];

function findSection(question: string, sections: KnowledgeSection[]) {
  const normalized = question.toLowerCase();
  const mapped = keywordToHeading.find((entry) => entry.keywords.some((kw) => normalized.includes(kw)));
  if (mapped) {
    const matched = sections.find((section) => section.heading.toLowerCase().includes(mapped.heading.toLowerCase()));
    if (matched) return { section: matched, topic: mapped.topic };
  }

  const found = sections.find((section) => normalized.includes(section.heading.toLowerCase()));
  if (found) return { section: found, topic: "general" };

  return { section: sections[0], topic: "product-overview" };
}

export async function answerFromKnowledge(question: string) {
  const { text, sections } = await loadKnowledge();
  const { section, topic } = findSection(question, sections);
  const followUps = sections
    .filter((item) => item.heading !== section.heading)
    .slice(0, 3)
    .map((item) => item.heading);

  return {
    answer: `${section.heading}\n${section.content}`,
    topic,
    followUps: followUps.length > 0 ? followUps : assistantGuide.faq.map((item) => item.question),
    source: text,
  };
}
