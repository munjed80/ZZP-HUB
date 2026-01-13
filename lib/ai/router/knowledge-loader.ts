import fs from "fs/promises";
import path from "path";

interface DocSection {
  file: string;
  heading: string;
  content: string;
}

let cachedDocs: DocSection[] | null = null;

/**
 * Load and chunk all AI documentation
 */
export async function loadProductKnowledge(): Promise<DocSection[]> {
  if (cachedDocs) return cachedDocs;

  const docsDir = path.resolve(process.cwd(), "docs", "ai");
  const files = ["product.md", "features.md", "faq.md", "vat.md"];

  const sections: DocSection[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(path.join(docsDir, file), "utf-8");
      
      // Split by ## headings
      const parts = content.split(/^##\s+/m);
      
      parts.forEach((part, idx) => {
        if (idx === 0) {
          // First part might have main title
          const lines = part.trim().split("\n");
          if (lines[0].startsWith("# ")) {
            sections.push({
              file,
              heading: lines[0].replace(/^#+\s*/, "").trim(),
              content: lines.slice(1).join("\n").trim(),
            });
          }
        } else {
          const lines = part.split("\n");
          const heading = lines[0].trim();
          const content = lines.slice(1).join("\n").trim();
          if (heading && content) {
            sections.push({ file, heading, content });
          }
        }
      });
    } catch (error) {
      console.error(`Failed to load ${file}:`, error);
    }
  }

  cachedDocs = sections;
  return sections;
}

/**
 * Find relevant documentation sections based on question
 */
export async function findRelevantSections(
  question: string,
  maxSections = 3
): Promise<DocSection[]> {
  const allSections = await loadProductKnowledge();
  const normalizedQuestion = question.toLowerCase();

  // Simple keyword-based relevance scoring
  const scored = allSections.map((section) => {
    const text = `${section.heading} ${section.content}`.toLowerCase();
    let score = 0;

    // Check for keyword matches
    const keywords = normalizedQuestion.split(/\s+/).filter((w) => w.length > 3);
    keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        score += 1;
      }
      if (section.heading.toLowerCase().includes(keyword)) {
        score += 2; // Heading matches are more relevant
      }
    });

    return { section, score };
  });

  // Sort by score and return top sections
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSections)
    .map((s) => s.section);
}

/**
 * Build context string from sections
 */
export function buildContextString(sections: DocSection[]): string {
  return sections
    .map((s) => `## ${s.heading}\n${s.content}`)
    .join("\n\n");
}
