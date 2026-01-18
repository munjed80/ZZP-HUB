/**
 * File storage utilities
 * 
 * Handles file uploads and storage for receipts and invoices.
 * Uses local filesystem for MVP, can be swapped for S3/Vercel Blob later.
 */

import "server-only";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/tmp/zzp-uploads";

/**
 * File upload result
 */
export interface UploadResult {
  success: boolean;
  storagePath?: string;
  storageUrl?: string;
  error?: string;
}

/**
 * Validate file type for receipts/invoices
 */
export function validateFileType(mimeType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  
  return allowedTypes.includes(mimeType);
}

/**
 * Validate file size (max 10MB)
 */
export function validateFileSize(size: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}

/**
 * Generate a safe filename
 */
export function generateSafeFilename(originalFilename: string, userId: string): string {
  const ext = originalFilename.split(".").pop() || "bin";
  const uuid = randomUUID();
  const timestamp = Date.now();
  
  // Include userId for tenant scoping at filesystem level
  return `${userId}_${timestamp}_${uuid}.${ext}`;
}

/**
 * Store file to disk
 * 
 * @param file - File buffer
 * @param filename - Safe filename
 * @param userId - User ID for tenant scoping
 * @returns Upload result
 */
export async function storeFile(
  file: Buffer,
  filename: string,
  userId: string
): Promise<UploadResult> {
  try {
    // Create upload directory if it doesn't exist
    const userDir = join(UPLOAD_DIR, userId);
    await mkdir(userDir, { recursive: true });
    
    // Save file
    const storagePath = join(userDir, filename);
    await writeFile(storagePath, file);
    
    // For local storage, we'll use a relative path as URL
    // In production, this would be a CDN URL or S3 URL
    const storageUrl = `/api/files/${userId}/${filename}`;
    
    console.log("[FILE_STORED]", {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-6),
      filename,
      size: file.length,
    });
    
    return {
      success: true,
      storagePath,
      storageUrl,
    };
  } catch (error) {
    console.error("[FILE_STORAGE_ERROR]", {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-6),
      filename,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bestand opslaan mislukt",
    };
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    await fs.unlink(storagePath);
    return true;
  } catch (error) {
    console.error("[FILE_DELETE_ERROR]", error);
    return false;
  }
}
