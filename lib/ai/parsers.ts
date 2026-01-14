/**
 * Enhanced parsers for Dutch natural language input
 * Supports various formats and handles common variations
 */

export interface ParsedLineItem {
  description: string;
  quantity: number;
  price: number;
  unit: string;
  vatRate: string;
}

export interface ParsedExpense {
  vendor?: string;
  category?: string;
  amount: number;
  vatRate?: string;
  date?: string;
  description?: string;
  paymentMethod?: string;
}

export interface ParsedClient {
  name: string;
  email?: string;
  kvkNumber?: string;
  btwId?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

/**
 * Normalize decimal formats (1,25 -> 1.25)
 */
export function normalizeDecimal(value: string): number {
  return parseFloat(value.replace(/,/g, "."));
}

/**
 * Normalize VAT rate (21% -> "21", 0.21 -> "21")
 */
export function normalizeVatRate(value: string): "21" | "9" | "0" {
  const normalized = value
    .toLowerCase()
    .replace(/[%\s]/g, "")
    .replace(/,/g, ".");

  const num = parseFloat(normalized);
  
  if (num >= 0.2 && num <= 0.22) return "21";
  if (num >= 20 && num <= 22) return "21";
  if (num >= 0.08 && num <= 0.1) return "9";
  if (num >= 8 && num <= 10) return "9";
  if (num === 0) return "0";
  
  return "21"; // Default
}

/**
 * Parse date in various Dutch formats
 */
export function parseDate(dateStr: string): string | null {
  const normalized = dateStr.trim().toLowerCase();

  // Handle relative dates
  if (normalized.includes("vandaag") || normalized.includes("today")) {
    return new Date().toISOString().split("T")[0];
  }
  if (normalized.includes("gisteren") || normalized.includes("yesterday")) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }
  if (normalized.includes("morgen") || normalized.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  }

  // Try to parse DD-MM-YYYY, DD/MM/YYYY
  const dmyMatch = dateStr.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  // Try ISO format YYYY-MM-DD
  const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return isoMatch[0];
  }

  return null;
}

/**
 * Parse invoice/offerte items from natural language
 * Supports multiple patterns:
 * - "320 stops @ 1.25 btw 21%"
 * - "40 uur x 75 euro"
 * - "5 stops price 2,50"
 */
export function parseLineItems(text: string): ParsedLineItem[] {
  const items: ParsedLineItem[] = [];
  const lines = text.split(/[,;\n]/).map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    const parsed = parseLineItem(line);
    if (parsed) {
      items.push(parsed);
    }
  }

  return items;
}

/**
 * Parse a single line item
 */
function parseLineItem(line: string): ParsedLineItem | null {
  // Pattern 1: "320 stops @ 1.25" or "40 uur x 75"
  const pattern1 = /(\d+)\s*(?:x|stops?|uur|stuks?|km|projecten?)\s*[@xX×]\s*€?\s*([\d,\.]+)/i;
  const match1 = line.match(pattern1);
  
  if (match1) {
    const quantity = parseInt(match1[1]);
    const price = normalizeDecimal(match1[2]);
    const description = extractDescription(line) || "Dienstverlening";
    const unit = extractUnit(line);
    const vatRate = extractVatRate(line);

    return {
      description,
      quantity,
      price,
      unit,
      vatRate,
    };
  }

  // Pattern 2: "5 stuks beschrijving €2,50"
  const pattern2 = /(\d+)\s+(\w+)\s+(.+?)\s*€?\s*([\d,\.]+)/i;
  const match2 = line.match(pattern2);
  
  if (match2) {
    const quantity = parseInt(match2[1]);
    const description = match2[3].trim();
    const price = normalizeDecimal(match2[4]);
    const unit = extractUnit(line);
    const vatRate = extractVatRate(line);

    return {
      description,
      quantity,
      price,
      unit,
      vatRate,
    };
  }

  return null;
}

/**
 * Extract description from line
 */
function extractDescription(line: string): string | null {
  // Remove numbers, prices, units, VAT
  const cleaned = line
    .replace(/\d+\s*(?:x|@|stops?|uur|stuks?|km)/gi, "")
    .replace(/€?\s*[\d,\.]+/g, "")
    .replace(/btw\s*\d+%?/gi, "")
    .replace(/[@xX×]/g, "")
    .trim();

  return cleaned || null;
}

/**
 * Extract unit from line
 */
function extractUnit(line: string): string {
  const normalized = line.toLowerCase();
  
  if (normalized.includes("uur") || normalized.includes("hour")) return "UUR";
  if (normalized.includes("stop")) return "STOP";
  if (normalized.includes("km")) return "KM";
  if (normalized.includes("project")) return "PROJECT";
  if (normalized.includes("licentie") || normalized.includes("license")) return "LICENTIE";
  if (normalized.includes("service")) return "SERVICE";
  
  return "STUK";
}

/**
 * Extract VAT rate from line
 */
function extractVatRate(line: string): string {
  const vatMatch = line.match(/btw\s*([\d,\.]+)%?/i);
  if (vatMatch) {
    return normalizeVatRate(vatMatch[1]);
  }
  return "21"; // Default
}

/**
 * Parse expense from natural language
 * Examples:
 * - "Koffie 15 euro 9% btw"
 * - "Tankstation 50.25 vandaag"
 */
export function parseExpense(text: string): Partial<ParsedExpense> {
  const expense: Partial<ParsedExpense> = {};

  // Extract amount
  const amountMatch = text.match(/€?\s*([\d,\.]+)\s*(?:euro)?/i);
  if (amountMatch) {
    expense.amount = normalizeDecimal(amountMatch[1]);
  }

  // Extract VAT rate
  const vatMatch = text.match(/btw\s*([\d,\.]+)%?/i);
  if (vatMatch) {
    expense.vatRate = normalizeVatRate(vatMatch[1]);
  }

  // Extract date
  const dateMatch = text.match(/(?:op|vandaag|gisteren|morgen|\d{1,2}[-/]\d{1,2}[-/]\d{4})/i);
  if (dateMatch) {
    expense.date = parseDate(dateMatch[0]) || undefined;
  }

  // Extract category/vendor from remaining text
  let remaining = text
    .replace(/€?\s*[\d,\.]+\s*(?:euro)?/gi, "")
    .replace(/btw\s*[\d,\.]+%?/gi, "")
    .replace(/(?:op|vandaag|gisteren|morgen)/gi, "")
    .trim();

  if (remaining) {
    expense.description = remaining;
    
    // Common vendor patterns
    if (remaining.toLowerCase().includes("tank")) {
      expense.category = "Brandstof";
      expense.vendor = remaining;
    } else if (remaining.toLowerCase().includes("koffie")) {
      expense.category = "Horeca";
    }
  }

  return expense;
}

/**
 * Parse client information
 * Examples:
 * - "Acme BV, email@acme.nl, KVK 12345678"
 * - "John Doe john@example.com Amsterdam"
 */
export function parseClient(text: string): Partial<ParsedClient> {
  const client: Partial<ParsedClient> = {};

  // Extract email
  const emailMatch = text.match(/[\w\.-]+@[\w\.-]+\.\w+/);
  if (emailMatch) {
    client.email = emailMatch[0];
  }

  // Extract KVK number
  const kvkMatch = text.match(/kvk\s*[:=]?\s*(\d{8})/i);
  if (kvkMatch) {
    client.kvkNumber = kvkMatch[1];
  }

  // Extract BTW ID
  const btwMatch = text.match(/btw[-\s]?id\s*[:=]?\s*(NL\d{9}B\d{2})/i);
  if (btwMatch) {
    client.btwId = btwMatch[1];
  }

  // Extract postal code (Dutch format: 1234AB)
  const postalMatch = text.match(/\b(\d{4}\s?[A-Z]{2})\b/i);
  if (postalMatch) {
    client.postalCode = postalMatch[1].replace(/\s/g, "");
  }

  // Extract name (first part before email/KVK/comma)
  const nameMatch = text.match(/^([^,@]+?)(?:\s*,|\s+[\w\.-]+@|$)/);
  if (nameMatch) {
    client.name = nameMatch[1].trim();
  }

  return client;
}

/**
 * Extract client name from various patterns
 */
export function extractClientName(text: string): string | null {
  // Pattern: "voor [ClientName]" or "for [ClientName]"
  const voorMatch = text.match(/(?:voor|for)\s+([A-Za-z0-9\s\-&']+?)(?:\s*[,:\.]|\s+\d|\s+bedrag|\s+amount|$)/i);
  if (voorMatch) {
    return voorMatch[1].trim();
  }

  // Pattern: "[ClientName] <amount>"
  const nameAmountMatch = text.match(/^([A-Za-z\s&'-]+?)\s+(?:€|bedrag|\d)/i);
  if (nameAmountMatch) {
    return nameAmountMatch[1].trim();
  }

  return null;
}
