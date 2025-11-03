/**
 * PDF Storage Utility
 * Handles storage and retrieval of PDF files using IndexedDB
 */

const DB_NAME = 'LectorReviewDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdfs';

export interface PDFMetadata {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  projectName: string;
}

export interface StoredPDF extends PDFMetadata {
  data: Blob;
}

/**
 * Initialize IndexedDB
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('projectName', 'projectName', { unique: false });
      }
    };
  });
}

/**
 * Store a PDF file
 */
export async function storePDF(
  file: File,
  projectName: string
): Promise<PDFMetadata> {
  const db = await openDB();
  const id = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const metadata: PDFMetadata = {
    id,
    name: file.name,
    size: file.size,
    uploadDate: new Date().toISOString(),
    projectName,
  };

  const storedPDF: StoredPDF = {
    ...metadata,
    data: file,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(storedPDF);

    request.onsuccess = () => resolve(metadata);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a PDF file by ID
 */
export async function getPDF(id: string): Promise<StoredPDF | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all PDFs for a project
 */
export async function getPDFsByProject(
  projectName: string
): Promise<PDFMetadata[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('projectName');
    const request = index.getAll(projectName);

    request.onsuccess = () => {
      const pdfs = request.result.map(
        ({ data, ...metadata }: StoredPDF) => metadata
      );
      resolve(pdfs);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a PDF file
 */
export async function deletePDF(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Create a blob URL for a PDF
 */
export async function createPDFBlobURL(id: string): Promise<string | null> {
  const pdf = await getPDF(id);
  if (!pdf) return null;

  return URL.createObjectURL(pdf.data);
}

/**
 * Revoke a blob URL
 */
export function revokePDFBlobURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Get total storage size
 */
export async function getStorageSize(): Promise<number> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const totalSize = request.result.reduce(
        (sum: number, pdf: StoredPDF) => sum + pdf.size,
        0
      );
      resolve(totalSize);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
