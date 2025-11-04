# PDF Viewer Layout Issue

## Problem
The PDF pages are not visible in the main PDF viewer area. Only thumbnails are showing.

## Current Structure
```tsx
<Root className="flex-1 flex">
  <Search>
    {showSearchUI && <SearchUI />}  // SearchUI sidebar (w-80)
    
    <div className="flex-1 flex flex-col">  // Main PDF Area
      <div>Zoom Controls Bar</div>
      
      <div className="flex-1 grid grid-cols-[24rem,1fr]">  // PDF Content Grid
        {showThumbnails && <Thumbnails />}  // Left: Thumbnails (24rem)
        
        <div className="overflow-y-auto h-full">  // Right: PDF Viewer
          <PDFViewerContent />
            // Inside PDFViewerContent:
            <Pages className="p-4 w-full">
              <Page>...</Page>
            </Pages>
        </div>
      </div>
    </div>
  </Search>
</Root>
```

## Issue Analysis
The problem is likely that the `<Root className="flex-1 flex">` is creating a horizontal flex layout, and the `<Search>` component is taking up space, but the PDF viewer inside might not be rendering properly.

## Hypothesis
1. The `flex-1 flex` on Root might be conflicting with Search's internal layout
2. The nested flex containers might not be sizing correctly
3. The Pages component might need explicit height

## Solution
Need to ensure proper height propagation through the flex containers.
