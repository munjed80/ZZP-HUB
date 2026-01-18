/**
 * Receipt upload API endpoint
 * 
 * Handles file uploads for receipt scanning with multi-tenant security.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";
import {
  validateFileType,
  validateFileSize,
  generateSafeFilename,
  storeFile,
} from "@/lib/storage/file-storage";
import { getExtractor } from "@/lib/extraction/parser";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get tenant context
    const { userId } = await requireTenantContext();
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: "Geen bestand gevonden" },
        { status: 400 }
      );
    }
    
    // Validate file type
    if (!validateFileType(file.type)) {
      return NextResponse.json(
        { error: "Bestandstype niet ondersteund. Gebruik JPG, PNG, WebP of PDF." },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: `Bestand is te groot. Maximaal ${MAX_FILE_SIZE / 1024 / 1024}MB toegestaan.` },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Generate safe filename
    const safeFilename = generateSafeFilename(file.name, userId);
    
    // Store file
    const uploadResult = await storeFile(buffer, safeFilename, userId);
    
    if (!uploadResult.success || !uploadResult.storagePath) {
      return NextResponse.json(
        { error: uploadResult.error || "Bestand opslaan mislukt" },
        { status: 500 }
      );
    }
    
    // Create UploadAsset record
    const asset = await prisma.uploadAsset.create({
      data: {
        userId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        storagePath: uploadResult.storagePath,
        storageUrl: uploadResult.storageUrl,
      },
    });
    
    // Start extraction process
    const extractor = getExtractor();
    const extractionResult = await extractor.extractDocument(
      uploadResult.storagePath,
      file.type
    );
    
    // Create ExtractedDocument record
    const extractedDoc = await prisma.extractedDocument.create({
      data: {
        userId,
        assetId: asset.id,
        status: extractionResult.success ? "EXTRACTED" : "FAILED",
        extractedJson: extractionResult.data ? JSON.stringify(extractionResult.data) : null,
        confidenceScore: extractionResult.confidence,
        errorMessage: extractionResult.errorMessage,
      },
    });
    
    console.log("[UPLOAD_SUCCESS]", {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-6),
      assetId: asset.id,
      extractionStatus: extractedDoc.status,
      confidence: extractionResult.confidence,
    });
    
    // Return result
    return NextResponse.json({
      success: true,
      asset: {
        id: asset.id,
        filename: asset.filename,
        storageUrl: asset.storageUrl,
      },
      extraction: {
        id: extractedDoc.id,
        status: extractedDoc.status,
        data: extractionResult.data,
        confidence: extractionResult.confidence,
        warnings: extractionResult.warnings,
      },
    });
  } catch (error) {
    console.error("[UPLOAD_ERROR]", {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    if (error instanceof Error && error.message.includes("geauthenticeerd")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Upload mislukt. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
