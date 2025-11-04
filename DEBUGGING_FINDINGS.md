# Search Highlighting Debugging Findings

**Date**: November 4, 2025  
**Status**: In Progress - Compilation Issues

---

## 🔍 Root Cause Identified

### The Problem
The search highlighting was not working because:

1. **Wrong Component Structure**: The search results were rendered in the LEFT SIDEBAR (outside the `<Search>` component)
2. **Missing Context**: `jumpToHighlightRects()` requires the component to be INSIDE the `<Search>` wrapper to work properly
3. **Click Events Not Firing**: Alert tests confirmed that onClick handlers were never triggered

### The Solution (Attempted)
According to Lector documentation, the correct structure should be:

```tsx
<Search>
  <SearchUI />  {/* Search input and results */}
  <Pages>
    <Page>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer className="bg-yellow-300/40" />
    </Page>
  </Pages>
</Search>
```

---

## 📋 Implementation Steps Taken

### 1. Created SearchUI Component ✅
- **File**: `src/components/SearchUI.tsx`
- **Features**:
  - Uses `useSearch()` hook from Lector
  - Uses `usePdfJump()` for `jumpToHighlightRects()`
  - Implements both exact and fuzzy match display
  - Proper click handlers with `calculateHighlightRects()`
  - Green "✓ Exact" and Orange "≈ Fuzzy" badges

### 2. Installed Dependencies ✅
- Installed `use-debounce` package for search debouncing
- Version: 10.0.6

### 3. Updated App.tsx Structure ⚠️
- Added `SearchUI` import
- Wrapped `SearchUI` inside `<Search>` component
- Created flex layout with SearchUI sidebar and PDF viewer

### 4. Compilation Issues ❌
- **Problem**: JSX syntax errors after modifications
- **Cause**: Complex nested structure with PDFViewerContent props
- **Status**: Need to fix indentation and closing tags

---

## 🎯 Key Insights

### Why It Wasn't Working Before

1. **Search results in sidebar** were outside `<Search>` context
2. **No access to Lector's jump context** - `jumpToHighlightRects()` needs to be called from within `<Search>`
3. **HighlightLayer exists** but wasn't receiving highlight data from `jumpToHighlightRects()`

### Why It Should Work Now

1. **SearchUI inside `<Search>`** - Proper context access
2. **Uses `usePdfJump()`** - Gets `jumpToHighlightRects()` from Lector
3. **Calls `calculateHighlightRects()`** - Generates proper rect coordinates
4. **HighlightLayer already in place** - Will receive and display highlights

---

## 🔧 Remaining Work

### Immediate
1. **Fix compilation errors** - Clean up JSX structure
2. **Test SearchUI rendering** - Verify it appears correctly
3. **Test click events** - Confirm onClick fires
4. **Test highlighting** - Verify yellow highlights appear on PDF

### Testing Plan
1. Search for "cerebral"
2. Click on first exact match
3. Verify:
   - PDF scrolls to correct page
   - Yellow highlight appears on the search term
   - Highlight disappears when clicking another result

---

## 📊 Progress Summary

| Task | Status | Notes |
|------|--------|-------|
| Identify root cause | ✅ Complete | Search results outside `<Search>` context |
| Create SearchUI component | ✅ Complete | Following Lector docs pattern |
| Install dependencies | ✅ Complete | use-debounce added |
| Update App.tsx structure | ⚠️ In Progress | Compilation errors |
| Fix compilation | ⏳ Pending | JSX structure issues |
| Test highlighting | ⏳ Pending | Awaiting compilation fix |

---

## 💡 Alternative Approach (If Current Fails)

If the SearchUI sidebar approach doesn't work, we can:

1. **Keep search in left sidebar** but use a different method
2. **Use Playwright MCP** to directly manipulate the DOM
3. **Manually trigger `jumpToHighlightRects()`** from outside `<Search>` using refs
4. **Use Lector's imperative API** if available

---

## 📚 References

- [Lector Search Documentation](https://lector-weld.vercel.app/docs/code/search)
- [Working Example](https://lector-weld.vercel.app/docs/code/search) - Tested and confirmed working
- SearchUI component: `/home/ubuntu/lector-review/src/components/SearchUI.tsx`

---

## ✨ Expected Outcome

Once compilation is fixed, we should have:
- ✅ Search input inside `<Search>` context
- ✅ Both exact and fuzzy matches displayed
- ✅ Click on result scrolls to page
- ✅ Yellow highlight appears on search term
- ✅ 100% compliance with Lector documentation

**Estimated completion**: 15-30 minutes after compilation fix
