# Zoom Control Feature Documentation Analysis

## Official Lector Documentation Example

### Key Components Required

1. **ZoomIn** component
   - Pre-built button component for zooming in
   - Can contain custom children (e.g., "+" text)
   - Has className prop for styling

2. **ZoomOut** component
   - Pre-built button component for zooming out
   - Can contain custom children (e.g., "-" text)
   - Has className prop for styling

3. **CurrentZoom** component
   - Displays current zoom level
   - Automatically updates when zoom changes
   - Has className prop for styling

4. **zoomOptions** prop on Root
   - `minZoom`: Minimum zoom level (default: 0.1 = 10%)
   - `maxZoom`: Maximum zoom level (default: 10 = 1000%)

### Proper Structure

```tsx
<Root
  source="/pdf/document.pdf"
  zoomOptions={{
    minZoom: 0.5,  // 50% minimum
    maxZoom: 10,   // 1000% maximum
  }}
>
  <div className="zoom-controls">
    <ZoomOut className="px-3 py-1">-</ZoomOut>
    <CurrentZoom className="bg-white rounded-full px-3 py-1" />
    <ZoomIn className="px-3 py-1">+</ZoomIn>
  </div>
  <Pages>
    <Page>
      <CanvasLayer />
      <TextLayer />
    </Page>
  </Pages>
</Root>
```

### Complete Example

```tsx
const ViewerZoomControl = () => {
  return (
    <Root
      source="/pdf/document.pdf"
      className="bg-gray-100 border rounded-md overflow-hidden relative h-[500px] flex flex-col"
      loader={<div className="p-4">Loading...</div>}
      zoomOptions={{
        minZoom: 0.5,
        maxZoom: 10,
      }}
    >
      <div className="bg-gray-100 border-b p-1 flex items-center justify-center gap-2">
        Zoom
        <ZoomOut className="px-3 py-1">-</ZoomOut>
        <CurrentZoom className="bg-white rounded-full px-3 py-1 border w-16" />
        <ZoomIn className="px-3 py-1">+</ZoomIn>
      </div>
      <Pages className="p-4 h-full">
        <Page>
          <CanvasLayer />
          <TextLayer />
        </Page>
      </Pages>
    </Root>
  );
};
```

## Current Implementation Issues to Check

1. ❓ Are we using the built-in `ZoomIn` and `ZoomOut` components?
2. ❓ Are we using the `CurrentZoom` component to display zoom level?
3. ❓ Do we have `zoomOptions` configured on the Root component?
4. ❓ Are we managing zoom state manually or using Lector's built-in state?

## Key Benefits of Documentation Approach

- **Simpler**: No manual state management needed
- **Integrated**: Zoom state is managed by Lector internally
- **Consistent**: Zoom behavior is consistent across all Lector features
- **Less Code**: Pre-built components reduce boilerplate

## Comparison

### ❌ Manual Approach (Potentially Current)
```tsx
const [zoom, setZoom] = useState(100);
<button onClick={() => setZoom(z => z + 10)}>+</button>
<span>{zoom}%</span>
<button onClick={() => setZoom(z => z - 10)}>-</button>
```

### ✅ Documentation Approach
```tsx
<ZoomOut>-</ZoomOut>
<CurrentZoom />
<ZoomIn>+</ZoomIn>
```

Much simpler and integrated with Lector's internal zoom management!
