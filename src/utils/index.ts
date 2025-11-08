/**
 * Utility Functions Barrel Exports
 *
 * This file provides a single import point for all utility functions.
 * Usage: import { exportProjectJSON, validateField } from '@/utils'
 */

// Import/Export Utilities
export {
  exportProjectJSON,
  exportProjectCSV,
  importProjectJSON,
  exportAllProjects,
  importAllProjects,
  generateSummaryReport,
  exportSummaryReport,
  type ProjectData,
} from "./importExport";

// Validation Utilities
export {
  validateField,
  commonValidations,
  sanitizeInput,
  formatNumber,
  parsePercentage,
  type ValidationRule,
  type ValidationResult,
} from "./validation";

// PDF Storage Utilities
export {
  storePDF,
  getPDF,
  getPDFsByProject,
  deletePDF,
  createPDFBlobURL,
  revokePDFBlobURL,
  getStorageSize,
  formatFileSize,
  type PDFMetadata,
  type StoredPDF,
} from "./pdfStorage";

// Schema Parsing Utilities
export {
  parseSchema,
  createSourcedValue,
  extractValue,
  isSourcedValue,
  type SchemaField,
  type SchemaSection,
  type SourcedValue,
} from "./schemaParser";
