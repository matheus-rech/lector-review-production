# Lector API Documentation Findings

## Source
- Documentation Site: https://lector-weld.vercel.app/
- Custom Search: https://lector-weld.vercel.app/docs/code/search
- Highlight: https://lector-weld.vercel.app/docs/code/highlight

## Key Hooks Available

### 1. useSearch Hook
Used for searching text in PDFs with highlighting capabilities.

**Import:**
```tsx
import { Search, useSearch } from "@anaralabs/lector";
```

**Key Functions:**
- `calculateHighlightRects(pageProxy, {...})` - Calculates highlight rectangles for search results
- Returns: `SearchResult` with search matches

**Usage Pattern:**
```tsx
const { calculateHighlightRects, SearchResult, usePdf, usePdfJump, useSearch } = from "@anaralabs/lector";

// In component inside Root context
const ResultItem = ({ result, originalSearchText }) => {
  const onClick = async () => {
    const rects = await calculateHighlightRects(pageProxy, {
      pageNumber: result.pageNumber,
      text: result.text,
      matchIndex: result.matchIndex,
      searchText: originalSearchText, // For exact term highlighting
      // OR omit searchText for full context highlighting
    });
    jumpToHighlightRects(rects, "pixels");
  };
};
```

**Features:**
- Real-time search with debouncing
- Configurable highlighting (exact term or full context)
- Result highlighting
- Page jumping to search results

### 2. usePdfJump Hook
Used for navigation within the PDF.

**Import:**
```tsx
import { usePdfJump } from "@anaralabs/lector";
```

**Functions:**
- `jumpToHighlightRects(rects, "pixels")` - Jump to specific rectangles
- `currentPageNumber` - Get current page number

**Usage:**
```tsx
const { jumpToHighlightRects } = usePdfJump();
const { currentPageNumber } = usePdfJump();
```

### 3. useSelectionDimensions Hook
Used for capturing text selection in the PDF.

**Import:**
```tsx
import { useSelectionDimensions } from "@anaralabs/lector";
```

**Returns:**
- `selectionDimensions.rects` - Array of rectangles for selected text
- `selectionDimensions.text` - Selected text content
- `selectionDimensions.pageNumber` - Page number of selection

**Usage:**
```tsx
const selectionDimensions = useSelectionDimensions();

useEffect(() => {
  if (selectionDimensions && selectionDimensions.rects && selectionDimensions.rects.length > 0) {
    // Handle text selection
    const rect = selectionDimensions.rects[0];
    const text = selectionDimensions.text;
    const pageNumber = selectionDimensions.pageNumber;
  }
}, [selectionDimensions]);
```

## Layer Components

### HighlightLayer
Basic highlight layer for custom highlights.

```tsx
import { HighlightLayer } from "@anaralabs/lector";

<HighlightLayer className="bg-yellow-200/70" />
```

### ColoredHighlightLayer
Advanced highlight layer with colored highlights.

```tsx
import { ColoredHighlightLayer, type ColoredHighlight } from "@anaralabs/lector";

const highlights: ColoredHighlight[] = [
  {
    id: "highlight-1",
    pageNumber: 1,
    rects: [{
      x: 100,
      y: 200,
      width: 300,
      height: 20,
    }],
    color: "rgba(255, 255, 0, 0.4)", // Yellow with transparency
  }
];

<ColoredHighlightLayer highlights={highlights} />
```

**ColoredHighlight Type:**
```typescript
type ColoredHighlight = {
  id: string;
  pageNumber: number;
  rects: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  color: string; // CSS color value with transparency
};
```

## Component Structure

All hooks MUST be used inside a component that is a child of the `Root` component:

```tsx
<Root source="/sample.pdf">
  <Pages>
    <Page>
      <CanvasLayer />
      <TextLayer />
      <ColoredHighlightLayer highlights={highlights} />
    </Page>
  </Pages>
  {/* Component using hooks goes here */}
  <PDFViewerContent /> {/* This can use hooks */}
</Root>
```

## Best Practices

1. Always use hooks inside Root context
2. Use ColoredHighlightLayer for multiple colored highlights
3. Handle selection dimensions in useEffect
4. Use debouncing for search to avoid performance issues
5. Provide loading states for better UX
6. Handle errors when jumping to highlights
7. Keep highlight areas within document bounds

## Integration Notes for Current Project

The current project (`lector-review`) already has:
- ✅ Proper Root/Pages/Page structure
- ✅ ColoredHighlightLayer imported and used
- ✅ useSearch, usePdfJump, useSelectionDimensions hooks imported
- ✅ PDFViewerContent component inside Root context

The implementation appears to follow the correct patterns from the documentation.
