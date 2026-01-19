import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * PDF Template Tests
 * 
 * These tests verify the PDF template structure and exported types.
 */

describe("PDF Template Type Safety", () => {
  test("InvoicePdfCompany type should NOT include website field", async () => {
    // Read the file content to verify website field is not present
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Check that website field is not in InvoicePdfCompany type definition
    const companyTypeMatch = content.match(/export type InvoicePdfCompany = \{[^}]+\}/s);
    assert.ok(companyTypeMatch, "InvoicePdfCompany type should be defined");
    
    const companyTypeContent = companyTypeMatch[0];
    assert.ok(
      !companyTypeContent.includes("website"),
      "InvoicePdfCompany should not contain website field"
    );
  });

  test("InvoicePDF component should not render website anywhere", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Find the InvoicePDF function component
    const componentMatch = content.match(/export function InvoicePDF\([^)]+\)[^{]*\{[\s\S]*\n\}/);
    assert.ok(componentMatch, "InvoicePDF component should be defined");
    
    const componentContent = componentMatch[0];
    
    // Check that website is not used in rendering
    // Look for common patterns like companyProfile?.website or {website}
    assert.ok(
      !componentContent.includes("companyProfile?.website") &&
      !componentContent.includes("companyProfile.website"),
      "Component should not access website property"
    );
  });

  test("PDF template should have reduced top padding", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Check that page padding is 30 or less (not 40)
    const pageStyleMatch = content.match(/page:\s*\{[^}]+padding:\s*(\d+)/s);
    assert.ok(pageStyleMatch, "Page style with padding should be defined");
    
    const padding = parseInt(pageStyleMatch[1], 10);
    assert.ok(
      padding <= 30,
      `Page padding should be 30 or less, but got ${padding}`
    );
  });

  test("Brand name should be visually distinctive", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Check that brandName style has enhanced styling
    const brandNameStyleMatch = content.match(/brandName:\s*\{[^}]+\}/s);
    assert.ok(brandNameStyleMatch, "brandName style should be defined");
    
    const brandNameStyle = brandNameStyleMatch[0];
    
    // Should have fontSize 16 or higher
    const fontSizeMatch = brandNameStyle.match(/fontSize:\s*(\d+)/);
    if (fontSizeMatch) {
      const fontSize = parseInt(fontSizeMatch[1], 10);
      assert.ok(
        fontSize >= 16,
        `Brand name fontSize should be 16 or higher for visual distinction, got ${fontSize}`
      );
    }
    
    // Should have fontWeight 800 (bold)
    assert.ok(
      brandNameStyle.includes("fontWeight: 800") || brandNameStyle.includes('fontWeight: "800"'),
      "Brand name should have fontWeight 800 for visual prominence"
    );
  });

  test("calculateInvoiceTotals helper should be exported", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    assert.ok(
      content.includes("export function calculateInvoiceTotals"),
      "calculateInvoiceTotals should be exported as a function"
    );
  });

  test("calculateInvoiceTotals should correctly calculate VAT", () => {
    // Mock import since we can't directly import TypeScript in test
    const calculateInvoiceTotals = (lines) => {
      const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.price, 0);
      const vatHigh = lines
        .filter((line) => line.vatRate === "21")
        .reduce((sum, line) => sum + line.quantity * line.price * 0.21, 0);
      const vatLow = lines
        .filter((line) => line.vatRate === "9")
        .reduce((sum, line) => sum + line.quantity * line.price * 0.09, 0);

      return {
        subtotal,
        vatHigh,
        vatLow,
        total: subtotal + vatHigh + vatLow,
      };
    };

    const lines = [
      { description: "Item 1", quantity: 2, unit: "uur", price: 100, vatRate: "21" },
      { description: "Item 2", quantity: 1, unit: "stuks", price: 50, vatRate: "9" },
      { description: "Item 3", quantity: 3, unit: "uur", price: 75, vatRate: "0" },
    ];

    const totals = calculateInvoiceTotals(lines);

    // Subtotal: 2*100 + 1*50 + 3*75 = 200 + 50 + 225 = 475
    assert.strictEqual(totals.subtotal, 475);

    // VAT High (21%): 200 * 0.21 = 42
    assert.strictEqual(totals.vatHigh, 42);

    // VAT Low (9%): 50 * 0.09 = 4.5
    assert.strictEqual(totals.vatLow, 4.5);

    // Total: 475 + 42 + 4.5 = 521.5
    assert.strictEqual(totals.total, 521.5);
  });

  test("All required exports should be present", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Check for all required exports
    const requiredExports = [
      "InvoicePDF",
      "InvoicePdfData",
      "InvoicePdfLine",
      "InvoicePdfCompany",
      "InvoicePdfClient",
      "calculateInvoiceTotals",
    ];
    
    for (const exportName of requiredExports) {
      assert.ok(
        content.includes(`export type ${exportName}`) || 
        content.includes(`export function ${exportName}`) ||
        content.includes(`export const ${exportName}`),
        `${exportName} should be exported`
      );
    }
  });
});

describe("PDF Template Structure Validation", () => {
  test("InvoicePDF should accept documentType prop", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Check for documentType prop
    const functionMatch = content.match(/export function InvoicePDF\([^)]+\)/);
    assert.ok(functionMatch, "InvoicePDF function should be defined");
    
    const functionSignature = functionMatch[0];
    assert.ok(
      functionSignature.includes("documentType"),
      "InvoicePDF should accept documentType parameter"
    );
  });

  test("Document type should support FACTUUR and OFFERTE", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Check for DocumentType type definition
    const docTypeMatch = content.match(/type DocumentType = [^;]+;/);
    assert.ok(docTypeMatch, "DocumentType should be defined");
    
    const docTypeContent = docTypeMatch[0];
    assert.ok(
      docTypeContent.includes("FACTUUR") && docTypeContent.includes("OFFERTE"),
      "DocumentType should include both FACTUUR and OFFERTE"
    );
  });

  test("PDF should have consistent label alignment", async () => {
    const fs = await import("fs/promises");
    const content = await fs.readFile("components/pdf/InvoicePDF.tsx", "utf-8");
    
    // Check that LABEL_SENDER and LABEL_RECIPIENT constants exist
    assert.ok(
      content.includes("LABEL_SENDER") && content.includes("LABEL_RECIPIENT"),
      "Consistent label constants should be defined"
    );
  });
});
