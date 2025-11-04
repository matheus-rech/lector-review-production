# Highlight Feature Documentation Analysis

## Official Lector Documentation Example

### Key Components Required

1. **HighlightLayer** component (NOT CustomLayer)
   - Must be added as a child of Page
   - Has className prop for styling (e.g., "bg-yellow-200/70")
   - Automatically renders highlights from Lector's internal state

2. **usePdfJump()** hook
   - Returns `jumpToHighlightRects()` function
   - Used to navigate to specific highlights
   - Takes highlights array and unit type ("pixels")

3. **Highlight Data Structure**
   ```tsx
   type HighlightRect = {
     pageNumber: number;
     left: number;
     top: number;
     width: number;
     height: number;
   };
   ```

### Proper Structure

```tsx
<Root source="/my-document.pdf">
  <Pages>
    <Page>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer className="bg-yellow-200/70" />
    </Page>
  </Pages>
</Root>
```

### Navigation Pattern

```tsx
const { jumpToHighlightRects } = usePdfJump();

const handleHighlightClick = (highlights) => {
  jumpToHighlightRects(highlights, "pixels");
};
```

## Current Implementation Issues

### ❌ WRONG: Using CustomLayer
```tsx
<CustomLayer>
  {(pageNumber) => {
    const pageHighlights = highlights.filter(
      (h) => h.pageNumber === pageNumber
    );
    return (
      <div className="absolute inset-0 pointer-events-none">
        {pageHighlights.map((h) => (
          <div
            key={h.id}
            style={{
              left: `${h.x}px`,
              top: `${h.y}px`,
              width: `${h.width}px`,
              height: `${h.height}px`,
              backgroundColor: h.kind === "search" ? "rgba(255, 255, 0, 0.4)" : "rgba(0, 255, 0, 0.3)",
            }}
          />
        ))}
      </div>
    );
  }}
</CustomLayer>
```

### ✅ CORRECT: Using HighlightLayer
```tsx
<HighlightLayer className="bg-yellow-200/70" />
```

## Problems with Current Approach

1. **Manual Rendering**: We're manually creating div elements for each highlight
2. **Custom State Management**: Using our own `highlights` state instead of Lector's internal state
3. **No Integration**: Not using Lector's `setHighlight` from `usePdf((state) => state.setHighlight)`
4. **Positioning Issues**: Manual positioning might not align perfectly with Lector's coordinate system

## Required Changes

1. Replace `CustomLayer` with `HighlightLayer`
2. Use `usePdf((state) => state.setHighlight)` instead of custom state
3. Use `jumpToHighlightRects()` for navigation
4. Simplify highlight data structure to match Lector's expected format
