# Complete Lector Pattern Analysis

**Date**: November 4, 2025  
**Source**: https://lector-weld.vercel.app/docs/code/search  
**Purpose**: Understand correct implementation patterns for 100% compliance

---

## 🎯 THE CRITICAL PATTERN

### Official Lector Search Structure

```tsx
<Root source="/pdf/pathways.pdf" className="flex bg-gray-50 h-[500px]">
  <Search>                    {/* ← Context provider */}
    <SearchUI />              {/* ← Left side (w-80) */}
  </Search>
  <Pages className="p-4 w-full">  {/* ← Right side (flexible) */}
    <Page>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer className="bg-yellow-200/70" />
    </Page>
  </Pages>
</Root>
```

### Key Observations

1. **`<Search>` and `<Pages>` are SIBLINGS** inside `<Root>`
2. **Horizontal layout**: `className="flex"` on Root creates side-by-side
3. **SearchUI inside Search**: Gets access to hooks
4. **HighlightLayer inside Pages**: Receives highlighting data
5. **Context sharing**: Both siblings share the Search context

---

## 📊 Test Results

### Test 1: Search for "melanoma"

**Results**:
- **Exact Matches**: 3 results
  - Page 1: "melanomaxenograftsRuixia Huang..."
  - Page 1: "melanoma of the skin can metastasize..."
  - Page 1: "melanomas andcharacteristic features..."

- **Similar Matches** (Fuzzy): 2 results
  - Page 1: 75% match
  - Page 1: 75% match

- **Load More**: Button visible and functional

### Test 2: Search for "tumor" (from earlier)

**Results**:
- **Exact Matches**: 3 results
- **Similar Matches**: 1 result (80% match - "tumourigenicity")
- **Load More**: Available

---

## 🔍 Component Breakdown

### 1. SearchUI Component

```tsx
function SearchUI() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 500);
  const [limit, setLimit] = useState(5);
  const { searchResults: results, search } = useSearch();  // ← Requires <Search> wrapper
  
  useEffect(() => {
    setLimit(5);
    search(debouncedSearchText, { limit: 5 });
  }, [debouncedSearchText]);
  
  const handleLoadMore = async () => {
    const newLimit = limit + 5;
    await search(debouncedSearchText, { limit: newLimit });
    setLimit(newLimit);
  };
  
  return (
    <div className="flex flex-col w-80 h-full">
      {/* Search input */}
      {/* Results list */}
      {/* Load more button */}
    </div>
  );
}
```

**Dependencies**:
- `useSearch()` - MUST be inside `<Search>`
- `useDebounce()` - From `use-debounce` package
- `useState()`, `useEffect()` - React hooks

### 2. ResultItem Component

```tsx
const ResultItem = ({ result, originalSearchText }: ResultItemProps) => {
  const { jumpToHighlightRects } = usePdfJump();  // ← Requires <Search> wrapper
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);
  
  const onClick = async () => {
    const pageProxy = getPdfPageProxy(result.pageNumber);
    const rects = await calculateHighlightRects(pageProxy, {
      pageNumber: result.pageNumber,
      text: result.text,
      matchIndex: result.matchIndex,
      searchText: originalSearchText,  // ← For exact highlighting
    });
    jumpToHighlightRects(rects, "pixels");
  };
  
  return (
    <div className="flex py-2 hover:bg-gray-50 flex-col cursor-pointer" onClick={onClick}>
      <p className="text-sm text-gray-900">{result.text}</p>
      <span className="ml-auto">Page {result.pageNumber}</span>
    </div>
  );
};
```

**Dependencies**:
- `usePdfJump()` - MUST be inside `<Search>`
- `usePdf()` - Access to PDF proxy
- `calculateHighlightRects()` - Utility function
- `jumpToHighlightRects()` - From usePdfJump hook

### 3. Search Results Structure

```typescript
interface SearchResults {
  exactMatches: SearchResult[];
  fuzzyMatches: SearchResult[];  // Called "Similar Matches" in UI
  hasMoreResults: boolean;
}

interface SearchResult {
  pageNumber: number;
  text: string;
  matchIndex: number;
}
```

---

## 🏗️ Our Application Structure (Current)

```tsx
<Root source={pdfSource}>
  <div className="flex h-screen">
    <aside className="w-64">
      {/* Left Sidebar */}
      {/* Project selector */}
      {/* PDF Management */}
      {/* OLD SEARCH UI */}  ← Need to replace with <SearchUI />
      {/* Export buttons */}
    </aside>
    
    <main className="flex-1">
      <div className="flex flex-col">
        <Root>  {/* Nested Root! */}
          <Pages>
            <Page>
              <CanvasLayer />
              <TextLayer />
              <HighlightLayer />
            </Page>
          </Pages>
        </Root>
      </div>
    </main>
    
    <aside className="w-340px">
      {/* Right Sidebar */}
      {/* Document fields */}
    </aside>
  </div>
</Root>
```

**Problem**: Complex three-column layout, nested Root components!

---

## ✅ THE SOLUTION

### Option A: Wrap Entire Layout with Search

```tsx
<Root source={pdfSource}>
  <Search>  {/* ← ADD THIS */}
    <div className="flex h-screen">
      <aside className="w-64">
        {/* Left Sidebar */}
        <SearchUI />  {/* ← REPLACE old search */}
      </aside>
      
      <main className="flex-1">
        <Pages>
          <Page>
            <CanvasLayer />
            <TextLayer />
            <HighlightLayer />
          </Page>
        </Pages>
      </main>
      
      <aside className="w-340px">
        {/* Right Sidebar */}
      </aside>
    </div>
  </Search>  {/* ← ADD THIS */}
</Root>
```

**Pros**:
- ✅ Follows official pattern
- ✅ SearchUI can access hooks
- ✅ HighlightLayer receives data
- ✅ Minimal changes

**Cons**:
- ⚠️ Need to remove nested Root
- ⚠️ Need to adjust layout structure

### Option B: Simplify to Match Official Example

```tsx
<Root source={pdfSource} className="flex">
  <Search>
    <SearchUI />
  </Search>
  <Pages className="flex-1">
    <Page>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer />
    </Page>
  </Pages>
</Root>
```

**Pros**:
- ✅ Exactly matches official pattern
- ✅ Simplest implementation
- ✅ Guaranteed to work

**Cons**:
- ❌ Loses three-column layout
- ❌ Loses left/right sidebars
- ❌ Major refactoring required

---

## 🎨 Layout Comparison

### Official Example (Two-Column)
```
┌─────────────────────────────────────┐
│ <Root className="flex">             │
│ ┌──────────┬────────────────────┐   │
│ │ <Search> │ <Pages>            │   │
│ │ SearchUI │ PDF Viewer         │   │
│ │ (w-80)   │ (w-full)           │   │
│ └──────────┴────────────────────┘   │
└─────────────────────────────────────┘
```

### Our Application (Three-Column)
```
┌──────────────────────────────────────────────────┐
│ <Root>                                           │
│ ┌────────┬─────────────────┬─────────────────┐  │
│ │ Left   │ Main            │ Right           │  │
│ │ Sidebar│ PDF Viewer      │ Sidebar         │  │
│ │ (w-64) │ (flex-1)        │ (w-340px)       │  │
│ │        │                 │                 │  │
│ │ Search │ <Pages>         │ Document        │  │
│ │ UI     │ <HighlightLayer>│ Fields          │  │
│ └────────┴─────────────────┴─────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Challenge**: How to wrap with `<Search>` while preserving three-column layout?

---

## 💡 Recommended Approach

### Step 1: Add Search Import

```tsx
import { Search } from "@anaralabs/lector";
import { SearchUI } from "./components/SearchUI";
```

### Step 2: Wrap Layout with Search

Find the return statement (around line 1158):

```tsx
return (
  <Search>  {/* ← ADD */}
    <div className="flex h-screen bg-gray-50">
      {/* Existing layout */}
    </div>
  </Search>  {/* ← ADD */}
);
```

### Step 3: Replace Old Search UI

Find old search section (lines ~1261-1359):

```tsx
{/* OLD: 98 lines of custom search code */}
{/* Enhanced Search */}
<div className="space-y-2">
  <label>Search</label>
  <input ... />
  {/* ... 98 lines ... */}
</div>

{/* NEW: 2 lines using Lector component */}
{/* Lector Search UI */}
<SearchUI />
```

### Step 4: Test

1. Start dev server: `npm run dev`
2. Open application
3. Type search term (e.g., "cerebral")
4. Verify:
   - ✅ Results appear
   - ✅ Yellow highlights on PDF
   - ✅ Exact/fuzzy badges
   - ✅ Click result → jumps to page

---

## 📈 Expected Results

### Before Integration (95%)
- ✅ Visual highlighting works
- ✅ Exact + fuzzy search functional
- ⚠️ Custom search UI (98 lines)
- ⚠️ Not following official pattern

### After Integration (100%)
- ✅ Visual highlighting works
- ✅ Exact + fuzzy search functional
- ✅ Lector SearchUI component
- ✅ Official pattern followed
- ✅ Cleaner code (-96 lines)
- ✅ **100% Lector compliance!**

---

## 🚨 Common Pitfalls to Avoid

### ❌ Don't Do This
```tsx
// SearchUI outside Search wrapper
<div>
  <SearchUI />  {/* ← Won't work! */}
</div>
<Search>
  <Pages>...</Pages>
</Search>
```

### ❌ Don't Do This
```tsx
// Search inside Pages
<Pages>
  <Search>  {/* ← Wrong hierarchy! */}
    <SearchUI />
  </Search>
</Pages>
```

### ✅ Do This
```tsx
// Search wraps both SearchUI and Pages
<Search>
  <div>
    <SearchUI />  {/* ← Can be in sidebar */}
  </div>
  <Pages>...</Pages>
</Search>
```

---

## 📚 Key Takeaways

1. **`<Search>` is a context provider** - Must wrap both SearchUI and Pages
2. **SearchUI and Pages are siblings** - Not parent-child
3. **Hooks require context** - `useSearch()` and `usePdfJump()` need `<Search>`
4. **Layout flexibility** - Can have complex layouts inside `<Search>`
5. **Fuzzy matching works** - `results.fuzzyMatches` with percentage scores
6. **Load more pagination** - Built-in with `hasMoreResults` flag
7. **Debouncing recommended** - 500ms delay prevents excessive searches

---

## 🎯 Next Actions

1. ✅ **Analysis Complete** - Pattern identified
2. ⏳ **Apply to App.tsx** - Add `<Search>` wrapper
3. ⏳ **Integrate SearchUI** - Replace old search UI
4. ⏳ **Test Implementation** - Verify highlighting works
5. ⏳ **Commit to GitHub** - Save working version
6. ⏳ **Report to User** - 100% compliance achieved!

---

*Analysis Completed: November 4, 2025*  
*Official Docs: https://lector-weld.vercel.app/docs/code/search*  
*Status: Ready for implementation*  
*Confidence: Very High*
