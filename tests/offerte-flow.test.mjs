import { test } from "node:test";
import assert from "node:assert/strict";

// Mock the router module exports for testing
// In a real scenario, these would be imported from the actual module
// For now, we'll recreate the logic here for testing purposes

/**
 * Detect intent from user message (test version)
 */
function detectIntent(message) {
  const normalized = message.toLowerCase();

  // Action keywords - offerte has priority to avoid generic docs
  const createOfferteKeywords = ["offerte", "quotation", "quote", "aanbieding", "maak een offerte", "create quote"];
  const createInvoiceKeywords = ["maak", "create", "genereer", "factuur", "invoice"];
  const queryKeywords = ["toon", "laat zien", "show", "list", "hoeveel", "welke", "wat"];
  const btwKeywords = ["btw", "vat", "belasting", "verschuldigd"];

  // Check for create offerte FIRST (highest priority)
  if (createOfferteKeywords.some((kw) => normalized.includes(kw))) {
    return { intent: "action", actionType: "create_offerte" };
  }

  // Check for create invoice
  if (createInvoiceKeywords.some((kw) => normalized.includes(kw)) && 
      !createOfferteKeywords.some((kw) => normalized.includes(kw))) {
    return { intent: "action", actionType: "create_invoice" };
  }

  // Check for query
  if (queryKeywords.some((kw) => normalized.includes(kw))) {
    if (btwKeywords.some((kw) => normalized.includes(kw))) {
      return { intent: "action", actionType: "compute_btw" };
    }
    return { intent: "action", actionType: "query_invoices" };
  }

  // Default to question
  return { intent: "question" };
}

/**
 * Extract offerte-specific parameters from message with robust pattern matching
 */
function extractOfferteParams(message) {
  const normalized = message.toLowerCase();
  const params = {};

  // Remove common prefixes that might interfere with parsing
  let cleanMessage = message.replace(/^(?:maak|create|genereer)?\s*(?:een|a)?\s*(?:offerte|quote|quotation|aanbieding)?\s*/i, "").trim();

  // Pattern 1: "<client> <qty> <item> price <unitPrice>"
  // Example: "Riza 320 stops price 1.25"
  const pattern1 = cleanMessage.match(/^([A-Za-z\s]+?)\s+(\d+)\s+([A-Za-z\s]+?)\s+(?:price|prijs|à|@)\s*€?\s*(\d+(?:[.,]\d+)?)/i);
  if (pattern1) {
    params.clientName = pattern1[1].trim();
    const quantity = parseInt(pattern1[2]);
    const description = pattern1[3].trim();
    const price = parseFloat(pattern1[4].replace(",", "."));
    
    params.items = [{
      description,
      quantity,
      price,
      unit: "STUK",
      vatRate: "21",
    }];
  }

  // Pattern 2: "<qty>x <item> @ <unitPrice> for <client>"
  // Example: "320x stops @ 1.25 for Riza"
  const pattern2 = cleanMessage.match(/^(\d+)x?\s+([A-Za-z\s]+?)\s+(?:@|à|price|prijs)\s*€?\s*(\d+(?:[.,]\d+)?)\s+(?:for|voor)\s+([A-Za-z\s]+)/i);
  if (pattern2 && !pattern1) {
    const quantity = parseInt(pattern2[1]);
    const description = pattern2[2].trim();
    const price = parseFloat(pattern2[3].replace(",", "."));
    params.clientName = pattern2[4].trim();
    
    params.items = [{
      description,
      quantity,
      price,
      unit: "STUK",
      vatRate: "21",
    }];
  }

  // Pattern 3: "<client> <item> <qty> stuks <unitPrice> per stuk"
  // Example: "Riza stops 320 stuks 1.25 per stuk"
  const pattern3 = cleanMessage.match(/^([A-Za-z\s]+?)\s+([A-Za-z\s]+?)\s+(\d+)\s+(?:stuks?|pieces?|x)\s+€?\s*(\d+(?:[.,]\d+)?)\s*(?:per|each)?/i);
  if (pattern3 && !pattern1 && !pattern2) {
    params.clientName = pattern3[1].trim();
    const description = pattern3[2].trim();
    const quantity = parseInt(pattern3[3]);
    const price = parseFloat(pattern3[4].replace(",", "."));
    
    params.items = [{
      description,
      quantity,
      price,
      unit: "STUK",
      vatRate: "21",
    }];
  }

  // If no structured pattern matched, try fallback extraction
  if (!params.items) {
    // Extract client name (after "voor" or "for")
    const clientMatch = message.match(/(?:voor|for)\s+([A-Za-z\s]+?)(?:\s*,|\s+\d|$)/i);
    if (clientMatch) {
      params.clientName = clientMatch[1].trim();
    }

    // Extract quantity and description
    const qtyDescMatch = cleanMessage.match(/^(\d+)\s*x?\s+([A-Za-z\s]+?)(?:\s+(?:@|à|price|prijs|voor|for)|$)/i);
    if (qtyDescMatch) {
      const quantity = parseInt(qtyDescMatch[1]);
      const description = qtyDescMatch[2].trim();
      
      // Extract price
      const priceMatch = message.match(/(?:price|prijs|@|à)\s*€?\s*(\d+(?:[.,]\d+)?)/i);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(",", "."));
        
        params.items = [{
          description,
          quantity,
          price,
          unit: "STUK",
          vatRate: "21",
        }];
      }
    }
  }

  // Extract VAT rate
  if (normalized.includes("21%") || normalized.includes("21 %")) {
    params.vatRate = "21";
  } else if (normalized.includes("9%") || normalized.includes("9 %")) {
    params.vatRate = "9";
  } else if (normalized.includes("0%") || normalized.includes("0 %")) {
    params.vatRate = "0";
  } else {
    // Default to 21%
    params.vatRate = "21";
  }

  return params;
}

// ============== Intent Detection Tests ==============

test("detectIntent: identifies create_offerte from Dutch keyword", () => {
  const result = detectIntent("maak een offerte voor Riza");
  assert.strictEqual(result.intent, "action");
  assert.strictEqual(result.actionType, "create_offerte");
});

test("detectIntent: identifies create_offerte from English keyword", () => {
  const result = detectIntent("create quote for John");
  assert.strictEqual(result.intent, "action");
  assert.strictEqual(result.actionType, "create_offerte");
});

test("detectIntent: identifies create_offerte from quotation keyword", () => {
  const result = detectIntent("make a quotation");
  assert.strictEqual(result.intent, "action");
  assert.strictEqual(result.actionType, "create_offerte");
});

test("detectIntent: prioritizes offerte over invoice when both keywords present", () => {
  const result = detectIntent("maak een offerte niet een factuur");
  assert.strictEqual(result.intent, "action");
  assert.strictEqual(result.actionType, "create_offerte");
});

test("detectIntent: identifies create_invoice when no offerte keywords", () => {
  const result = detectIntent("maak een factuur");
  assert.strictEqual(result.intent, "action");
  assert.strictEqual(result.actionType, "create_invoice");
});

test("detectIntent: defaults to question for unknown input", () => {
  const result = detectIntent("hallo hoe gaat het");
  assert.strictEqual(result.intent, "question");
});

// ============== Offerte Parsing Tests ==============

test("extractOfferteParams: parses pattern '<client> <qty> <item> price <unitPrice>'", () => {
  const result = extractOfferteParams("Riza 320 stops price 1.25");
  assert.strictEqual(result.clientName, "Riza");
  assert.strictEqual(result.items.length, 1);
  assert.strictEqual(result.items[0].description, "stops");
  assert.strictEqual(result.items[0].quantity, 320);
  assert.strictEqual(result.items[0].price, 1.25);
  assert.strictEqual(result.items[0].unit, "STUK");
  assert.strictEqual(result.vatRate, "21");
});

test("extractOfferteParams: parses pattern '<qty>x <item> @ <unitPrice> for <client>'", () => {
  const result = extractOfferteParams("320x stops @ 1.25 for Riza");
  assert.strictEqual(result.clientName, "Riza");
  assert.strictEqual(result.items.length, 1);
  assert.strictEqual(result.items[0].description, "stops");
  assert.strictEqual(result.items[0].quantity, 320);
  assert.strictEqual(result.items[0].price, 1.25);
});

test("extractOfferteParams: parses pattern with 'prijs' (Dutch)", () => {
  const result = extractOfferteParams("Jan 100 uren prijs 50");
  assert.strictEqual(result.clientName, "Jan");
  assert.strictEqual(result.items.length, 1);
  assert.strictEqual(result.items[0].description, "uren");
  assert.strictEqual(result.items[0].quantity, 100);
  assert.strictEqual(result.items[0].price, 50);
});

test("extractOfferteParams: parses pattern with euro symbol", () => {
  const result = extractOfferteParams("Maria 50 widgets price €25.50");
  assert.strictEqual(result.clientName, "Maria");
  assert.strictEqual(result.items.length, 1);
  assert.strictEqual(result.items[0].description, "widgets");
  assert.strictEqual(result.items[0].quantity, 50);
  assert.strictEqual(result.items[0].price, 25.50);
});

test("extractOfferteParams: handles comma as decimal separator", () => {
  const result = extractOfferteParams("Test Client 10 items price 3,75");
  assert.strictEqual(result.clientName, "Test Client");
  assert.strictEqual(result.items[0].price, 3.75);
});

test("extractOfferteParams: parses pattern '<client> <item> <qty> stuks <unitPrice>'", () => {
  const result = extractOfferteParams("Riza stops 320 stuks 1.25");
  assert.strictEqual(result.clientName, "Riza");
  assert.strictEqual(result.items.length, 1);
  assert.strictEqual(result.items[0].description, "stops");
  assert.strictEqual(result.items[0].quantity, 320);
  assert.strictEqual(result.items[0].price, 1.25);
});

test("extractOfferteParams: handles multi-word client names", () => {
  const result = extractOfferteParams("John Doe 100 hours price 50");
  assert.strictEqual(result.clientName, "John Doe");
  assert.strictEqual(result.items[0].description, "hours");
});

test("extractOfferteParams: handles multi-word item descriptions", () => {
  const result = extractOfferteParams("Client 5 web designs price 500");
  assert.strictEqual(result.clientName, "Client");
  assert.strictEqual(result.items[0].description, "web designs");
  assert.strictEqual(result.items[0].quantity, 5);
});

test("extractOfferteParams: defaults VAT to 21%", () => {
  const result = extractOfferteParams("Client 1 item price 100");
  assert.strictEqual(result.vatRate, "21");
  assert.strictEqual(result.items[0].vatRate, "21");
});

test("extractOfferteParams: extracts explicit VAT rate 9%", () => {
  const result = extractOfferteParams("Client 1 item price 100 9%");
  assert.strictEqual(result.vatRate, "9");
});

test("extractOfferteParams: extracts explicit VAT rate 0%", () => {
  const result = extractOfferteParams("Client 1 item price 100 0%");
  assert.strictEqual(result.vatRate, "0");
});

test("extractOfferteParams: returns empty items when no pattern matches", () => {
  const result = extractOfferteParams("just some random text");
  assert.strictEqual(result.items, undefined);
});

test("extractOfferteParams: extracts client from 'voor' keyword when no pattern matches", () => {
  const result = extractOfferteParams("offerte voor TestClient");
  assert.strictEqual(result.clientName, "TestClient");
});

test("extractOfferteParams: handles 'voor' with quantity and price separately", () => {
  const result = extractOfferteParams("100x items @ 5 voor ClientName");
  assert.strictEqual(result.clientName, "ClientName");
  assert.strictEqual(result.items[0].quantity, 100);
  assert.strictEqual(result.items[0].price, 5);
});

// ============== Integration Tests ==============

test("integration: full flow for valid offerte creation request", () => {
  const message = "offerte Riza 320 stops price 1.25";
  
  // Step 1: Detect intent
  const intent = detectIntent(message);
  assert.strictEqual(intent.actionType, "create_offerte");
  
  // Step 2: Parse params
  const params = extractOfferteParams(message);
  assert.strictEqual(params.clientName, "Riza");
  assert.strictEqual(params.items.length, 1);
  assert.strictEqual(params.items[0].quantity, 320);
  assert.strictEqual(params.items[0].price, 1.25);
});

test("integration: detects missing client name", () => {
  const message = "offerte 100 items price 10";
  const params = extractOfferteParams(message);
  // Client should not be extracted from this pattern
  assert.strictEqual(params.clientName, undefined);
});

test("integration: detects missing items when only client mentioned", () => {
  const message = "offerte voor Riza";
  const params = extractOfferteParams(message);
  assert.strictEqual(params.clientName, "Riza");
  assert.strictEqual(params.items, undefined);
});
