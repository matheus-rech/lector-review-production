/**
 * PDF List Component
 * Displays list of uploaded PDFs with selection and deletion
 */

import React from 'react';
import { PDFWithURL } from '../hooks/usePDFManager';
import { formatFileSize } from '../utils/pdfStorage';

interface PDFListProps {
  pdfs: PDFWithURL[];
  currentPdfId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  loading?: boolean;
}

export const PDFList: React.FC<PDFListProps> = ({
  pdfs,
  currentPdfId,
  onSelect,
  onDelete,
  loading = false,
}) => {
  if (pdfs.length === 0) {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
        No PDFs uploaded yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pdfs.map((pdf) => (
        <div
          key={pdf.id}
          className={`flex items-center gap-2 p-2 rounded border transition-colors ${
            pdf.id === currentPdfId
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <button
            className="flex-1 text-left min-w-0"
            onClick={() => onSelect(pdf.id)}
            disabled={loading}
            aria-label={`Select ${pdf.name}`}
          >
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 flex-shrink-0 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-medium truncate"
                  title={pdf.name}
                >
                  {pdf.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(pdf.size)}
                </p>
              </div>
            </div>
          </button>

          <button
            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            onClick={() => {
              if (
                window.confirm(
                  `Delete "${pdf.name}"? This action cannot be undone.`
                )
              ) {
                onDelete(pdf.id);
              }
            }}
            disabled={loading}
            title="Delete PDF"
            aria-label={`Delete ${pdf.name}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};
