# SearchUI Integration - Complete Diff

This document shows the **exact before/after changes** needed to integrate SearchUI.

---

## Change 1: Add SearchUI Import

**Location**: Line ~36  
**File**: `src/App.tsx`

```diff
  import { Toast, useToast } from "./components/Toast";
+ import { SearchUI } from "./components/SearchUI";
  import { usePDFManager } from "./hooks/usePDFManager";
  import type { SearchMatch } from "./types";
```

---

## Change 2: Add Search Wrapper Opening

**Location**: Line 1159  
**File**: `src/App.tsx`

```diff
  }, [searchTerm]);

  return (
+   <Search>
      <div className="flex h-screen bg-gray-50">
        {/* Toast notifications */}
        <Toast toasts={toasts} onRemove={removeToast} />
```

---

## Change 3: Replace Old Search UI with SearchUI

**Location**: Lines 1261-1359  
**File**: `src/App.tsx`

```diff
          </span>
        </div>

-       {/* Enhanced Search */}
-       <div className="space-y-2">
-         <label className="text-xs font-semibold">Search</label>
-         <input
-           className="w-full border p-1 rounded text-sm"
-           placeholder="Search in PDF..."
-           value={searchTerm}
-           onChange={(e) => setSearchTerm(e.target.value)}
-           aria-label="Search in PDF"
-           role="searchbox"
-           aria-describedby="search-description"
-         />
-         <span id="search-description" className="sr-only">
-           Search for text within the PDF document
-         </span>
-
-         {searchResultCount > 0 && (
-           <>
-             {/* Navigation Controls */}
-             <div className="flex items-center justify-between gap-2">
-               <div className="text-xs text-gray-600">
-                 Match {currentSearchIndex + 1} of {searchResultCount}
-               </div>
-               <div className="flex gap-1">
-                 <button
-                   onClick={prevSearchResult}
-                   className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
-                   title="Previous match"
-                   aria-label="Previous search result"
-                 >
-                   ◀
-                 </button>
-                 <button
-                   onClick={nextSearchResult}
-                   className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
-                   title="Next match"
-                   aria-label="Next search result"
-                 >
-                   ▶
-                 </button>
-               </div>
-             </div>
-
-             {/* Results List */}
-             <div className="max-h-40 overflow-y-auto border rounded text-xs bg-white">
-               {searchResultsData
-                 .slice(0, 10)
-                 .map((result: SearchMatch, index: number) => (
-                   <div
-                     key={index}
-                     onClick={() => {
-                       console.log('[onClick] Search result clicked, index:', index);
-                       jumpToSearchResult(index);
-                     }}
-                     className={`p-2 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 ${
-                       index === currentSearchIndex ? "bg-blue-100" : ""
-                     }`}
-                     role="button"
-                     tabIndex={0}
-                     aria-label={`Go to search result ${index + 1} on page ${
-                       result.pageNumber
-                     }`}
-                     onKeyDown={(e) => {
-                       if (e.key === "Enter" || e.key === " ") {
-                         e.preventDefault();
-                         jumpToSearchResult(index);
-                       }
-                     }}
-                   >
-                     <div className="flex items-center justify-between">
-                       <div className="font-medium text-blue-700">
-                         Page {result.pageNumber}
-                       </div>
-                       {(result as any).type && (
-                         <span
-                           className={`text-[10px] px-1.5 py-0.5 rounded ${
-                             (result as any).type === 'exact'
-                               ? 'bg-green-100 text-green-700'
-                               : 'bg-orange-100 text-orange-700'
-                           }`}
-                         >
-                           {(result as any).type === 'exact' ? '✓ Exact' : '≈ Fuzzy'}
-                         </span>
-                       )}
-                     </div>
-                     <div className="text-gray-600 truncate">
-                       {result.text?.substring(0, 60) || "Match found"}...
-                     </div>
-                   </div>
-                 ))}
-               {searchResultsData.length > 10 && (
-                 <div className="p-2 text-center text-gray-500 italic">
-                   Showing first 10 of {searchResultCount} results
-                 </div>
-               )}
-             </div>
-           </>
-         )}
-       </div>
+       {/* Lector Search UI */}
+       <SearchUI />

        {/* Export */}
        <div className="space-x-2">
```

---

## Change 4: Add Search Wrapper Closing

**Location**: End of return statement (around line 1680)  
**File**: `src/App.tsx`

```diff
              </aside>
            </main>
          </div>
+       </Search>
      );
    }

    export default App;
```

---

## Summary

**Total Changes**: 4  
**Lines Added**: 3  
**Lines Removed**: 98  
**Net Change**: -95 lines (simpler code!)

**Files Modified**:
- `src/App.tsx`

**Files Required**:
- `src/components/SearchUI.tsx` (already created)

---

## Visual Diff

### Before (Current State)
```
App.tsx
├── return (
│   ├── <div className="flex h-screen">
│   │   ├── <aside> (Left Sidebar)
│   │   │   ├── Project selector
│   │   │   ├── PDF Management
│   │   │   ├── OLD SEARCH UI (98 lines) ❌
│   │   │   └── Export buttons
│   │   ├── <main> (PDF Viewer)
│   │   │   └── <Root>
│   │   │       └── <Pages>
│   │   └── <aside> (Right Sidebar)
│   └── </div>
└── );
```

### After (Target State)
```
App.tsx
├── return (
│   ├── <Search> ✨ NEW
│   │   ├── <div className="flex h-screen">
│   │   │   ├── <aside> (Left Sidebar)
│   │   │   │   ├── Project selector
│   │   │   │   ├── PDF Management
│   │   │   │   ├── <SearchUI /> ✨ NEW (2 lines)
│   │   │   │   └── Export buttons
│   │   │   ├── <main> (PDF Viewer)
│   │   │   │   └── <Root>
│   │   │   │       └── <Pages>
│   │   │   └── <aside> (Right Sidebar)
│   │   └── </div>
│   └── </Search> ✨ NEW
└── );
```

---

## Code Reduction

**Before**: 98 lines of custom search code  
**After**: 2 lines using Lector component  
**Reduction**: 96 lines removed  
**Benefit**: Cleaner, more maintainable code following Lector patterns

---

## Verification Checklist

After applying changes:

- [ ] Import added at top of file
- [ ] `<Search>` opens before `<div className="flex h-screen">`
- [ ] Old search code (lines 1261-1359) replaced with `<SearchUI />`
- [ ] `</Search>` closes after `</div>` (main container)
- [ ] No compilation errors
- [ ] Application loads in browser
- [ ] SearchUI visible in left sidebar
- [ ] Search functionality works
- [ ] Yellow highlights appear on PDF
- [ ] Exact/fuzzy badges display correctly

---

*Diff Created: November 4, 2025*  
*Target: 100% Lector Compliance*
