/**
 * Placeholder document parser
 * 
 * This is a basic parser that accepts manual input and does simple regex matching.
 * This serves as the foundation for future OCR/AI integration.
 */

import "server-only";
import { BtwTarief } from "@prisma/client";
import type { DocumentExtractor, ExtractionResult, ExtractedDocumentData } from "./types";

/**
 * Placeholder parser implementation
 * 
 * This parser:
 * - Accepts manual input for testing
 * - Does basic regex extraction for simple cases
 * - Provides a clean hook for future OCR/AI integration
 */
export class PlaceholderParser implements DocumentExtractor {
  async extractDocument(assetPath: string, mimeType: string): Promise<ExtractionResult> {
    const warnings: string[] = [];
    
    try {
      // Log extraction attempt
      console.log("[EXTRACTION_START]", {
        timestamp: new Date().toISOString(),
        assetPath,
        mimeType,
      });
      
      // For now, return a placeholder result that requires manual input
      // In the future, this will call OCR/AI services
      
      const data: ExtractedDocumentData = {
        totalAmount: 0,
        currency: "EUR",
      };
      
      warnings.push("Automatische extractie is nog niet geïmplementeerd.");
      warnings.push("Vul de velden handmatig in.");
      
      // Check if it's a supported file type
      const supportedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      
      if (!supportedTypes.includes(mimeType)) {
        warnings.push(`Bestandstype ${mimeType} wordt mogelijk niet ondersteund.`);
      }
      
      const result: ExtractionResult = {
        success: true,
        data,
        confidence: 0, // 0% confidence since it's manual entry
        warnings,
      };
      
      console.log("[EXTRACTION_SUCCESS]", {
        timestamp: new Date().toISOString(),
        assetPath,
        confidence: result.confidence,
        warningCount: warnings.length,
      });
      
      return result;
    } catch (error) {
      console.error("[EXTRACTION_ERROR]", {
        timestamp: new Date().toISOString(),
        assetPath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      return {
        success: false,
        confidence: 0,
        warnings,
        errorMessage: error instanceof Error ? error.message : "Extractie mislukt",
      };
    }
  }
}

/**
 * Helper to detect VAT rate from text or amount
 * 
 * Note: For calculation from amounts, expects:
 * - totalAmount: amount INCLUSIVE of VAT
 * - vatAmount: the VAT amount itself
 */
export function detectVatRate(text?: string, vatAmount?: number, totalAmount?: number): BtwTarief | undefined {
  if (!text && (!vatAmount || !totalAmount)) {
    return undefined;
  }
  
  // If we have amounts, calculate percentage
  // VAT rate = (vatAmount / amountExclVAT) * 100
  // Where amountExclVAT = totalAmount - vatAmount
  if (vatAmount && totalAmount && totalAmount > vatAmount) {
    const amountExclVAT = totalAmount - vatAmount;
    const percentage = (vatAmount / amountExclVAT) * 100;
    
    if (percentage >= 20 && percentage <= 22) return BtwTarief.HOOG_21;
    if (percentage >= 8 && percentage <= 10) return BtwTarief.LAAG_9;
    if (percentage < 1) return BtwTarief.NUL_0;
  }
  
  // Try to detect from text
  if (text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("21%") || lowerText.includes("21 %")) return BtwTarief.HOOG_21;
    if (lowerText.includes("9%") || lowerText.includes("9 %")) return BtwTarief.LAAG_9;
    if (lowerText.includes("0%") || lowerText.includes("0 %")) return BtwTarief.NUL_0;
    if (lowerText.includes("vrijgesteld")) return BtwTarief.VRIJGESTELD;
    if (lowerText.includes("verlegd") || lowerText.includes("verlegging")) return BtwTarief.VERLEGD;
  }
  
  return undefined;
}

/**
 * Get the default extractor instance
 */
let extractorInstance: DocumentExtractor | null = null;

export function getExtractor(): DocumentExtractor {
  if (!extractorInstance) {
    extractorInstance = new PlaceholderParser();
  }
  return extractorInstance;
}
