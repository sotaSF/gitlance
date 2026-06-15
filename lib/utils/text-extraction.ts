/**
 * Text extraction utilities for different file formats
 * Supports PDF, DOCX, TXT, and MD files
 *
 * NOTE: Actual text extraction is handled server-side via the extractTextFromUploadedFile server action
 * This file only contains file type validation utilities for client-side use
 */

// Allowed file types for text extraction
export const ALLOWED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "application/msword": ".doc",
  "text/plain": ".txt",
  "text/markdown": ".md",
} as const;

export const ALLOWED_MIME_TYPES = Object.keys(ALLOWED_FILE_TYPES);
export const ALLOWED_EXTENSIONS = Object.values(ALLOWED_FILE_TYPES).join(",");

/**
 * Check if a file type is supported for text extraction
 */
export function isSupportedFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
