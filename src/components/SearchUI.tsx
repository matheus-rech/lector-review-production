"use client";

import {
  calculateHighlightRects,
  SearchResult,
  usePdf,
  usePdfJump,
  useSearch,
} from "@anaralabs/lector";
import { useDebounce } from "use-debounce";
import { useEffect, useState } from "react";

interface ResultItemProps {
  result: SearchResult;
  originalSearchText: string;
}

// Result item component - matches official docs exactly
const ResultItem = ({ result, originalSearchText }: ResultItemProps) => {
  const { jumpToHighlightRects } = usePdfJump();
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);

  const onClick = async () => {
    const pageProxy = getPdfPageProxy(result.pageNumber);
    const rects = await calculateHighlightRects(pageProxy, {
      pageNumber: result.pageNumber,
      text: result.text,
      matchIndex: result.matchIndex,
      searchText: originalSearchText, // Pass searchText for exact term highlighting
    });
    jumpToHighlightRects(rects, "pixels");
  };

  return (
    <div
      className="flex py-2 hover:bg-gray-50 flex-col cursor-pointer"
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{result.text}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="ml-auto">Page {result.pageNumber}</span>
      </div>
    </div>
  );
};

// Search UI component - matches official docs exactly
export function SearchUI() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 500);
  const [limit, setLimit] = useState(5);
  const { searchResults: results, search } = useSearch();

  useEffect(() => {
    setLimit(5);
    search(debouncedSearchText, { limit: 5 });
  }, [debouncedSearchText, search]);

  const handleLoadMore = async () => {
    const newLimit = limit + 5;
    await search(debouncedSearchText, { limit: newLimit });
    setLimit(newLimit);
  };

  return (
    <div className="flex flex-col w-80 h-full">
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search in document..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <div className="flex-1 overflow-y-auto px-4 bg-white">
        <div className="py-4">
          {!searchText ? null : !results.exactMatches.length &&
            !results.fuzzyMatches.length ? (
            <div className="text-center py-4 text-gray-500">
              No results found
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {results.exactMatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Exact Matches
                  </h3>
                  <div className="divide-y divide-gray-100">
                    {results.exactMatches.map((result) => (
                      <ResultItem
                        key={`${result.pageNumber}-${result.matchIndex}`}
                        result={result}
                        originalSearchText={searchText}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Fuzzy Matches Section */}
              {results.fuzzyMatches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Fuzzy Matches
                    <span className="ml-2 text-xs text-gray-500">
                      (approximate matches)
                    </span>
                  </h3>
                  <div className="divide-y divide-gray-100 bg-amber-50 rounded-lg p-2">
                    {results.fuzzyMatches.map((result) => (
                      <ResultItem
                        key={`fuzzy-${result.pageNumber}-${result.matchIndex}`}
                        result={result}
                        originalSearchText={searchText}
                      />
                    ))}
                  </div>
                </div>
              )}

              {results.hasMoreResults && (
                <button
                  onClick={handleLoadMore}
                  className="w-full py-2 px-4 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Load More Results
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
