# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lector Review is a React-based PDF viewer for systematic literature reviews and data extraction from research papers. Built for researchers conducting meta-analyses with features like multi-project management, text highlighting with labeling, per-page field templates, schema-based forms, and data export (JSON/CSV).

**Tech Stack:** React 19 + TypeScript 5.6 + Vite 5.4 + Tailwind CSS 3.4 + [@anaralabs/lector](https://lector-weld.vercel.app/docs) + PDF.js 4.6

## Installation & Setup

### Prerequisites
- **Node.js** 16.0 or later
- **React** 16.8+ (hooks support required)
- **Package manager:** npm, yarn, pnpm, or bun

### Installation

```bash
# Install BOTH required packages (peer dependency requirement)
pnpm add @anaralabs/lector pdfjs-dist

# Required CSS import (add to src/main.tsx)
import "pdfjs-dist/web/pdf_viewer.css";
```

**⚠️ Critical:** Both `@anaralabs/lector` AND `pdfjs-dist` must be installed. Lector has `pdfjs-dist` as a peer dependency.

### PDF.js Worker Configuration

The PDF.js worker must be configured before any PDF operations. This project uses Vite:

```typescript
// In App.tsx (before any Lector components)
import { GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
```

**Other environments:**
- **Next.js App Router (13+):** Same as above
- **Next.js Pages Directory:** `import "pdfjs-dist/build/pdf.worker.min.mjs";`

## Common Commands

```bash
# Development
pnpm dev                # Start dev server (localhost:5173)
pnpm build              # Production build
pnpm preview            # Preview production build

# Testing
pnpm test               # Run unit tests (Vitest)
pnpm test:watch         # Run tests in watch mode
pnpm test:ui            # Open Vitest UI
pnpm test:coverage      # Generate coverage report
pnpm test:e2e           # Run E2E tests (Playwright)
pnpm test:e2e:ui        # Run E2E tests with UI

# Code Quality
pnpm type-check         # TypeScript type checking (no emit)
pnpm lint               # Run ESLint
pnpm format             # Format with Prettier
pnpm format:check       # Check formatting without changes

# Utilities
pnpm clean              # Remove node_modules, dist, .turbo
```

## Critical Architecture Patterns

### 1. Lector Hooks Context Requirement ⚠️

**MANDATORY:** All Lector hooks MUST be called inside `<Root>` context. This is the most common source of bugs.

```typescript
// ❌ WRONG - Hooks outside Root
function App() {
  const { jumpToPage } = usePdfJump(); // ERROR!
  return <Root source={pdf}>...</Root>
}

// ✅ CORRECT - Hooks inside Root
function App() {
  return (
    <Root source={pdf}>
      <PDFViewerContent />  {/* Hooks work here */}
    </Root>
  );
}

function PDFViewerContent() {
  const { jumpToPage } = usePdfJump(); // ✅ Works!
  const { searchResults } = useSearch();
  const selectionDimensions = useSelectionDimensions();
  // ... use hooks here
}
```

**Lector hooks requiring Root context:**
- `usePdfJump()` - Page navigation
- `useSearch()` - PDF text search
- `useSelectionDimensions()` - Text selection tracking
- `usePdf()` - PDF document access
- `usePDFPageNumber()` - Current page tracking

**Components that must be inside Root:**
- `ZoomIn`, `ZoomOut`, `CurrentZoom` - Zoom controls
- `Thumbnails`, `Thumbnail` - Thumbnail navigation
- `SelectionTooltip` - Selection UI

### 2. Data Persistence Architecture

**Two-tier storage system:**

**LocalStorage** (for lightweight data):
- Pattern: `proj:{projectName}:{dataType}`
- Examples:
  - `proj:default:highlights` - User highlights
  - `proj:study-2024:pageForm` - Form field values
  - `proj:meta-analysis:templates` - Field templates
- Global keys: `projects`, `current-project`

**IndexedDB** (for PDF files):
- Database: `LectorReviewDB`
- Store: `pdfs`
- Managed by `src/utils/pdfStorage.ts`
- Indexed by `projectName` for efficient queries

**Key Pattern:**
```typescript
const key = (project: string, name: string) => `proj:${project}:${name}`;
```

### 3. Per-Page Template System

Field data is page-specific, not global:

```typescript
// Template structure
type FieldTemplate = { id: string; label: string; placeholder?: string };
const templates: Record<number, FieldTemplate[]> = {
  1: [{ id: "study_id", label: "Study ID" }],
  2: [{ id: "study_design", label: "Design" }],
  // Different fields per page
};

// Data uses composite keys: "pageNumber:fieldId"
const fieldKey = `${pageNumber}:${fieldId}`;
// Example: "1:study_id" = "10.1161/STROKEAHA.116.014078"
```

### 4. Search Architecture

Search creates temporary highlights with two operational modes:

**Search Modes:**
1. **Exact Term Highlighting** - Highlights only the matching search term:
   ```typescript
   const rects = await calculateHighlightRects(pageProxy, {
     pageNumber: match.pageNumber,
     text: match.text,
     matchIndex: match.matchIndex || 0,
   });
   ```

2. **Full Context Highlighting** - Highlights entire text chunk containing the match:
   ```typescript
   const rects = await calculateHighlightRects(pageProxy, searchResult);
   ```

**Highlight Types:**
- User highlights: `kind: "user"`, color: green, persistent in localStorage
- Search highlights: `kind: "search"`, color: yellow, cleared on new search
- Navigation: Use `jumpToHighlightRects()` to navigate between results
- Search results tracked separately from highlights for navigation UI

### 5. Component Architecture

**Main App Structure:**
```
App (manages state, localStorage)
└── Root (Lector context provider)
    └── PDFViewerContent (uses Lector hooks)
        ├── Pages
        │   └── Page
        │       ├── CanvasLayer (PDF rendering)
        │       ├── TextLayer (text selection)
        │       └── ColoredHighlightLayer (highlights)
        ├── Thumbnails (optional sidebar)
        └── SelectionTooltip (highlight creation UI)
```

**Separation of Concerns:**
- `App.tsx`: State management, localStorage, project switching
- `PDFViewerContent`: PDF rendering, hooks, highlight management
- `components/`: Reusable UI (Modal, Toast, PDFUpload, etc.)
- `hooks/`: Custom hooks (usePDFManager, useDebounce, etc.)
- `utils/`: Pure functions (pdfStorage, schemaParser, validation, etc.)

## Component Reference

### Core Lector Components

All core components must be used within the `<Root>` context provider.

| Component | Purpose | Required | Notes |
|-----------|---------|----------|-------|
| `Root` | Document state container & context provider | Yes | All hooks must be inside this |
| `Pages` | Layout & virtualization container | Yes | Wraps all pages |
| `Page` | Individual page renderer | Yes | One per page |
| `CanvasLayer` | PDF visual rendering | Yes | Displays PDF content |
| `TextLayer` | Text selection & copying | Optional | Required for text interaction |
| `AnnotationLayer` | PDF links & annotations | Optional | Handles interactive PDFs & forms |
| `HighlightLayer` | Custom highlight overlays | Optional | Built-in highlighting support |
| `ColoredHighlightLayer` | Custom colored highlights | Optional | Project-specific implementation |

### Navigation Components

| Component | Purpose | Context Required | Usage |
|-----------|---------|------------------|-------|
| `Thumbnails` | Thumbnail container | Inside Root | Scrollable sidebar |
| `Thumbnail` | Individual thumbnail | Inside Thumbnails | Auto page sync on click |
| `ZoomIn` | Increase zoom level | Inside Root | Respects zoomOptions |
| `ZoomOut` | Decrease zoom level | Inside Root | Respects zoomOptions |
| `CurrentZoom` | Display current zoom | Inside Root | Shows percentage |

### Selection Components

| Component | Purpose | Context Required | Usage |
|-----------|---------|------------------|-------|
| `SelectionTooltip` | Contextual UI on text selection | Inside Root | Wraps custom selection UI |

### Root Component Props

```typescript
interface RootProps {
  source: string;                    // PDF URL or path (required)
  onLoad?: () => void;               // Callback when PDF loads
  onError?: (error: Error) => void;  // Error handler
  loader?: React.ReactNode;          // Custom loading component
  zoomOptions?: {
    minZoom?: number;  // Default: 0.1 (10%)
    maxZoom?: number;  // Default: 10 (1000%)
  };
  className?: string;                // CSS classes
  children: React.ReactNode;         // Child components
}
```

**Example:**

```typescript
<Root
  source="/sample.pdf"
  onLoad={() => console.log('PDF loaded')}
  onError={(err) => console.error('PDF error:', err)}
  loader={<div>Loading PDF...</div>}
  zoomOptions={{ minZoom: 0.5, maxZoom: 3 }}
  className="flex-1 flex flex-col"
>
  {/* Child components */}
</Root>
```

## Hook Reference

All hooks must be called inside components rendered within `<Root>`.

### usePdf()

Access PDF document store and state.

```typescript
const { setHighlights, highlights, numPages } = usePdf();
```

**Returns:**
- `numPages` - Total pages in PDF
- `highlights` - Current highlights array
- `setHighlights` - Update highlights function
- Other PDF state properties

### usePdfJump()

Navigate to specific pages or highlight locations.

```typescript
const { jumpToPage, jumpToHighlightRects } = usePdfJump();

// Jump to page
jumpToPage(5, { behavior: "auto" });

// Jump to highlight
jumpToHighlightRects([{
  pageNumber: 2,
  left: 100,
  top: 200,
  width: 150,
  height: 20
}]);
```

**Returns:**
- `jumpToPage(pageNum: number, options?: { behavior: "auto" })` - Navigate to page
- `jumpToHighlightRects(rects: HighlightRect[])` - Navigate to highlight

### useSearch()

Manage search state and results.

```typescript
const { searchResults, search } = useSearch();

// Perform search
search("term to find");
```

**Returns:**
- `searchResults` - Search results with exactMatches array
- `search(query: string)` - Perform search function
- `searchText` - Current search query
- `setSearchText` - Update search query

### useSelectionDimensions()

Track text selection state and dimensions.

```typescript
const selectionDimensions = useSelectionDimensions();

if (selectionDimensions && selectionDimensions.rects) {
  // User has selected text
  const { rects, text, pageNumber } = selectionDimensions;
}
```

**Returns:**
- `rects` - Array of selection rectangles
- `text` - Selected text content
- `pageNumber` - Page number of selection
- `collapsed` - Boolean indicating if selection is empty

### usePDFPageNumber()

Get current page number being viewed.

```typescript
const currentPage = usePDFPageNumber();
```

**Returns:** Current page number (1-indexed)

## Feature Implementation Guides

### Highlighting

**Highlight Data Format (pixel-based coordinates):**

```typescript
interface HighlightRect {
  pageNumber: number;
  left: number;    // X coordinate in pixels
  top: number;     // Y coordinate in pixels
  width: number;   // Width in pixels
  height: number;  // Height in pixels
}
```

**Basic Implementation:**

```typescript
<HighlightLayer className="bg-yellow-200/70" />
```

**Best Practices:**
- ✅ Validate selections aren't collapsed before creating highlights
- ✅ Keep highlights within document bounds
- ✅ Include visual feedback for selections (hover states)
- ✅ Add keyboard navigation support for accessibility
- ✅ Persist user highlights separately from search highlights

### Search

**Two Search Modes:**

1. **Exact Term Highlighting** (recommended for search):

```typescript
// Highlights only the exact matching term
const rects = await calculateHighlightRects(pageProxy, {
  pageNumber: match.pageNumber,
  text: match.text,
  matchIndex: match.matchIndex || 0,
});
```

2. **Full Context Highlighting**:

```typescript
// Highlights entire text chunk containing the match
const rects = await calculateHighlightRects(pageProxy, searchResult);
```

**Navigation Between Results:**

```typescript
const { jumpToHighlightRects } = usePdfJump();

// Navigate to specific search result
jumpToHighlightRects(searchHighlights);
```

**Best Practices:**
- ✅ Debounce search input (500ms recommended)
- ✅ Handle empty states gracefully
- ✅ Include page navigation controls (prev/next)
- ✅ Provide result count feedback
- ✅ Clear search highlights on new search
- ✅ Optimize for large documents (pagination)

**Example Implementation:**

```typescript
const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500);
const { search, searchResults } = useSearch();

useEffect(() => {
  if (debouncedSearch) {
    search(debouncedSearch);
  }
}, [debouncedSearch, search]);
```

### Zoom Controls

**Configuration:**

```typescript
<Root
  source={pdf}
  zoomOptions={{
    minZoom: 0.5,    // 50% minimum zoom
    maxZoom: 10      // 1000% maximum zoom
  }}
>
  <div className="zoom-controls">
    <ZoomOut />
    <CurrentZoom />
    <ZoomIn />
  </div>
</Root>
```

**Defaults:**
- `minZoom`: 0.1 (10%)
- `maxZoom`: 10 (1000%)

**Best Practices:**
- ✅ Set reasonable zoom limits for your use case
- ✅ Provide visual feedback for current zoom level
- ✅ Consider keyboard shortcuts (Ctrl+Plus/Minus)
- ✅ Remember user's zoom preference

### Thumbnails

**Layout Pattern:**

```typescript
const [showThumbnails, setShowThumbnails] = useState(true);

<div className={`grid ${showThumbnails ? 'grid-cols-[200px,1fr]' : 'grid-cols-[0,1fr]'} transition-all`}>
  <div className="overflow-auto bg-gray-50">
    <Thumbnails className="p-2 space-y-2">
      <Thumbnail className="border rounded hover:border-blue-500 hover:shadow-lg cursor-pointer" />
    </Thumbnails>
  </div>

  <Pages>
    {/* Main PDF viewer */}
  </Pages>
</div>
```

**Best Practices:**
- ✅ Implement loading indicators for thumbnail generation
- ✅ Add CSS transitions for smooth show/hide
- ✅ Include hover states for user feedback
- ✅ Automatic page synchronization on thumbnail click
- ✅ Scrollable container with proper overflow handling

### Page Navigation

**Custom Navigation Implementation:**

```typescript
const { jumpToPage } = usePdfJump();
const { numPages } = usePdf();
const currentPage = usePDFPageNumber();

const handleJump = (page: number) => {
  if (page >= 1 && page <= numPages) {
    jumpToPage(page, { behavior: "auto" });
  }
};

// Navigation UI
<div className="page-nav">
  <button
    onClick={() => handleJump(currentPage - 1)}
    disabled={currentPage <= 1}
  >
    Previous
  </button>

  <input
    type="number"
    min={1}
    max={numPages}
    value={currentPage}
    onChange={(e) => handleJump(parseInt(e.target.value))}
    onKeyDown={(e) => e.key === 'Enter' && handleJump(parseInt(e.target.value))}
  />

  <span>/ {numPages}</span>

  <button
    onClick={() => handleJump(currentPage + 1)}
    disabled={currentPage >= numPages}
  >
    Next
  </button>
</div>
```

**Best Practices:**
- ✅ Boundary checking for navigation buttons
- ✅ Keyboard support (Enter key for input)
- ✅ Disabled states at document boundaries
- ✅ Aria-labels for accessibility
- ✅ Visual feedback for current page

### PDF Forms

**Form Handling with AnnotationLayer:**

```typescript
const [formData, setFormData] = useState<Record<string, any>>({});

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData);

  // Filter empty values
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== "")
  );

  setFormData(cleanData);
};

<Root source={pdf}>
  <form onSubmit={handleSubmit}>
    <Pages>
      <Page>
        <CanvasLayer />
        <TextLayer />
        <AnnotationLayer />  {/* Handles PDF form fields */}
      </Page>
    </Pages>
    <button type="submit">Save Form Data</button>
  </form>
</Root>
```

**Best Practices:**
- ✅ Proper TypeScript typing for form events
- ✅ Semantic HTML structure
- ✅ Loading states during PDF rendering
- ✅ Error handling throughout submission process
- ✅ Filter empty form values before storage

### Dark Mode

**Implementation (CSS Filter Approach):**

```typescript
// Apply to Pages component for dark mode
<Pages className="dark:invert-[94%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]">
  <Page>
    <CanvasLayer />
    <TextLayer />
  </Page>
</Pages>
```

**⚠️ Known Limitations:**

1. **Color fidelity** - Colors may not be perfectly accurate across all PDF types
2. **Complex designs** - PDFs with intricate color schemes may render suboptimally
3. **Performance** - CSS filters add overhead on larger documents

**Note:** PDF.js lacks native dark mode support. Lector uses CSS filters as a compatibility solution. Consider disabling dark mode for PDFs with critical color information (charts, diagrams).

## PDF.js Configuration

**Required in App.tsx:**
```typescript
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
```

This must be set before any PDF operations.

## Type System

All types centralized in `src/types/index.ts`:
- `LabeledHighlight` - Highlight with metadata
- `FieldTemplate` - Form field definition
- `PageFormData` - Form values (Record<string, string>)
- `PDFMetadata` - PDF file metadata
- `ProjectData` - Complete project export
- Type guards: `isLabeledHighlight()`, `isFieldTemplate()`

Import pattern:
```typescript
import { LabeledHighlight, FieldTemplate, PageFormData } from "@/types";
```

## React Patterns

**Always use:**
- Functional components (no class components)
- TypeScript interfaces for props
- Proper dependency arrays in `useEffect`/`useCallback`/`useMemo`
- Toast notifications (not `alert()`/`confirm()`)
- Error handling with try/catch

**Component structure:**
```typescript
// Imports → Types → Component → Export
import { useState } from 'react';
import { SomeType } from '@/types';

interface ComponentProps {
  title: string;
  onClose: () => void;
}

function Component({ title, onClose }: ComponentProps) {
  // state
  // effects
  // handlers
  // render
}

export { Component };
```

## Testing Strategy

**Unit Tests (Vitest):**
- Test all utility functions in `src/utils/`
- Test custom hooks
- Located in `src/__tests__/`

**E2E Tests (Playwright):**
- Test critical user flows
- PDF upload, search, highlight creation, export
- Configuration in `playwright.config.ts`

## File Organization

```
src/
├── App.tsx                 # Main application (state + localStorage)
├── main.tsx                # Entry point
├── components/             # UI components
│   ├── index.ts           # Barrel export
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── PDFUpload.tsx
│   ├── PDFList.tsx
│   ├── TemplateManager.tsx
│   └── SchemaForm.tsx
├── hooks/                  # Custom React hooks
│   ├── index.ts           # Barrel export
│   ├── usePDFManager.ts   # PDF CRUD operations
│   ├── useDebounce.ts     # Debounced values
│   └── useDarkMode.ts     # Dark mode toggle
├── utils/                  # Pure functions
│   ├── index.ts           # Barrel export
│   ├── pdfStorage.ts      # IndexedDB operations
│   ├── schemaParser.ts    # JSON schema parsing
│   ├── importExport.ts    # JSON/CSV export
│   └── validation.ts      # Field validation
└── types/
    └── index.ts           # Central type definitions
```

## Schema-Based Forms

JSON schema files (optional) enable structured data extraction:
- Schema location: `public/schema.json`
- Parser: `src/utils/schemaParser.ts`
- Component: `src/components/SchemaForm.tsx`
- Data stored with path keys: `"I_StudyMetadata.studyID"`

## Known Issues & Gotchas

1. **Zoom controls must be inside Root** - Recent bug fix, ensure all Lector components/hooks are inside Root context
2. **Blob URL cleanup** - Always revoke blob URLs in cleanup (`useEffect` return or `useRef`)
3. **Search debouncing** - Implemented (500ms) to prevent excessive re-renders on large PDFs
4. **LocalStorage limits** - ~5-10MB per domain, use IndexedDB for PDFs
5. **Multiple App backups** - Many `App-*.tsx` backup files exist, `App.tsx` is the active version

## Performance Optimizations

```typescript
// Debounce search input
const debouncedSearch = useDebounce(searchTerm, 500);

// Memoize expensive computations
const currentPageTemplate = useMemo(
  () => templates[currentPage] || [],
  [templates, currentPage]
);

// Cleanup async operations
useEffect(() => {
  let cancelled = false;
  async function fetchData() {
    const result = await fetch(...);
    if (!cancelled) setState(result);
  }
  return () => { cancelled = true; };
}, []);
```

## Accessibility

- All interactive elements have `aria-label` attributes
- Keyboard navigation supported (Enter for page jump, Escape for modals)
- Dark mode support via CSS variables
- Focus management in modals

## Troubleshooting

### Common Issues

#### 1. "Hook called outside Root context"

**Error:** `Error: usePdfJump must be called within a Root component`

**Cause:** Lector hooks called in components not rendered inside `<Root>`.

**Solution:**
```typescript
// ❌ Wrong
function App() {
  const { jumpToPage } = usePdfJump(); // ERROR!
  return <Root source={pdf}>...</Root>
}

// ✅ Correct
function App() {
  return (
    <Root source={pdf}>
      <InnerComponent />
    </Root>
  );
}

function InnerComponent() {
  const { jumpToPage } = usePdfJump(); // ✅ Works!
  return <Pages>...</Pages>
}
```

#### 2. PDF not rendering

**Symptoms:** Blank screen, console errors about worker

**Checklist:**
- ✅ Verify PDF.js worker is configured (see [PDF.js Configuration](#pdfjs-configuration))
- ✅ Ensure `pdfjs-dist/web/pdf_viewer.css` is imported in `main.tsx`
- ✅ Check browser console for worker loading errors
- ✅ Verify PDF source path is correct and accessible
- ✅ Check CORS if loading PDF from external URL

**Solution:**
```typescript
// In App.tsx, BEFORE any Lector components
import { GlobalWorkerOptions } from "pdfjs-dist";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
```

#### 3. Selection not working

**Symptoms:** Can't select text, no selection tooltip appears

**Checklist:**
- ✅ Ensure `<TextLayer />` is included in your Page
- ✅ Verify TextLayer is not covered by other elements (z-index)
- ✅ Check that `useSelectionDimensions()` is called inside Root
- ✅ Verify CSS for TextLayer isn't `pointer-events: none`

**Solution:**
```typescript
<Page>
  <CanvasLayer />
  <TextLayer />  {/* Required for text selection */}
  <ColoredHighlightLayer highlights={highlights} />
</Page>
```

#### 4. Zoom controls not responding

**Symptoms:** Zoom buttons don't work, CurrentZoom shows wrong value

**Checklist:**
- ✅ Confirm zoom components are inside `<Root>`
- ✅ Check `zoomOptions` prop on Root component
- ✅ Verify no CSS overrides affecting zoom behavior
- ✅ Check browser console for errors

**Solution:**
```typescript
<Root source={pdf} zoomOptions={{ minZoom: 0.5, maxZoom: 3 }}>
  <div className="zoom-controls">
    <ZoomOut />
    <CurrentZoom />
    <ZoomIn />
  </div>
  <Pages>...</Pages>
</Root>
```

#### 5. Dark mode looks wrong

**Symptoms:** Colors inverted incorrectly, unreadable content

**Cause:** CSS filter approach has limitations with certain PDF types

**Solutions:**
- Adjust filter values for your specific PDFs:
  ```typescript
  // Fine-tune these values
  <Pages className="dark:invert-[94%] dark:hue-rotate-180
    dark:brightness-[80%] dark:contrast-[228%]">
  ```
- Consider disabling dark mode for PDFs with critical color information
- Use conditional dark mode based on PDF type

#### 6. Search highlights not appearing

**Symptoms:** Search completes but no highlights visible

**Checklist:**
- ✅ Verify `calculateHighlightRects()` is being called correctly
- ✅ Check that highlights are being added to state
- ✅ Ensure ColoredHighlightLayer is rendering highlights
- ✅ Verify highlight colors have sufficient opacity
- ✅ Check console for async errors in highlight calculation

**Solution:**
```typescript
// Ensure proper highlight state management
const [highlights, setHighlights] = useState<LabeledHighlight[]>([]);

// Update highlights with search results
useEffect(() => {
  if (searchResults?.exactMatches) {
    const searchHighlights = /* ... convert to highlights ... */;
    setHighlights(prev => {
      const userHighlights = prev.filter(h => h.kind !== "search");
      return [...userHighlights, ...searchHighlights];
    });
  }
}, [searchResults]);
```

#### 7. IndexedDB quota exceeded

**Symptoms:** "QuotaExceededError" when uploading PDFs

**Cause:** Browser storage limits reached (~50MB-100MB typical)

**Solutions:**
- Implement PDF cleanup/deletion feature
- Warn users before large uploads
- Check storage usage:
  ```typescript
  import { getStorageSize, formatFileSize } from "@/utils/pdfStorage";

  const size = await getStorageSize();
  console.log(`Storage used: ${formatFileSize(size)}`);
  ```

### Verification Checklist

Before starting development or when issues arise:

**Dependencies:**
- [ ] Node.js 16.0+ installed
- [ ] React 16.8+ in `package.json`
- [ ] Both `@anaralabs/lector` AND `pdfjs-dist` installed
- [ ] CSS file imported: `import "pdfjs-dist/web/pdf_viewer.css"`

**Configuration:**
- [ ] PDF.js worker configured in `App.tsx`
- [ ] Worker configuration runs before any Lector components
- [ ] Vite config has `@/` path alias configured

**Component Structure:**
- [ ] All hooks called inside components rendered within `<Root>`
- [ ] Required layers included: `CanvasLayer` at minimum
- [ ] `TextLayer` included if selection needed
- [ ] `AnnotationLayer` included if PDF forms needed

**Data Persistence:**
- [ ] LocalStorage keys follow `proj:{project}:{type}` pattern
- [ ] IndexedDB initialized for PDF storage
- [ ] Proper cleanup of blob URLs

**Testing:**
- [ ] Unit tests passing for utilities
- [ ] E2E tests covering critical flows
- [ ] Manual testing in target browsers

### Getting Help

If issues persist:

1. **Check official Lector docs:** https://lector-weld.vercel.app/docs
2. **Review PDF.js docs:** https://mozilla.github.io/pdf.js/
3. **Check browser console** for specific error messages
4. **Verify versions** match requirements (React 16.8+, Node 16+)
5. **Search GitHub issues:** https://github.com/anaralabs/lector/issues

## Resources

### Official Documentation

- **Lector Documentation:** https://lector-weld.vercel.app/docs
  - [Installation](https://lector-weld.vercel.app/docs/installation)
  - [Basic Usage](https://lector-weld.vercel.app/docs/basic-usage)
  - [Search](https://lector-weld.vercel.app/docs/code/search)
  - [Highlighting](https://lector-weld.vercel.app/docs/code/highlight)
  - [Zoom Controls](https://lector-weld.vercel.app/docs/code/zoom-control)
  - [Thumbnails](https://lector-weld.vercel.app/docs/code/thumbnails)
  - [PDF Forms](https://lector-weld.vercel.app/docs/code/pdf-form)
  - [Dark Mode](https://lector-weld.vercel.app/docs/dark-mode)

- **Lector GitHub:** https://github.com/anaralabs/lector
- **PDF.js Documentation:** https://mozilla.github.io/pdf.js/
- **React Documentation:** https://react.dev/

### Project Configuration

- **Vite Path Aliases:** `@/` resolves to `src/`
- **TypeScript:** Strict mode enabled
- **Tailwind CSS:** v3.4 with custom configuration
