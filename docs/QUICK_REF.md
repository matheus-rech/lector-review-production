# Quick Reference - Lector Review

One-page cheat sheet for common tasks and patterns.

---

## 📁 Key File Locations

```
.cursorrules                        # AI instructions
src/App.tsx                         # Main application
src/types/index.ts                  # All types
src/components/                     # UI components
src/hooks/                          # Custom hooks
src/utils/                          # Utilities
docs/ARCHITECTURE.md                # System design
docs/PATTERNS.md                    # Code patterns
docs/INTEGRATION_GUIDE.md           # Integration steps
```

---

## 🚀 Common Commands

```bash
# Development
pnpm dev                # Start dev server (localhost:5173)
pnpm build              # Production build
pnpm preview            # Preview production build

# Testing
pnpm test               # Run unit tests
pnpm test:watch         # Tests in watch mode
pnpm test:coverage      # Coverage report
pnpm test:e2e           # E2E tests
pnpm type-check         # TypeScript validation

# Code Quality
pnpm lint               # ESLint
pnpm format             # Prettier formatting
```

---

## 📦 Import Aliases

```typescript
import { Modal, Toast } from '@/components';
import { useDarkMode, useDebounce } from '@/hooks';
import { exportToJSON, validateField } from '@/utils';
import type { LabeledHighlight } from '@/types';
```

---

## 🎨 Component Pattern

```typescript
interface Props {
  title: string;
  onAction: () => void;
}

export function Component({ title, onAction }: Props) {
  const [state, setState] = useState('');

  useEffect(() => {
    // Effect
  }, [/* deps */]);

  const handleClick = () => {
    try {
      onAction();
      showToast('Success!', 'success');
    } catch (error) {
      showToast('Error', 'error');
    }
  };

  return <div>{title}</div>;
}
```

---

## 🪝 Hook Pattern

```typescript
export function useCustom<T>(initial: T) {
  const [value, setValue] = useState<T>(initial);

  const update = useCallback((newValue: T) => {
    setValue(newValue);
  }, []);

  return { value, update };
}
```

---

## 💾 Storage Pattern

```typescript
// Namespaced key
const key = (project: string, type: string) =>
  `proj:${project}:${type}`;

// Save
localStorage.setItem(key('default', 'data'), JSON.stringify(data));

// Load
const data = JSON.parse(localStorage.getItem(key('default', 'data')) || '{}');

// Composite key for fields
const fieldKey = `${page}:${fieldId}`;
```

---

## 🎯 Lector Hooks (MUST be inside Root)

```typescript
// ✅ CORRECT
<Root documentSource={pdf}>
  <PDFContent />  {/* Hooks work here */}
</Root>

function PDFContent() {
  const { jumpToPage, currentPageNumber } = usePdfJump();
  const { searchResults, findExactMatches } = useSearch();
  const selectionDimensions = useSelectionDimensions();
}

// ❌ WRONG - Hooks called outside Root
function App() {
  const { jumpToPage } = usePdfJump(); // ERROR!
  return <Root>...</Root>;
}
```

---

## 🎨 Tailwind Patterns

```typescript
// Button
className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700
           focus:ring-2 focus:ring-blue-500"

// Input
className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600
           rounded focus:ring-2 focus:ring-blue-500
           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"

// Card
className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
```

---

## 🧪 Testing Patterns

```typescript
// Unit Test
describe('function', () => {
  it('should work', () => {
    expect(function(input)).toBe(expected);
  });
});

// Component Test
test('renders', () => {
  render(<Component />);
  expect(screen.getByText('text')).toBeInTheDocument();
});

// E2E Test
test('workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  await page.click('[aria-label="Button"]');
  await expect(page.locator('.result')).toBeVisible();
});
```

---

## 🔧 Debouncing

```typescript
import { useDebounce } from '@/hooks';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
  if (debouncedSearch) {
    performSearch(debouncedSearch);
  }
}, [debouncedSearch]);
```

---

## 💬 Toast Notifications

```typescript
showToast("Success!", "success");
showToast("Failed", "error");
showToast("Info", "info");
showToast("Warning", "warning");
```

---

## 🔄 Undo/Redo

```typescript
const { state, setState, undo, redo, canUndo, canRedo } =
  useUndoRedo(initialState);

<button onClick={undo} disabled={!canUndo}>Undo</button>
<button onClick={redo} disabled={!canRedo}>Redo</button>
```

---

## 🌙 Dark Mode

```typescript
const { isDark, toggleDark } = useDarkMode();

<button onClick={toggleDark}>
  {isDark ? '☀️' : '🌙'}
</button>

// CSS
className="bg-white dark:bg-gray-800"
```

---

## 📊 Type Definitions

```typescript
// Highlight
interface LabeledHighlight {
  id: string;
  label: string;
  kind: "user" | "search";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Template
interface FieldTemplate {
  id: string;
  label: string;
  placeholder?: string;
}

// Form Data
type PageFormData = Record<string, string>;
// key: "pageNum:fieldId", value: field value
```

---

## 🔍 Common Tasks

### Add New Component
```
1. Create file: src/components/NewComponent.tsx
2. Follow component pattern from docs/PATTERNS.md
3. Export from src/components/index.ts
4. Add tests: src/__tests__/NewComponent.test.tsx
```

### Add Custom Hook
```
1. Create file: src/hooks/useCustom.ts
2. Follow hook pattern from docs/PATTERNS.md
3. Export from src/hooks/index.ts
4. Add usage example in JSDoc
```

### Add Utility Function
```
1. Create/update file in src/utils/
2. Add proper TypeScript types
3. Add JSDoc comments
4. Export from src/utils/index.ts
5. Write unit tests
```

### Debug Lector Issue
```
1. Check hook is inside Root component
2. Verify PDF.js worker is configured
3. Check browser console for errors
4. See docs/PATTERNS.md debug section
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Focus search |
| `←` / `→` | Previous/Next page |
| `Ctrl+E` | Export CSV |
| `Ctrl+Shift+E` | Export JSON |
| `Ctrl+N` | New project |
| `Ctrl+D` | Toggle dark mode |
| `Shift+?` | Help modal |

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Hook error | Move hook inside Root component |
| PDF not loading | Check worker config & source |
| Storage full | Use IndexedDB for PDFs |
| Search slow | Add debouncing (500ms) |
| Build error | Clear node_modules, reinstall |

---

## 📚 Documentation Links

- **Architecture:** `docs/ARCHITECTURE.md`
- **Patterns:** `docs/PATTERNS.md`
- **Integration:** `docs/INTEGRATION_GUIDE.md`
- **Lector Docs:** https://lector-weld.vercel.app/docs
- **PDF.js Docs:** https://mozilla.github.io/pdf.js/

---

## 🎯 Cursor AI Prompts

```
# Component
"Create a component following the pattern in .cursorrules"

# Integration
"Integrate PDF upload following docs/INTEGRATION_GUIDE.md"

# Debug
"Fix this error using the debug-lector.md guide"

# Test
"Write tests following the add-test.md template"

# Optimize
"Optimize performance using optimize-performance.md patterns"
```

---

## ✅ Pre-Deployment Checklist

- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Dark mode works
- [ ] Export functions work
- [ ] LocalStorage persists
- [ ] No console errors
- [ ] Accessibility features work

---

## 🔗 Quick Links

- GitHub: `https://github.com/matheus-rech/lector-review`
- Lector: `https://github.com/matheus-rech/lector`
- Issues: Create on GitHub
- Docs: `docs/` directory

---

**Version:** 2.0.0 | **Last Updated:** November 2025
