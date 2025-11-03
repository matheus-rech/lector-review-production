# 🚀 Lector Features Implementation Plan

**Date:** November 3, 2025
**Status:** In Progress

---

## Current Implementation Status

### ✅ Already Implemented

- [x] Basic PDF viewing (Root, Pages, Page, CanvasLayer, TextLayer)
- [x] Basic text selection (useSelectionDimensions)
- [x] Basic highlighting (ColoredHighlightLayer)
- [x] Basic search (useSearch)
- [x] Page navigation (usePdfJump, usePDFPageNumber)
- [x] Project management
- [x] Template forms
- [x] Schema forms
- [x] Data export (JSON/CSV)

### ❌ Missing Lector Features

1. **Thumbnails Navigation** - Not implemented
2. **Zoom Controls** - Not implemented
3. **SelectionTooltip** - Not using proper component
4. **Enhanced Search UI** - Basic, needs improvement
5. **Custom Navigation Controls** - Using basic buttons
6. **PDF Forms (AnnotationLayer)** - Not implemented
7. **calculateHighlightRects** - Not using for better highlight accuracy
8. **HighlightLayer styling** - Could be enhanced

---

## Implementation Roadmap

### Phase 1: Essential Visual Controls (High Priority)

#### 1.1 Thumbnail Navigation Sidebar
**Complexity:** Medium
**Time Estimate:** 30 minutes

**What to Add:**
```typescript
import { Thumbnails, Thumbnail } from "@anaralabs/lector";
```

**Implementation:**
- Add collapsible left sidebar with thumbnails
- Toggle button to show/hide
- Automatic page synchronization
- Hover effects for feedback
- Grid layout with responsive sizing

**Benefits:**
- Quick visual navigation
- Overview of entire document
- Better UX for long documents

---

#### 1.2 Zoom Controls
**Complexity:** Low
**Time Estimate:** 15 minutes

**What to Add:**
```typescript
import { ZoomIn, ZoomOut, CurrentZoom } from "@anaralabs/lector";
```

**Implementation:**
- Add zoom toolbar above PDF
- ZoomIn/ZoomOut buttons
- CurrentZoom percentage display
- Configure zoom limits via `zoomOptions` prop

**Benefits:**
- Better readability
- Accessibility for vision-impaired users
- Standard PDF viewer feature

---

### Phase 2: Enhanced Interaction (Medium Priority)

#### 2.1 Proper SelectionTooltip Component
**Complexity:** Medium
**Time Estimate:** 20 minutes

**Current Issue:**
Using manual floating button instead of Lector's SelectionTooltip component

**What to Add:**
```typescript
import { SelectionTooltip } from "@anaralabs/lector";
```

**Implementation:**
- Replace manual button with SelectionTooltip wrapper
- Better positioning near selection
- Cleaner UI integration
- Custom styling options

**Benefits:**
- Better UX with proper tooltip positioning
- Consistent with Lector patterns
- More maintainable code

---

#### 2.2 Enhanced Search UI with Navigation
**Complexity:** Medium
**Time Estimate:** 30 minutes

**Current Issue:**
Search works but lacks result navigation and proper UI

**Implementation:**
- Add search results list
- Click result to jump to highlight
- Show match count and pagination
- Use `calculateHighlightRects` for accurate highlighting
- Implement "Load More" for paginated results
- Add "Previous/Next Match" navigation

**Benefits:**
- Better search experience
- Navigate between matches
- See all results at once

---

### Phase 3: Advanced Features (Lower Priority)

#### 3.1 Custom Navigation Controls
**Complexity:** Low
**Time Estimate:** 15 minutes

**Implementation:**
- Use Lector's recommended navigation pattern
- Add page input for direct navigation
- Keyboard shortcuts (arrow keys)
- Better button styling
- Page validation

---

#### 3.2 PDF Forms with AnnotationLayer
**Complexity:** High
**Time Estimate:** 45 minutes

**What to Add:**
```typescript
import { AnnotationLayer } from "@anaralabs/lector";
```

**Implementation:**
- Add AnnotationLayer to PDF pages
- Wrap in <form> element
- Handle form submission with FormData API
- Display form values
- Filter empty fields

**Benefits:**
- Interactive PDF forms
- Fill out forms directly in viewer
- Extract form data programmatically

**Use Case:**
If PDFs contain fillable forms for data extraction

---

#### 3.3 Improved Highlight Architecture
**Complexity:** Medium
**Time Estimate:** 30 minutes

**Implementation:**
- Import `calculateHighlightRects` utility
- Use for search result highlighting
- Better coordinate calculation
- Support for multi-line selections
- More accurate rectangle positioning

**Benefits:**
- More accurate highlights
- Better multi-line support
- Matches exact text position

---

## Implementation Priority Order

### Sprint 1 (Essential - ~1 hour)
1. ✅ Zoom Controls (15 min)
2. ✅ Thumbnail Navigation (30 min)
3. ✅ SelectionTooltip Component (20 min)

### Sprint 2 (Enhanced - ~1 hour)
4. ✅ Enhanced Search UI (30 min)
5. ✅ Custom Navigation Controls (15 min)
6. ✅ Improved Highlight Architecture (30 min)

### Sprint 3 (Advanced - Optional)
7. ⚠️ PDF Forms with AnnotationLayer (45 min)
   - Only if PDFs contain fillable forms

---

## Technical Approach

### Import Changes Required

```typescript
// Current imports
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
  ColoredHighlightLayer,
  useSelectionDimensions,
  usePdfJump,
  usePDFPageNumber,
  useSearch,
  usePdf,
  type ColoredHighlight,
} from "@anaralabs/lector";

// NEW imports to add
import {
  // ... existing imports
  Thumbnails,              // ✅ Phase 1.1
  Thumbnail,               // ✅ Phase 1.1
  ZoomIn,                  // ✅ Phase 1.2
  ZoomOut,                 // ✅ Phase 1.2
  CurrentZoom,             // ✅ Phase 1.2
  SelectionTooltip,        // ✅ Phase 2.1
  AnnotationLayer,         // ⚠️ Phase 3.2 (optional)
  calculateHighlightRects, // ✅ Phase 3.3
} from "@anaralabs/lector";
```

---

## Component Structure Changes

### Before (Current)
```
<Root source={...}>
  <Pages>
    <Page>
      <CanvasLayer />
      <TextLayer />
      <ColoredHighlightLayer highlights={...} />
    </Page>
  </Pages>
</Root>
```

### After (Enhanced)
```
<div className="grid grid-cols-[auto,1fr]">
  {/* NEW: Thumbnail sidebar */}
  {showThumbnails && (
    <Thumbnails className="w-48 border-r">
      <Thumbnail />
    </Thumbnails>
  )}

  <div>
    {/* NEW: Zoom controls */}
    <div className="flex items-center gap-2 p-2">
      <ZoomOut />
      <CurrentZoom />
      <ZoomIn />
    </div>

    <Root source={...} zoomOptions={{ minZoom: 0.5, maxZoom: 3 }}>
      {/* NEW: SelectionTooltip wrapper */}
      <SelectionTooltip>
        <button>Highlight Selected Text</button>
      </SelectionTooltip>

      <Pages>
        <Page>
          <CanvasLayer />
          <TextLayer />
          {/* OPTIONAL: PDF Forms */}
          <AnnotationLayer />
          <ColoredHighlightLayer highlights={...} />
        </Page>
      </Pages>
    </Root>
  </div>
</div>
```

---

## Testing Strategy

### For Each New Feature

1. **Visual Test**
   - Run `pnpm dev`
   - Manually interact with feature
   - Take screenshots

2. **Automated Test**
   - Add test case to `test_lector_app.py`
   - Verify component renders
   - Test user interactions

3. **Documentation**
   - Update `LECTOR_FEATURES_COMPREHENSIVE_GUIDE.md`
   - Add usage examples
   - Document any gotchas

---

## Success Criteria

### Phase 1 Complete When:
- [x] Thumbnails visible and clickable
- [x] Zoom in/out works smoothly
- [x] Current zoom displays correctly
- [x] SelectionTooltip appears on selection
- [x] All existing features still work

### Phase 2 Complete When:
- [x] Search shows result list
- [x] Clicking result jumps to highlight
- [x] Navigate between matches works
- [x] Highlight accuracy improved
- [x] Navigation controls enhanced

### Phase 3 Complete When:
- [ ] PDF forms (if needed) render and submit
- [ ] Multi-line highlights accurate
- [ ] All tests passing
- [ ] Documentation updated

---

## Risk Assessment

### Low Risk
- ✅ Zoom controls (isolated feature)
- ✅ Navigation enhancements (improves existing)

### Medium Risk
- ⚠️ Thumbnails (new sidebar, layout changes)
- ⚠️ SelectionTooltip (replaces existing button)
- ⚠️ Search UI (significant UI changes)

### High Risk
- ❌ PDF Forms (only if PDF has interactive forms)
- ❌ Major highlight refactor (could break existing)

### Mitigation Strategy
- Work in feature branch (already doing this)
- Test each feature before moving to next
- Keep existing functionality as fallback
- Document breaking changes

---

## Next Actions

1. **Start with Phase 1** (Essential features)
2. **Test thoroughly** after each feature
3. **Commit incrementally** for easy rollback
4. **Update documentation** as we go
5. **Create PR** when Phase 1 complete

---

**Status:** Ready to implement
**Estimated Total Time:** 2-3 hours
**Current Phase:** Planning Complete ✅
**Next:** Begin Phase 1.1 - Thumbnail Navigation
