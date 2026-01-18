/**
 * Extraction service types
 * 
 * This module defines the interface for document extraction services.
 * The actual implementation can be swapped (OCR, AI, manual, etc.)
 */

import { BtwTarief } from "@prisma/client";

/**
 * Extracted line item from a receipt/invoice
 */
export interface ExtractedLineItem {
  description: string;
  quantity?: number;
  unitPrice?: number;
  amount: number;
}

/**
 * Extracted document data
 */
export interface ExtractedDocumentData {
  // Core fields
  totalAmount: number;
  vatAmount?: number;
  vatRate?: BtwTarief;
  date?: string; // ISO date string
  
  // Vendor/invoice details
  vendorName?: string;
  invoiceNumber?: string;
  currency?: string;
  
  // Line items (optional)
  lineItems?: ExtractedLineItem[];
  
  // Additional metadata
  rawText?: string;
}

/**
 * Extraction result with confidence and warnings
 */
export interface ExtractionResult {
  success: boolean;
  data?: ExtractedDocumentData;
  confidence: number; // 0-100
  warnings: string[];
  errorMessage?: string;
}

/**
 * Document extraction service interface
 */
export interface DocumentExtractor {
  /**
   * Extract data from an asset
   * @param assetPath - Path to the file
   * @param mimeType - MIME type of the file
   * @returns Extraction result
   */
  extractDocument(assetPath: string, mimeType: string): Promise<ExtractionResult>;
}
