# HighlightLayer Implementation Findings

## Source
Lector Official Documentation: https://lector-weld.vercel.app/docs/code/search

## Key Discovery

**The HighlightLayer in Lector documentation DOES work** - I tested it and clicking on search results successfully highlights the search term in yellow on the PDF.

## How It Works in the Official Example

1. **HighlightLayer is added to Page component:**
```tsx
<Page>
  <CanvasLayer />
  <TextLayer />
  <HighlightLayer className="bg-yellow-200/70" />
</Page>
```

2. **Search result click handler uses jumpToHighlightRects:**
```tsx
const onClick = async () => {
  const pageProxy = getPdfPageProxy(result.pageNumber);
  const rects = await calculateHighlightRects(pageProxy, {
    pageNumber: result.pageNumber,
    text: result.text,
    matchIndex: result.matchIndex,
    searchText: originalSearchText, // For exact term highlighting
  });
  jumpToHighlightRects(rects, "pixels");
};
```

3. **The highlighting is TEMPORARY** - it appears when you click a result and disappears when you navigate away or click another result.

## What We Implemented

✅ Added `<HighlightLayer className="bg-yellow-300/40" />` to our Page component
✅ Updated `jumpToSearchResult` to use `jumpToHighlightRects()`
✅ Passing correct parameters to `calculateHighlightRects()`

## Potential Issues in Our Implementation

1. **Missing Search component wrapper?** - The official example wraps SearchUI in `<Search>` component
2. **State access method** - We're using `usePdfJump.getState()` instead of the hook directly
3. **Async timing** - Our function might not be awaiting properly
4. **HighlightLayer positioning** - Might need specific CSS or z-index

## Next Steps

1. Check if we need to wrap our search UI in `<Search>` component
2. Verify the `usePdfJump` hook is being used correctly
3. Add error handling and logging to see if `jumpToHighlightRects` is actually being called
4. Test if the highlighting is working but just not visible (z-index or opacity issue)
