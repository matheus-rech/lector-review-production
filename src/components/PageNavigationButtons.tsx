import { usePdf, usePdfJump } from "@anaralabs/lector";
import { useEffect, useState } from "react";

interface PageNavigationButtonsProps {
  onPageChange?: (page: number, total: number) => void;
}

export const PageNavigationButtons = ({
  onPageChange,
}: PageNavigationButtonsProps) => {
  const pages = usePdf((state) => state.pdfDocumentProxy?.numPages) || 1;
  const currentPage = usePdf((state) => state.currentPage) || 1;
  const [pageNumber, setPageNumber] = useState<string | number>(currentPage);
  const { jumpToPage } = usePdfJump();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      jumpToPage(currentPage - 1, { behavior: "auto" });
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages) {
      jumpToPage(currentPage + 1, { behavior: "auto" });
    }
  };

  const handleFirstPage = () => {
    jumpToPage(1, { behavior: "auto" });
  };

  const handleLastPage = () => {
    jumpToPage(pages, { behavior: "auto" });
  };

  // Notify parent of page changes and sync input
  useEffect(() => {
    setPageNumber(currentPage);
    if (onPageChange) {
      onPageChange(currentPage, pages);
    }
  }, [currentPage, pages, onPageChange]);

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-full shadow-lg px-4 py-2.5 border border-gray-200">
      {/* First Page Button */}
      <button
        onClick={handleFirstPage}
        disabled={currentPage <= 1}
        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="First page"
        title="First page"
      >
        ⏮
      </button>

      {/* Previous Page Button */}
      <button
        onClick={handlePreviousPage}
        disabled={currentPage <= 1}
        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Previous page"
        title="Previous page"
      >
        ◀
      </button>

      {/* Page Input */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={pageNumber}
          onChange={(e) => setPageNumber(e.target.value)}
          onBlur={(e) => {
            const value = Number(e.target.value);
            if (value >= 1 && value <= pages && currentPage !== value) {
              jumpToPage(value, { behavior: "auto" });
            } else {
              setPageNumber(currentPage);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          className="w-12 h-7 text-center bg-gray-50 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          min={1}
          max={pages}
          aria-label="Go to page"
        />
        <span className="text-sm text-gray-600 font-medium">
          / {pages}
        </span>
      </div>

      {/* Next Page Button */}
      <button
        onClick={handleNextPage}
        disabled={currentPage >= pages}
        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Next page"
        title="Next page"
      >
        ▶
      </button>

      {/* Last Page Button */}
      <button
        onClick={handleLastPage}
        disabled={currentPage >= pages}
        className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        aria-label="Last page"
        title="Last page"
      >
        ⏭
      </button>
    </div>
  );
};
