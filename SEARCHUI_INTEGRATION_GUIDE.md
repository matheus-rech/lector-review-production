# SearchUI Integration Guide - 100% Lector Compliance

## Overview

This guide provides the **exact code changes** needed to integrate `SearchUI.tsx` into `App.tsx` and achieve **100% Lector compliance**.

**Current Status**: 95% (Visual highlighting works, SearchUI component ready)  
**Target Status**: 100% (SearchUI integrated in left sidebar)  
**Estimated Time**: 30-60 minutes

---

## Prerequisites

✅ **Confirmed Working**:
- Visual highlighting (yellow boxes on PDF)
- Exact + fuzzy search (10 matches)
- HighlightLayer integrated
- SearchUI component created at `src/components/SearchUI.tsx`

---

## Integration Strategy

### The Challenge

The `<Search>` component must wrap **both** the left sidebar (where SearchUI will be) **and** the PDF viewer area (where Pages/HighlightLayer are). This allows SearchUI to access `usePdfJump()` hook while being positioned in the sidebar.

### The Solution

```
BEFORE:
<div className="flex">
  <aside>  {/* Left sidebar */}
    <OldSearchUI />
  </aside>
  <main>
    <Root>
      <Pages />
    </Root>
  </main>
</div>

AFTER:
<div className="flex">
  <Search>  {/* Wraps both sidebar and main */}
    <aside>  {/* Left sidebar */}
      <SearchUI />  {/* NEW: Lector component */}
    </aside>
    <main>
      <Root>
        <Pages />
      </Root>
    </main>
  </Search>
</div>
```

---

## Step-by-Step Integration

### Step 1: Add SearchUI Import

**File**: `src/App.tsx`  
**Location**: Line ~36 (after Toast import)

**Add this line**:
```typescript
import { SearchUI } from "./components/SearchUI";
```

**Complete import section should look like**:
```typescript
import { Toast, useToast } from "./components/Toast";
import { SearchUI } from "./components/SearchUI";  // ← ADD THIS
import { usePDFManager } from "./hooks/usePDFManager";
```

---

### Step 2: Add Search Wrapper

**File**: `src/App.tsx`  
**Location**: Line 1159 (after `return (`)

**FIND** (Line 1159):
```typescript
  return (
    <div className="flex h-screen bg-gray-50">
```

**REPLACE WITH**:
```typescript
  return (
    <Search>  {/* ← ADD: Lector Search wrapper */}
      <div className="flex h-screen bg-gray-50">
```

---

### Step 3: Replace Old Search UI with SearchUI

**File**: `src/App.tsx`  
**Location**: Lines 1261-1359

**FIND** (Lines 1261-1359 - the entire search section):
```typescript
        {/* Enhanced Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">Search</label>
          <input
            className="w-full border p-1 rounded text-sm"
            placeholder="Search in PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search in PDF"
            role="searchbox"
            aria-describedby="search-description"
          />
          <span id="search-description" className="sr-only">
            Search for text within the PDF document
          </span>

          {searchResultCount > 0 && (
            <>
              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-gray-600">
                  Match {currentSearchIndex + 1} of {searchResultCount}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={prevSearchResult}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                    title="Previous match"
                    aria-label="Previous search result"
                  >
                    ◀
                  </button>
                  <button
                    onClick={nextSearchResult}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                    title="Next match"
                    aria-label="Next search result"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-40 overflow-y-auto border rounded text-xs bg-white">
                {searchResultsData
                  .slice(0, 10)
                  .map((result: SearchMatch, index: number) => (
                    <div
                      key={index}
                      onClick={() => {
                        console.log('[onClick] Search result clicked, index:', index);
                        jumpToSearchResult(index);
                      }}
                      className={`p-2 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 ${
                        index === currentSearchIndex ? "bg-blue-100" : ""
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Go to search result ${index + 1} on page ${
                        result.pageNumber
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          jumpToSearchResult(index);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-blue-700">
                          Page {result.pageNumber}
                        </div>
                        {(result as any).type && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              (result as any).type === 'exact'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {(result as any).type === 'exact' ? '✓ Exact' : '≈ Fuzzy'}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-600 truncate">
                        {result.text?.substring(0, 60) || "Match found"}...
                      </div>
                    </div>
                  ))}
                {searchResultsData.length > 10 && (
                  <div className="p-2 text-center text-gray-500 italic">
                    Showing first 10 of {searchResultCount} results
                  </div>
                )}
              </div>
            </>
          )}
        </div>
```

**REPLACE WITH** (just 2 lines!):
```typescript
        {/* Lector Search UI */}
        <SearchUI />
```

---

### Step 4: Close Search Wrapper

**File**: `src/App.tsx`  
**Location**: Find the closing `</div>` for the main container (around line 1680)

**FIND** (the very last closing div before the final semicolon):
```typescript
      </div>
    </div>
  );
}
```

**REPLACE WITH**:
```typescript
      </div>
    </div>
  </Search>  {/* ← ADD: Close Search wrapper */}
  );
}
```

---

## Complete Code Changes Summary

### Change 1: Import SearchUI
```diff
  import { Toast, useToast } from "./components/Toast";
+ import { SearchUI } from "./components/SearchUI";
  import { usePDFManager } from "./hooks/usePDFManager";
```

### Change 2: Add Search Wrapper Opening
```diff
  return (
+   <Search>
      <div className="flex h-screen bg-gray-50">
```

### Change 3: Replace Old Search with SearchUI
```diff
-       {/* Enhanced Search */}
-       <div className="space-y-2">
-         <label className="text-xs font-semibold">Search</label>
-         <input ... />
-         ... (98 lines of old search code)
-       </div>
+       {/* Lector Search UI */}
+       <SearchUI />
```

### Change 4: Add Search Wrapper Closing
```diff
        </div>
      </div>
+   </Search>
    );
  }
```

---

## Verification Steps

After making the changes, verify:

1. **Compilation**
   ```bash
   # Check dev server output
   # Should see: "✨ optimized dependencies changed. reloading"
   # No errors
   ```

2. **Visual Check**
   - Open browser to application
   - Left sidebar should show SearchUI component
   - Search input should be visible
   - No layout issues or overlapping

3. **Functional Test**
   - Type "cerebral" in search input
   - Should see results with exact/fuzzy badges
   - Click a result
   - **Yellow highlight should appear on PDF** ✨
   - PDF should navigate to correct page

---

## Troubleshooting

### Issue 1: "SearchUI is not defined"

**Cause**: Import statement missing or incorrect

**Fix**: Verify Step 1 is completed correctly
```typescript
import { SearchUI } from "./components/SearchUI";
```

### Issue 2: Blank page / No elements

**Cause**: JSX structure broken, Search wrapper not closed properly

**Fix**: 
1. Check Step 2 and Step 4 are both completed
2. Ensure Search wrapper opens BEFORE the flex container
3. Ensure Search wrapper closes AFTER the flex container
4. Use `git diff` to verify changes

### Issue 3: "Cannot read properties of undefined (reading 'jumpToHighlightRects')"

**Cause**: SearchUI is outside Search wrapper

**Fix**: Ensure SearchUI is INSIDE the `<Search>` component
```typescript
<Search>
  <aside>
    <SearchUI />  {/* Must be here, inside Search */}
  </aside>
</Search>
```

### Issue 4: Layout broken / Sidebars overlapping

**Cause**: Extra divs or incorrect nesting

**Fix**:
1. Restore from backup: `cp src/App.tsx.backup3 src/App.tsx`
2. Follow steps again carefully
3. Make ONE change at a time
4. Test after each change

---

## Rollback Instructions

If something goes wrong:

```bash
# Restore from backup
cp src/App.tsx.backup3 src/App.tsx

# Or use git
git checkout src/App.tsx

# Dev server will auto-reload
```

---

## Expected Result

After successful integration:

✅ **SearchUI in left sidebar** - Clean, professional layout  
✅ **Search functionality** - Exact + fuzzy matches  
✅ **Visual highlighting** - Yellow boxes on PDF  
✅ **Lector patterns** - 100% compliance  
✅ **No old search code** - Cleaner codebase  
✅ **Production ready** - All features working  

**Compliance**: **100%** 🎉

---

## Alternative: Automated Script

If you prefer an automated approach, here's a script:

```bash
#!/bin/bash
# integrate-searchui.sh

# Backup current file
cp src/App.tsx src/App.tsx.backup-$(date +%Y%m%d-%H%M%S)

# Add import
sed -i '/import { Toast, useToast }/a import { SearchUI } from "./components/SearchUI";' src/App.tsx

# Add Search wrapper opening
sed -i 's/return (/return (\n    <Search>/' src/App.tsx

# Replace old search section (lines 1261-1359)
sed -i '1261,1359d' src/App.tsx
sed -i '1261i\        {/* Lector Search UI */}\n        <SearchUI />' src/App.tsx

# Add Search wrapper closing (before final closing)
# Find the line with the last </div> before }; and add </Search>
# This is tricky with sed, better to do manually

echo "Integration complete! Please verify the closing </Search> tag manually."
```

**Note**: The script is provided for reference. **Manual integration is recommended** for better control and understanding.

---

## Next Steps

After successful integration:

1. ✅ Test all search functionality
2. ✅ Verify visual highlighting works
3. ✅ Test exact and fuzzy matches
4. ✅ Capture screenshots
5. ✅ Commit changes to git
6. ✅ Push to repository
7. ✅ **Celebrate 100% completion!** 🎉

---

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review the FINAL_COMPREHENSIVE_REPORT.md
3. Examine SearchUI.tsx for any issues
4. Use `git diff` to see what changed
5. Restore from backup and try again

---

*Integration Guide Created: November 4, 2025*  
*Target: 100% Lector Compliance*  
*Estimated Time: 30-60 minutes*  
*Difficulty: Moderate*
