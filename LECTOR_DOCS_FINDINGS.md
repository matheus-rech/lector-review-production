# Lector Documentation Findings - Search Implementation

**Source**: https://lector-weld.vercel.app/docs/code/search

## Key Discovery: Use HighlightLayer, Not CustomLayer!

### Official Lector Approach

The Lector documentation shows that search highlighting should use **`HighlightLayer`**, not `CustomLayer`:

```tsx
<Pages className="p-4 w-full">
  <Page>
    <CanvasLayer />
    <TextLayer />
    <HighlightLayer className="bg-yellow-200/70" />
  </Page>
</Pages>
```

### How It Works

1. **HighlightLayer** automatically handles search result highlighting
2. Use `jumpToHighlightRects()` to navigate to and highlight search results
3. No need to manually create highlight objects or manage highlight state
4. The highlighting is temporary and managed by Lector internally

### Example Implementation

```tsx
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
    <div onClick={onClick}>
      <p>{result.text}</p>
      <span>Page {result.pageNumber}</span>
    </div>
  );
};
```

### Key Points

1. **HighlightLayer** is the official way to show search highlights
2. **jumpToHighlightRects()** is used to navigate and highlight results
3. **calculateHighlightRects()** is called on-demand when clicking a result
4. **No state management** needed for search highlights
5. Highlights are **temporary** and disappear when navigating away

## Our Current Implementation Issues

### What We're Doing Wrong

1. ❌ Using `CustomLayer` instead of `HighlightLayer`
2. ❌ Manually creating highlight objects and adding to state
3. ❌ Trying to persist search highlights in state
4. ❌ Complex state management with multiple re-renders
5. ❌ useEffect dependencies causing infinite loops

### What We Should Do

1. ✅ Use `HighlightLayer` for search highlighting
2. ✅ Use `jumpToHighlightRects()` for navigation
3. ✅ Call `calculateHighlightRects()` on-demand when clicking results
4. ✅ Let Lector manage the highlight lifecycle
5. ✅ Keep `CustomLayer` only for user-created persistent highlights

## Implementation Plan

### Option 1: Full Rewrite (Recommended)

Replace our current search highlighting with the official Lector approach:

1. Remove all search highlight state management
2. Remove search highlight creation in useEffect
3. Add `HighlightLayer` to the Page component
4. Implement `jumpToHighlightRects()` in search result click handlers
5. Keep `CustomLayer` only for user-created highlights

### Option 2: Hybrid Approach

Keep current implementation but fix the issues:

1. Fix useEffect dependencies to prevent infinite loops
2. Ensure all highlights are created before state update
3. Debug why only 1 highlight is being created
4. This is more complex and error-prone

## Recommendation

**Use Option 1** - Rewrite to use `HighlightLayer` as shown in the official documentation. This is:
- Simpler
- More maintainable
- Less error-prone
- Officially supported
- Matches Lector's intended usage

## Components Needed

From `@anaralabs/lector`:
- `HighlightLayer` - For automatic search highlighting
- `usePdfJump()` - For navigation with `jumpToHighlightRects()`
- `calculateHighlightRects()` - Already using correctly
- `useSearch()` - Already using correctly

## Next Steps

1. Check if `HighlightLayer` is available in our Lector version
2. Implement search result click handlers with `jumpToHighlightRects()`
3. Replace search highlighting logic with official approach
4. Test with exact and fuzzy matches
5. Verify highlighting works correctly

## Benefits of Official Approach

1. **Automatic highlighting** - No manual state management
2. **Performance** - Highlights only when needed
3. **Simplicity** - Less code, fewer bugs
4. **Maintainability** - Follows official patterns
5. **Reliability** - Tested and supported by Lector team
