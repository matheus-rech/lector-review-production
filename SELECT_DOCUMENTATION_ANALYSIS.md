# Select Feature Documentation Analysis

## Official Lector Documentation Example

### Key Components Required

1. **useSelectionDimensions()** hook
   - Returns selection dimensions object
   - Has `getDimension()` method that returns:
     - `highlights` array
     - `isCollapsed` boolean

2. **usePdf((state) => state.setHighlight)** 
   - Used to set highlights in the PDF state
   - Called with the highlights array from selection dimensions

3. **SelectionTooltip** component
   - Wraps custom button/UI for selection actions
   - Automatically positioned near selected text

4. **HighlightLayer** component
   - Must be added to Page component
   - Has className prop for styling (e.g., "bg-yellow-200/70")
   - Renders the actual highlight overlays

### Proper Structure

```tsx
<Root>
  <Pages>
    <Page>
      {selectionDimensions && <CustomSelect onHighlight={handleHighlight} />}
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer className="bg-yellow-200/70" />
    </Page>
  </Pages>
</Root>
```

### Handler Pattern

```tsx
const handleHighlight = () => {
  const dimension = selectionDimensions.getDimension();
  if (dimension && !dimension.isCollapsed) {
    setHighlights(dimension.highlights);
  }
};
```

## Current Implementation Issues to Check

1. ❓ Are we using `useSelectionDimensions()` hook?
2. ❓ Are we using `usePdf((state) => state.setHighlight)`?
3. ❓ Do we have `HighlightLayer` component in the Page?
4. ❓ Is SelectionTooltip properly configured?
5. ❓ Are we calling `getDimension()` and checking `isCollapsed`?

## Next Steps

1. Review current App.tsx implementation
2. Compare with documentation pattern
3. Identify discrepancies
4. Fix implementation to match documentation
