/**
 * PDF Manager Hook
 * Manages PDF upload, storage, and retrieval
 */

import { useState, useEffect, useCallback } from "react";
import {
  storePDF,
  getPDFsByProject,
  deletePDF,
  createPDFBlobURL,
  revokePDFBlobURL,
  PDFMetadata,
  formatFileSize,
} from "../utils/pdfStorage";

export interface PDFWithURL extends PDFMetadata {
  blobUrl?: string;
}

export function usePDFManager(projectName: string) {
  const [pdfs, setPdfs] = useState<PDFWithURL[]>([]);
  const [currentPdfId, setCurrentPdfId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load PDFs for current project
  const loadPDFs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const projectPDFs = await getPDFsByProject(projectName);
      setPdfs(projectPDFs);

      // If no current PDF is selected, select the first one
      if (!currentPdfId && projectPDFs.length > 0) {
        setCurrentPdfId(projectPDFs[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDFs");
    } finally {
      setLoading(false);
    }
  }, [projectName, currentPdfId]);

  // Load PDFs when project changes
  useEffect(() => {
    loadPDFs();
  }, [loadPDFs]);

  // Upload a new PDF
  const uploadPDF = useCallback(
    async (file: File): Promise<PDFMetadata | null> => {
      try {
        setLoading(true);
        setError(null);

        // Validate file type
        if (file.type !== "application/pdf") {
          throw new Error("Only PDF files are supported");
        }

        // Validate file size (max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(
            `File size exceeds maximum of ${formatFileSize(maxSize)}`
          );
        }

        const metadata = await storePDF(file, projectName);
        await loadPDFs();
        setCurrentPdfId(metadata.id);
        return metadata;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload PDF";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [projectName, loadPDFs]
  );

  // Delete a PDF
  const removePDF = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Revoke blob URL if exists
        const pdf = pdfs.find((p) => p.id === id);
        if (pdf?.blobUrl) {
          revokePDFBlobURL(pdf.blobUrl);
        }

        await deletePDF(id);
        await loadPDFs();

        // If deleted PDF was current, select another
        if (currentPdfId === id) {
          const remainingPDFs = pdfs.filter((p) => p.id !== id);
          setCurrentPdfId(
            remainingPDFs.length > 0 ? remainingPDFs[0].id : null
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete PDF");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [pdfs, currentPdfId, loadPDFs]
  );

  // Get blob URL for current PDF
  const getCurrentPDFUrl = useCallback(async (): Promise<string | null> => {
    if (!currentPdfId) return null;

    try {
      const url = await createPDFBlobURL(currentPdfId);
      return url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF");
      return null;
    }
  }, [currentPdfId]);

  // Get current PDF metadata
  const currentPDF = pdfs.find((p) => p.id === currentPdfId) || null;

  return {
    pdfs,
    currentPdfId,
    currentPDF,
    setCurrentPdfId,
    uploadPDF,
    removePDF,
    getCurrentPDFUrl,
    loading,
    error,
    reload: loadPDFs,
  };
}
