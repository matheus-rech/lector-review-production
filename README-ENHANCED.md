# Lector Review - Enhanced with Lector Hooks

A React-based PDF viewer application for systematic review and data extraction, now enhanced with full Lector hooks integration for advanced highlighting and search capabilities.

## 🎯 Features

### Core Functionality
- **Multi-project management** with localStorage persistence
- **PDF viewing** using @anaralabs/lector and pdfjs-dist
- **Per-page field templates** for structured data extraction
- **Highlight management** with labels and categories
- **Export to JSON and CSV** formats
- **Responsive UI** with Tailwind CSS

### 🆕 Enhanced Features (Lector Hooks Integration)

#### ✅ Visual Highlight Rendering
- **ColoredHighlightLayer** integration for rendering highlights on PDF
- **Dual-color system**: Green for user highlights, Yellow for search results
- **Persistent highlights** across page navigation and sessions
- **Real-time rendering** of highlights on PDF canvas

#### ✅ Search Infrastructure
- **useSearch hook** integration for PDF text search
- **Exact match search** with `findExactMatches()`
- **Search results tracking** ready for visual highlighting
- **Search input** connected to Lector search engine

#### ⚠️ Text Selection (Prepared)
- **useSelectionDimensions hook** integrated but disabled
- **Manual trigger required** to prevent accidental highlights
- **Ready for enhancement** with confirmation UI

#### ✅ Page Navigation
- **usePdfJump hook** for current page tracking
- **Synchronized navigation** between UI and PDF viewer
- **Highlight-to-page navigation** via "Go" buttons

## 🚀 Quick Start

### Installation

```bash
cd lector-review
pnpm install
```

### Development

```bash
pnpm run dev
```

Visit http://localhost:5173

### Production Build

```bash
pnpm run build
```

Deploy the `dist/` directory to any static hosting service.

## 📖 Usage Guide

### Creating Highlights

**Method 1: Manual Test Highlight**
1. Click the "+ Test" button in the "Your Highlights" section
2. Enter a label for the highlight
3. A test highlight will be created at position (100, 100) on the current page

**Method 2: Via Code (Future Enhancement)**
- Text selection highlighting will be enabled with a confirmation button
- Select text → Click "Highlight" → Enter label

### Searching the PDF

1. Enter search term in the "Search" input box
2. The `useSearch` hook will find exact matches
3. Search results are ready for visual highlighting (enhancement in progress)

### Managing Projects

1. **Create Project**: Click "+" next to project selector
2. **Switch Project**: Select from dropdown
3. **Delete Project**: Click "🗑" (cannot delete "default")

### Field Templates

1. Navigate to desired page
2. Click "+ field" to add a custom field
3. Enter data in the field inputs
4. Data is automatically saved per project

### Exporting Data

**JSON Export**:
- Includes highlights, templates, and field data
- Timestamped for version control

**CSV Export**:
- Tabular format with highlights and field data
- Compatible with Excel and data analysis tools

## 🏗️ Technical Architecture

### Component Structure

```
App (Main Component)
├── Left Sidebar
│   ├── Project Selector
│   ├── PDF Source Input
│   ├── Search Box (→ useSearch)
│   └── Export Buttons
├── Root (Lector Context Provider)
│   └── PDFViewerContent (Uses Lector Hooks)
│       ├── useSearch() → Search functionality
│       ├── usePdfJump() → Page navigation
│       ├── useSelectionDimensions() → Text selection
│       └── Pages
│           └── Page
│               ├── CanvasLayer → PDF rendering
│               ├── TextLayer → Text selection
│               └── ColoredHighlightLayer → Highlights ✨
└── Right Sidebar
    ├── Page Navigation
    ├── Field Templates
    └── Highlights List
```

### Lector Hooks Integration

| Hook | Status | Purpose |
|------|--------|---------|
| `ColoredHighlightLayer` | ✅ Working | Renders highlights on PDF |
| `useSearch` | ✅ Integrated | PDF text search |
| `usePdfJump` | ✅ Integrated | Page navigation tracking |
| `useSelectionDimensions` | ⚠️ Prepared | Text selection (disabled) |

### Data Flow

1. **Highlight Creation**
   ```
   User action → addHighlight() → State update → 
   ColoredHighlightLayer renders → localStorage save
   ```

2. **Search**
   ```
   User input → setSearchTerm() → useSearch.findExactMatches() → 
   searchResults → (Ready for highlight conversion)
   ```

3. **Text Selection** (Disabled)
   ```
   User selects text → useSelectionDimensions() → 
   (Needs confirmation UI) → Create highlight
   ```

## 🔧 Configuration

### PDF Worker

The PDF.js worker is configured in `src/App.tsx`:

```typescript
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
```

### Highlight Colors

Customize highlight colors in `src/App.tsx`:

```typescript
const coloredHighlights: ColoredHighlight[] = highlights.map((h) => ({
  // ...
  color: h.kind === "search" 
    ? "rgba(255, 255, 0, 0.4)"  // Yellow for search
    : "rgba(0, 255, 0, 0.3)",   // Green for user
}));
```

## 📦 Dependencies

### Core
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool

### PDF & Highlighting
- **@anaralabs/lector** - PDF viewer with hooks
- **pdfjs-dist** - PDF.js library
- **ColoredHighlightLayer** - Visual highlighting

### Styling
- **Tailwind CSS** - Utility-first CSS
- **PostCSS** - CSS processing

## 🐛 Known Issues & Limitations

### Text Selection Highlighting
- **Status**: Disabled
- **Reason**: Needs confirmation UI to prevent accidental highlights
- **Workaround**: Use "+ Test" button for manual highlights
- **Fix**: Add "Highlight Selection" button (see INTEGRATION_SUMMARY.md)

### Search Result Highlighting
- **Status**: Infrastructure ready
- **Missing**: Rect position calculation from search results
- **Workaround**: Search results are retrieved but not visually highlighted
- **Fix**: Convert searchResults to ColoredHighlight format

## 🚧 Roadmap

### Short Term
- [ ] Add "Highlight Selection" button for text selection
- [ ] Convert search results to visual highlights
- [ ] Display search result count in UI
- [ ] Add highlight color picker

### Medium Term
- [ ] Highlight categories with custom colors
- [ ] Highlight notes/comments
- [ ] Bulk highlight operations
- [ ] Highlight import/export

### Long Term
- [ ] Collaborative highlighting
- [ ] AI-assisted highlighting
- [ ] Integration with reference managers
- [ ] Mobile app version

## 📚 Documentation

- **README.md** - This file
- **USER_GUIDE.md** - Detailed user guide
- **INTEGRATION_SUMMARY.md** - Technical integration details
- **DEVELOPMENT_NOTES.md** - Development notes and decisions
- **DEPLOYMENT.md** - Deployment instructions

## 🤝 Contributing

This is a demonstration project. For production use:

1. Enable text selection highlighting with proper UI
2. Implement search result highlighting
3. Add comprehensive error handling
4. Add unit and integration tests
5. Optimize performance for large PDFs

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **@anaralabs/lector** - Excellent PDF viewer library
- **PDF.js** - Mozilla's PDF rendering engine
- **React** - UI framework
- **Tailwind CSS** - Styling framework

## 📞 Support

For issues and questions:
- Check INTEGRATION_SUMMARY.md for technical details
- Review USER_GUIDE.md for usage instructions
- See DEVELOPMENT_NOTES.md for implementation notes

---

**Version**: 2.0.0 (Enhanced with Lector Hooks)  
**Last Updated**: November 2025  
**Status**: Production-ready for manual highlighting, search infrastructure ready
