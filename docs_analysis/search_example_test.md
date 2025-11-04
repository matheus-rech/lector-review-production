# Search Example Test Results

From: https://lector-weld.vercel.app/docs/code/search

## Test Performed

**Search Term**: "tumor"  
**Date**: November 4, 2025  
**Example**: Exact Search Term Highlighting

## Results Observed

### Search Results Display
- **Exact Matches**: 3 results shown
  - "tumor develops a vascular microenvironment..." - Page 1
  - "tumor.Methods: Two patient-derived xenograft..." - Page 1
  - "Tumors were transplanted to anorthotopic site..." - Page 1

- **Similar Matches** (Fuzzy): 1 result shown
  - "tumourigenicity and metastasis..." - Page 12 (80% match)

- **Load More Button**: Visible and functional

### UI Structure Observed

```
┌─────────────────────────────────────────┐
│  Search Input Box                       │
│  "tumor"                                 │
├─────────────────────────────────────────┤
│  Exact Matches                           │
│  ├─ Result 1 (Page 1)                   │
│  ├─ Result 2 (Page 1)                   │
│  └─ Result 3 (Page 1)                   │
│                                          │
│  Similar Matches                         │
│  └─ Result 1 (Page 12) - 80% match      │
│                                          │
│  [Load More Results]                     │
└─────────────────────────────────────────┘
```

## Key Observations

### 1. Component Structure (from code)
```tsx
<Root source="/pdf/pathways.pdf" className="flex bg-gray-50 h-[500px]">
  <Search>
    <SearchUI />
  </Search>
  <Pages className="p-4 w-full">
    <Page>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer className="bg-yellow-200/70" />
    </Page>
  </Pages>
</Root>
```

**Critical Pattern**: 
- `<Search>` and `<Pages>` are **SIBLINGS** inside `<Root>`
- `<SearchUI />` is **INSIDE** `<Search>`
- This is a **HORIZONTAL LAYOUT** (`className="flex"`)
- SearchUI is on the LEFT, Pages on the RIGHT

### 2. SearchUI Component Features
- Uses `useSearch()` hook (requires `<Search>` wrapper)
- Uses `usePdfJump()` hook (requires `<Search>` wrapper)
- Debounced search with 500ms delay
- Shows both exact and fuzzy matches
- Load more functionality
- Limit starts at 5, increases by 5

### 3. ResultItem Component
- Uses `getPdfPageProxy()` from `usePdf()` hook
- Calls `calculateHighlightRects()` with:
  - `pageNumber`
  - `text`
  - `matchIndex`
  - `searchText` (for exact highlighting)
- Calls `jumpToHighlightRects(rects, "pixels")`

### 4. Search Results Structure
```typescript
results.exactMatches  // Array of SearchResult
results.fuzzyMatches  // Array of SearchResult (called "Similar Matches" in UI)
results.hasMoreResults // Boolean
```

## Critical Insights

### Why This Works

1. **Context Sharing**: `<Search>` wrapper provides context to both:
   - SearchUI (uses hooks to search and navigate)
   - Pages/HighlightLayer (receives highlighting data)

2. **Sibling Relationship**: Search and Pages are siblings, not nested
   - This allows SearchUI to be in a sidebar while Pages shows the PDF

3. **Horizontal Layout**: Using `flex` on Root creates side-by-side layout
   - SearchUI: Fixed width (`w-80`)
   - Pages: Flexible width (`w-full`)

### Why Our Previous Attempts Failed

Our App.tsx has a **DIFFERENT structure**:
```tsx
<Root>
  <div> {/* Complex layout with sidebars */}
    <aside>Left Sidebar</aside>
    <main>
      <Pages>...</Pages>
    </main>
    <aside>Right Sidebar</aside>
  </div>
</Root>
```

**Problem**: We need to wrap with `<Search>` but our layout is more complex than the example!

## The Solution

We need to:
1. Wrap the layout with `<Search>` (inside `<Root>`)
2. Place `<SearchUI />` in the left sidebar
3. Keep `<Pages>` with `<HighlightLayer>` in the main area
4. Ensure both are descendants of `<Search>`

```tsx
<Root>
  <Search>  {/* ADD THIS */}
    <div className="flex">
      <aside>
        {/* Other sidebar content */}
        <SearchUI />  {/* ADD THIS */}
      </aside>
      <main>
        <Pages>
          <Page>
            <HighlightLayer />
          </Page>
        </Pages>
      </main>
    </div>
  </Search>  {/* ADD THIS */}
</Root>
```

## Fuzzy Matching Observation

The example shows "Similar Matches" with a percentage (80% match).
This confirms that Lector supports fuzzy matching out of the box!

Our implementation already uses this:
- `results.exactMatches` → Green "✓ Exact" badge
- `results.fuzzyMatches` → Orange "≈ Fuzzy" badge

## Next Steps

1. Apply the correct `<Search>` wrapper pattern to our App.tsx
2. Integrate `<SearchUI />` into the left sidebar
3. Test that highlighting works
4. Verify exact and fuzzy matches display correctly

---

*Test Date: November 4, 2025*  
*Example URL: https://lector-weld.vercel.app/docs/code/search*  
*Status: Pattern identified, ready to implement*
