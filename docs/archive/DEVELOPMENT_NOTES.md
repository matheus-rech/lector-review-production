# Development Notes - Lector Review

## Implementation Overview

This document explains the technical decisions, challenges, and solutions implemented in the Lector Review application.

## Architecture

### Component Structure

The application follows a single-component architecture with the main `App.tsx` containing all logic. This was chosen for simplicity but could be refactored into smaller components:

```
App (Main Container)
├── Left Sidebar (Project Management & Search)
├── PDF Viewer (Root → PDFViewerContent → Pages → Page → Layers)
└── Right Sidebar (Navigation & Data Extraction)
```

### State Management

Uses React's built-in `useState` and `useEffect` hooks with localStorage for persistence:

- **Projects**: Array of project names
- **Current Project**: Active project identifier
- **Highlights**: Array of labeled text selections
- **Page Form**: Key-value pairs for extracted data
- **Templates**: Field definitions per page
- **PDF Form Data**: Embedded PDF form values

### Data Flow

```
User Action → State Update → useEffect → localStorage
                ↓
           Re-render UI
```

## Key Technical Decisions

### 1. Lector Library Integration

**Challenge**: The original specification used Lector hooks (`usePdfJump`, `useSearch`, `useSelectionDimensions`) at the top level of the component, but these hooks must be called inside a component wrapped by the `Root` component.

**Solution**: Created a simplified implementation that:
- Removed direct hook usage at the top level
- Created a `PDFViewerContent` component inside `Root` context
- Implemented basic functionality without full hook integration
- Prepared the structure for future hook integration

**Future Enhancement**: Properly integrate hooks by:
```typescript
function PDFViewerContent() {
  const { jumpToPage, currentPage, totalPages } = usePdfJump();
  const { searchTerm, setSearchTerm, results } = useSearch();
  const { selectionRect } = useSelectionDimensions();
  
  // Use these hooks for full functionality
}
```

### 2. PDF.js Worker Configuration

**Challenge**: PDF.js requires a worker file to be properly configured.

**Solution**: Used Vite's `import.meta.url` to dynamically resolve the worker path:

```typescript
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
```

This ensures the worker is correctly bundled and referenced in both development and production.

### 3. LocalStorage Namespacing

**Challenge**: Multiple projects need isolated data storage.

**Solution**: Implemented a namespacing pattern:

```typescript
const key = (project: string, name: string) => `proj:${project}:${name}`;
```

This creates keys like:
- `proj:default:highlights`
- `proj:study-2024:pageForm`
- `proj:meta-analysis:templates`

### 4. Per-Page Field Templates

**Challenge**: Different pages need different extraction fields.

**Solution**: Used a nested object structure:

```typescript
type Templates = Record<number, PageTemplateField[]>;

// Example:
{
  1: [{ id: "study_id", label: "Study ID" }],
  2: [{ id: "n_total", label: "Total N" }],
  3: [{ id: "effect", label: "Effect" }]
}
```

Data is stored with composite keys: `${pageNumber}:${fieldId}`

### 5. Highlight Data Structure

**Challenge**: Need to store both user highlights and search results.

**Solution**: Unified highlight structure with a `kind` discriminator:

```typescript
type LabeledHighlight = {
  id: string;
  label: string;
  kind: "user" | "search";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
```

This allows combining and rendering both types of highlights uniformly.

## Implementation Challenges

### 1. Vite Configuration for Lector

**Issue**: Initial server configuration didn't expose the development server properly.

**Solution**: Updated `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: [".manusvm.computer"],
  },
});
```

### 2. React 19 Compatibility

**Issue**: Peer dependency warnings with React 18.

**Solution**: Upgraded to React 19 RC:

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

### 3. Sample PDF Generation

**Issue**: Need a test PDF with multiple pages.

**Solution**: Used ReportLab (Python) to generate a sample PDF:

```python
from reportlab.pdfgen import canvas
pdf = canvas.Canvas("sample.pdf")
# ... add pages and content
pdf.save()
```

## Code Organization

### File Structure

```
src/
├── App.tsx           # Main application (800+ lines)
├── main.tsx          # Entry point
└── index.css         # Global styles with Tailwind
```

### Potential Refactoring

For better maintainability, consider splitting into:

```
src/
├── components/
│   ├── ProjectSidebar.tsx
│   ├── PDFViewer.tsx
│   ├── DataSidebar.tsx
│   ├── HighlightList.tsx
│   └── FieldTemplate.tsx
├── hooks/
│   ├── useProject.ts
│   ├── useHighlights.ts
│   └── useFieldTemplates.ts
├── types/
│   └── index.ts
├── utils/
│   ├── storage.ts
│   └── export.ts
└── App.tsx
```

## Performance Considerations

### Current Performance

- **Good**: Client-side only, no server requests
- **Good**: LocalStorage is fast for small datasets
- **Concern**: Large PDFs may cause memory issues
- **Concern**: Many highlights could slow rendering

### Optimization Opportunities

1. **Virtualization**: Use react-window for large highlight lists
2. **Memoization**: Memoize expensive computations
3. **Lazy Loading**: Load PDF pages on demand
4. **Debouncing**: Debounce search input
5. **Code Splitting**: Split large components

Example optimization:

```typescript
const currentPageTemplate = useMemo(
  () => templates[currentPage] || [],
  [templates, currentPage]
);
```

## Testing Strategy

### Recommended Tests

1. **Unit Tests**
   - Storage utility functions
   - Export functions (JSON/CSV)
   - Data transformation logic

2. **Integration Tests**
   - Project creation/deletion
   - Highlight management
   - Field template CRUD
   - Data persistence

3. **E2E Tests**
   - Full user workflows
   - PDF loading
   - Data extraction and export

### Testing Setup

```bash
pnpm add -D vitest @testing-library/react @testing-library/user-event
```

Example test:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders project selector', () => {
    render(<App />);
    expect(screen.getByLabelText('Project')).toBeInTheDocument();
  });
});
```

## Security Considerations

### Current Security Posture

- **Good**: No server-side code, no API keys
- **Good**: No external data transmission
- **Good**: LocalStorage is origin-isolated
- **Concern**: XSS if loading untrusted PDFs
- **Concern**: No data encryption at rest

### Security Enhancements

1. **Content Security Policy**: Add CSP headers
2. **PDF Sanitization**: Validate PDF files before loading
3. **Input Validation**: Sanitize user inputs
4. **Data Encryption**: Encrypt sensitive data in localStorage

## Browser Compatibility

### Tested Browsers

- ✅ Chrome 120+
- ✅ Firefox 120+
- ✅ Safari 17+
- ✅ Edge 120+

### Known Issues

- **Safari < 16**: May have PDF.js rendering issues
- **IE11**: Not supported (requires ES6+)
- **Mobile**: Touch interactions need improvement

## Accessibility

### Current State

- ❌ No ARIA labels
- ❌ No keyboard navigation
- ❌ No screen reader support
- ❌ No focus management

### Recommended Improvements

1. Add ARIA labels to all interactive elements
2. Implement keyboard shortcuts
3. Add focus indicators
4. Test with screen readers
5. Ensure color contrast meets WCAG AA

Example:

```typescript
<button
  onClick={addProject}
  aria-label="Add new project"
  className="px-2 border rounded focus:ring-2 focus:ring-blue-500"
>
  +
</button>
```

## Future Enhancements

### High Priority

1. **Full Lector Hook Integration**: Implement all hooks properly
2. **Text Selection Highlighting**: Enable visual highlighting on PDF
3. **Search Results Highlighting**: Auto-highlight search matches
4. **PDF Upload**: Allow file upload instead of URL only
5. **Undo/Redo**: Implement action history

### Medium Priority

1. **Collaborative Features**: Multi-user support
2. **Cloud Sync**: Optional cloud backup
3. **Advanced Export**: Excel, Word, LaTeX formats
4. **Batch Processing**: Process multiple PDFs
5. **AI Integration**: Auto-extract common fields

### Low Priority

1. **Themes**: Dark mode, custom themes
2. **Plugins**: Extensibility system
3. **Mobile App**: React Native version
4. **Offline Mode**: Service worker
5. **Print Support**: Print extracted data

## Lessons Learned

### What Went Well

1. **Lector Library**: Excellent PDF rendering
2. **Tailwind CSS**: Rapid UI development
3. **TypeScript**: Caught many bugs early
4. **LocalStorage**: Simple and effective for this use case

### What Could Be Improved

1. **Component Organization**: Should have split earlier
2. **Hook Integration**: Needed better understanding of Lector's context requirements
3. **Testing**: Should have written tests from the start
4. **Documentation**: Should document as we code

### Key Takeaways

1. Always check library documentation for context requirements
2. Start with a simpler implementation and iterate
3. TypeScript types help immensely with complex state
4. LocalStorage has limits (~5-10MB), plan accordingly

## Contributing Guidelines

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages

### Pull Request Process

1. Create a feature branch
2. Write tests for new features
3. Update documentation
4. Ensure build passes
5. Request review

### Commit Message Format

```
type(scope): subject

body

footer
```

Example:
```
feat(highlights): add color picker for highlights

- Added color selection UI
- Updated highlight data structure
- Persisted color in localStorage

Closes #123
```

## Resources

### Documentation

- [Lector Documentation](https://lector-weld.vercel.app/docs)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

### Related Projects

- [react-pdf](https://github.com/wojtekmaj/react-pdf)
- [react-pdf-viewer](https://react-pdf-viewer.dev/)
- [pdfreader](https://github.com/adrienjoly/npm-pdfreader)

## Contact

For questions or contributions, please open an issue or pull request on the project repository.
