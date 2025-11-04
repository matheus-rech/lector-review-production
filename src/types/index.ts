/**
 * Central Type Definitions for Lector Review
 *
 * This file contains all TypeScript types used throughout the application.
 * Import types from here to ensure consistency and easy maintenance.
 *
 * @module types
 */

// ==================== GEOMETRY & COORDINATES ====================

/**
 * Rectangle coordinates in PDF space
 * @description Used for highlights, selections, and bounding boxes
 */
export interface Rect {
  /** X coordinate (left edge) */
  x: number;
  /** Y coordinate (top edge) */
  y: number;
  /** Width of rectangle */
  width: number;
  /** Height of rectangle */
  height: number;
}

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

// ==================== HIGHLIGHTS ====================

/**
 * Type of highlight
 */
export type HighlightKind = "user" | "search";

/**
 * Labeled highlight with metadata
 * @description User-created or search-generated highlights on PDF
 */
export interface LabeledHighlight {
  /** Unique identifier */
  id: string;
  /** User-provided label or description */
  label: string;
  /** Type of highlight (user-created or from search) */
  kind: HighlightKind;
  /** Page number where highlight appears */
  pageNumber: number;
  /** X coordinate in PDF space */
  x: number;
  /** Y coordinate in PDF space */
  y: number;
  /** Width of highlight */
  width: number;
  /** Height of highlight */
  height: number;
  /** Optional color (hex format) */
  color?: string;
}

/**
 * Pending text selection before highlight creation
 */
export interface PendingSelection {
  /** Array of rectangles for the selection */
  rects: Rect[];
  /** Page number of selection */
  pageNumber: number;
  /** Selected text content */
  text: string;
}

// ==================== TEMPLATES & FORMS ====================

/**
 * Field template definition
 * @description Defines a data extraction field
 */
export interface FieldTemplate {
  /** Unique field identifier */
  id: string;
  /** Display label for the field */
  label: string;
  /** Optional placeholder text */
  placeholder?: string;
  /** Field type (for validation) */
  type?: "text" | "number" | "date" | "select";
  /** Required field flag */
  required?: boolean;
  /** Options for select fields */
  options?: string[];
}

/**
 * Page-specific template configuration
 * @description Mapping of page numbers to field templates
 */
export type PageTemplates = Record<number, FieldTemplate[]>;

/**
 * Form data storage
 * @description Key format: "pageNumber:fieldId", Value: field value
 * @example { "1:study_id": "10.1161/STROKEAHA.116.014078", "1:year": "2016" }
 */
export type PageFormData = Record<string, string>;

// ==================== PROJECTS ====================

/**
 * Project configuration
 */
export interface Project {
  /** Project name (unique identifier) */
  name: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last modified timestamp */
  updatedAt: string;
  /** Current PDF source */
  pdfSource?: string;
  /** Project description */
  description?: string;
}

/**
 * Complete project data
 * @description All data associated with a project
 */
export interface ProjectData {
  /** Project metadata */
  project: string;
  /** PDF source URL or path */
  source: string;
  /** User-created and search highlights */
  highlights: LabeledHighlight[];
  /** Field templates per page */
  templates: PageTemplates;
  /** Extracted field data */
  pageForm: PageFormData;
  /** PDF form data (if any) */
  pdfFormData?: Record<string, any>;
  /** Export timestamp */
  exportedAt?: string;
}

// ==================== PDF MANAGEMENT ====================

/**
 * PDF file metadata
 * @description Information about an uploaded or loaded PDF
 */
export interface PDFMetadata {
  /** Unique PDF identifier */
  id: string;
  /** Original filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** Upload/load timestamp */
  uploadDate: string;
  /** Blob URL for viewing */
  blobUrl: string;
  /** Total page count */
  totalPages?: number;
  /** File type */
  mimeType?: string;
}

/**
 * PDF storage entry for IndexedDB
 */
export interface PDFStorageEntry {
  /** Unique identifier */
  id: string;
  /** Original filename */
  filename: string;
  /** Blob data */
  blob: Blob;
  /** Upload timestamp */
  timestamp: number;
  /** File size */
  size: number;
}

// ==================== SCHEMA & VALIDATION ====================

/**
 * Sourced value with traceability
 * @description Links extracted data to source location
 */
export interface SourcedValue<T> {
  /** Actual value */
  value: T;
  /** Exact quote from document */
  source_text?: string;
  /** Location in document (page, table, figure) */
  source_location?: string;
  /** Linked highlight ID */
  highlightId?: string;
}

/**
 * Schema field definition
 */
export interface SchemaField {
  /** Field key in schema */
  key: string;
  /** Display label */
  label: string;
  /** Data type */
  type: "string" | "number" | "boolean" | "object" | "array";
  /** Required field flag */
  required?: boolean;
  /** Nested fields (for objects) */
  properties?: SchemaField[];
  /** Array item schema (for arrays) */
  items?: SchemaField;
  /** Enum options */
  enum?: string[];
  /** Field description */
  description?: string;
}

/**
 * Parsed JSON schema
 */
export interface ParsedSchema {
  /** Schema title */
  title: string;
  /** Schema description */
  description?: string;
  /** Root-level fields */
  fields: SchemaField[];
}

// ==================== UI STATE ====================

/**
 * Toast notification type
 */
export type ToastType = "success" | "error" | "info" | "warning";

/**
 * Toast notification
 */
export interface Toast {
  /** Unique toast ID */
  id: string;
  /** Toast message */
  message: string;
  /** Toast type/severity */
  type: ToastType;
  /** Display duration (ms) */
  duration?: number;
  /** Creation timestamp */
  timestamp: number;
}

/**
 * Modal configuration
 */
export interface ModalConfig {
  /** Modal open state */
  isOpen: boolean;
  /** Modal title */
  title: string;
  /** Modal content (as ReactNode) */
  content?: React.ReactNode;
  /** Callback when modal closes */
  onClose: () => void;
  /** Callback on confirm (for confirmation modals) */
  onConfirm?: () => void;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
}

/**
 * Loading state
 */
export interface LoadingState {
  /** Loading flag */
  isLoading: boolean;
  /** Loading message */
  message?: string;
}

// ==================== KEYBOARD & SHORTCUTS ====================

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  /** Shortcut key combination */
  key: string;
  /** Ctrl key required */
  ctrl?: boolean;
  /** Shift key required */
  shift?: boolean;
  /** Alt key required */
  alt?: boolean;
  /** Shortcut description */
  description: string;
  /** Callback function */
  handler: () => void;
}

// ==================== EXPORT & IMPORT ====================

/**
 * CSV export row
 */
export interface CSVRow {
  Project: string;
  Page: string;
  Field: string;
  Value: string;
  "Highlight Label": string;
  "Highlight Page": string;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Export format */
  format: "json" | "csv" | "excel";
  /** Include highlights */
  includeHighlights?: boolean;
  /** Include form data */
  includeFormData?: boolean;
  /** Include templates */
  includeTemplates?: boolean;
  /** Pretty print JSON */
  prettyPrint?: boolean;
}

// ==================== VALIDATION ====================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Validation passed */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Field name that failed validation */
  field?: string;
}

/**
 * Field validator function
 */
export type FieldValidator = (value: string) => ValidationResult;

// ==================== UTILITY TYPES ====================

/**
 * Async operation state
 */
export interface AsyncState<T> {
  /** Data result */
  data: T | null;
  /** Loading flag */
  isLoading: boolean;
  /** Error if operation failed */
  error: Error | null;
}

/**
 * Pagination configuration
 */
export interface Pagination {
  /** Current page (1-indexed) */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Total items */
  totalItems: number;
  /** Total pages */
  totalPages: number;
}

/**
 * Sort configuration
 */
export interface SortConfig<T> {
  /** Field to sort by */
  field: keyof T;
  /** Sort direction */
  direction: "asc" | "desc";
}

// ==================== HISTORY & UNDO/REDO ====================

/**
 * History state for undo/redo
 */
export interface HistoryState<T> {
  /** Past states */
  past: T[];
  /** Current state */
  present: T;
  /** Future states (for redo) */
  future: T[];
}

/**
 * History action
 */
export type HistoryAction = "undo" | "redo" | "reset" | "push";

// ==================== TYPE GUARDS ====================

/**
 * Check if value is a valid highlight
 */
export function isLabeledHighlight(value: any): value is LabeledHighlight {
  return (
    value &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    ["user", "search"].includes(value.kind) &&
    typeof value.pageNumber === "number" &&
    typeof value.x === "number" &&
    typeof value.y === "number" &&
    typeof value.width === "number" &&
    typeof value.height === "number"
  );
}

/**
 * Check if value is a valid field template
 */
export function isFieldTemplate(value: any): value is FieldTemplate {
  return (
    value && typeof value.id === "string" && typeof value.label === "string"
  );
}

// ==================== LECTOR LIBRARY TYPES ====================
// Note: ColoredHighlight and other Lector types should be imported directly from @anaralabs/lector
// DO NOT re-define them here as they may change between versions

/**
 * Lector search result match
 * Note: This is an internal type for tracking search results in our application state
 */
export interface SearchMatch {
  id: string;
  pageNumber: number;
  text: string;
  matchIndex?: number;
  rects?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  rect?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Lector search results
 */
export interface SearchResults {
  exactMatches: SearchMatch[];
  totalMatches: number;
}

// ==================== EXPORTS ====================

// All types are exported individually above for direct imports
// Example: import { LabeledHighlight, FieldTemplate } from '@/types';
