# Lector Hooks Research - Key Findings

## useSearch Hook

**Location**: `packages/lector/src/hooks/search/useSearch.tsx`

**Key Interfaces**:

```typescript
export interface SearchResult {
  pageNumber: number;
  text: string;
  score: number;
  matchIndex: number;
  isExactMatch: boolean;
  searchText?: string;
}

export interface SearchResults {
  exactMatches: SearchResult[];
  fuzzyMatches: SearchResult[];
  hasMoreResults: boolean;
}

interface SearchOptions {
  threshold?: number;
  limit?: number;
  textSize?: number;
}
```

**Hook Signature**:
```typescript
export const useSearch = () => {
  const textContent = usePdf((state) => state.textContent);
  const [keywords] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResults>({
    exactMatches: [],
    fuzzyMatches: [],
    hasMoreResults: false,
  });
  
  // Returns functions and state
  return {
    searchResults,
    findExactMatches,
    findFuzzyMatches,
    // ...
  };
}
```

## useSelectionDimensions Hook

**Location**: `packages/lector/src/hooks/useSelectionDimensions.tsx`

This hook provides the dimensions and position of selected text in the PDF.

## Key Components

### HighlightLayer

**Location**: `packages/lector/src/components/layers/HighlightLayer.tsx` (likely)

This component renders highlights on top of the PDF canvas.

## Implementation Pattern

All hooks must be used **inside** a component that is wrapped by the `Root` component:

```typescript
function App() {
  return (
    <Root source="/sample.pdf">
      <PDFViewerContent />  {/* Hooks can be used here */}
    </Root>
  );
}

function PDFViewerContent() {
  const { searchResults, findExactMatches } = useSearch();
  const selectionDims = useSelectionDimensions();
  // ... use hooks here
}
```

## Next Steps

1. Check the components folder for HighlightLayer implementation
2. Look at examples folder for complete working examples
3. Implement the hooks properly in our application
