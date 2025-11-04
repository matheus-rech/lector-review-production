# Cursor AI Guide - Lector Review

Welcome to the Lector Review project! This guide will help you use Cursor AI effectively with this codebase.

---

## 🚀 Quick Start

### First Time Setup

1. **Open project in Cursor:**
   ```bash
   cursor /path/to/lector-review
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Cursor will automatically load:**
   - `.cursorrules` - Project-specific AI instructions
   - `.cursor/` directory - Prompt templates and examples
   - Type definitions from `src/types/`

### Verify Setup

Check that Cursor recognizes the project context:
- Press `Cmd/Ctrl+L` to open Chat
- Ask: "What is this project?"
- Cursor should describe Lector Review correctly

---

## 📚 Key Files for Cursor

Cursor has been configured with context from these files:

| File | Purpose |
|------|---------|
| `.cursorrules` | Main AI instruction file |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/PATTERNS.md` | Code patterns |
| `docs/INTEGRATION_GUIDE.md` | Integration steps |
| `src/types/index.ts` | All type definitions |
| `.cursor/prompts/` | Task-specific prompts |
| `.cursor/examples/` | Code examples |

---

## 🎯 Using Cursor Effectively

### 1. Use Prompts from `.cursor/prompts/`

Instead of typing instructions from scratch, reference the prompt files:

```
Use the "add-component" prompt to create a new FieldSelector component
```

Available prompts:
- `add-component.md` - Create new React components
- `integrate-feature.md` - Integrate pending features
- `add-test.md` - Create tests
- `debug-lector.md` - Debug Lector-specific issues
- `optimize-performance.md` - Performance improvements

### 2. Reference Code Examples

Point Cursor to the example files:

```
Create a custom hook following the pattern in .cursor/examples/hook-example.ts
```

Available examples:
- `component-example.tsx` - Component structure
- `hook-example.ts` - Custom hooks
- `storage-pattern.ts` - LocalStorage usage

### 3. Leverage Type Definitions

Cursor has full access to types:

```
Use the LabeledHighlight type from @/types to create a new highlight
```

All types are in `src/types/index.ts` with JSDoc comments.

### 4. Use Path Aliases

Cursor understands these import aliases:

```typescript
import { Modal, Toast } from '@/components';
import { useDarkMode } from '@/hooks';
import { validateField } from '@/utils';
import type { LabeledHighlight } from '@/types';
```

---

## 💡 Common Workflows

### Creating a New Component

**Prompt:**
```
Create a new component called FieldSelector that allows users to select
a field from a dropdown. Follow the component pattern in .cursorrules.
Include TypeScript types, dark mode support, and ARIA labels.
```

**What Cursor knows:**
- Component structure from `.cursorrules`
- Styling patterns (Tailwind + dark mode)
- Accessibility requirements
- Error handling patterns

### Integrating PDF Upload

**Prompt:**
```
Integrate the PDF upload feature following the steps in
docs/INTEGRATION_GUIDE.md. Start with Step 1: importing required modules.
```

**What Cursor knows:**
- Exact integration steps
- Required imports
- Component locations
- Testing checklist

### Debugging Lector Issues

**Prompt:**
```
I'm getting "usePdfJump must be called inside Root" error.
Help me fix this following the debug-lector.md guide.
```

**What Cursor knows:**
- Lector hook context requirements
- Common errors and solutions
- Correct component structure
- Official Lector docs

### Adding Tests

**Prompt:**
```
Write unit tests for the exportToJSON function following the
test patterns in add-test.md
```

**What Cursor knows:**
- Test structure (Vitest)
- What to test
- Mock patterns
- Expected coverage

---

## 🔧 Cursor Settings

### Recommended Settings

Press `Cmd/Ctrl+,` and configure:

```json
{
  "cursor.chat.defaultModel": "claude-3.5-sonnet",
  "cursor.chat.includeCodebase": true,
  "cursor.chat.maxTokens": 4000,
  "cursor.codeActions.enabled": true
}
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+L` | Open Chat |
| `Cmd/Ctrl+K` | Inline Edit |
| `Cmd/Ctrl+I` | Quick Command |
| `Cmd/Ctrl+Shift+L` | Open Chat with Selection |

---

## 📖 Documentation Structure

Cursor has access to these docs:

```
lector-review/
├── .cursorrules                    # ⭐ Main AI instructions
├── .cursor/
│   ├── prompts/                    # Task-specific prompts
│   │   ├── add-component.md
│   │   ├── integrate-feature.md
│   │   ├── add-test.md
│   │   ├── debug-lector.md
│   │   └── optimize-performance.md
│   └── examples/                   # Code examples
│       ├── component-example.tsx
│       ├── hook-example.ts
│       └── storage-pattern.ts
├── docs/
│   ├── ARCHITECTURE.md             # System design
│   ├── PATTERNS.md                 # Code patterns
│   └── INTEGRATION_GUIDE.md        # Feature integration
├── README.md                       # Project overview
├── CONTRIBUTING.md                 # Development guidelines
└── QUICK_REF.md                    # Quick reference
```

---

## 🎨 Prompting Best Practices

### Be Specific

❌ **Bad:**
```
Add a button
```

✅ **Good:**
```
Add a "Manage Templates" button in the right sidebar that opens a modal
with the TemplateManager component. Use Tailwind CSS and include dark mode.
```

### Reference Context

❌ **Bad:**
```
Fix the PDF loading issue
```

✅ **Good:**
```
The PDF is showing "Loading..." forever. Use the debug-lector.md guide
to check PDF.js worker configuration and Root component setup.
```

### Ask for Explanations

```
Explain why Lector hooks must be called inside the Root component
```

```
What's the purpose of the LocalStorage namespacing pattern?
```

### Request Multiple Options

```
Suggest 3 ways to optimize the highlight rendering performance
```

```
What are different approaches to implement undo/redo functionality?
```

---

## 🐛 Debugging with Cursor

### Step-by-Step Debugging

1. **Describe the issue:**
   ```
   When I click Export CSV, the file downloads but is empty
   ```

2. **Cursor will:**
   - Check the exportToCSV function in utils/importExport.ts
   - Review error handling
   - Suggest console.log statements
   - Propose fixes

3. **Test the fix:**
   ```
   Test the updated exportToCSV function with sample data
   ```

### Console Error Help

**Just paste the error:**
```
Error: usePdfJump must be called inside a Root component
    at usePdfJump (lector.js:123)
    at App.tsx:45
```

Cursor will:
- Identify the issue (hook called outside Root)
- Suggest the fix
- Show example code

---

## 🚀 Advanced Usage

### Multi-File Edits

```
Update both Modal.tsx and App.tsx to add a confirmation modal
for project deletion. Follow the modal dialog pattern.
```

### Refactoring

```
Refactor the field rendering logic in App.tsx into a separate
FieldForm component. Move related state and handlers.
```

### Code Review

```
Review the highlight creation logic in App.tsx for potential bugs
or performance issues
```

### Documentation

```
Add JSDoc comments to all functions in utils/validation.ts
```

---

## 📊 Understanding Cursor's Context

Cursor has deep understanding of:

### ✅ Project Structure
- Component hierarchy
- Data flow
- State management
- Storage architecture

### ✅ Lector Library
- Hook requirements
- Component layers
- Common errors
- Official docs

### ✅ Code Patterns
- Component structure
- Hook patterns
- Storage patterns
- Error handling

### ✅ Integration Plans
- PDF upload steps
- Template manager steps
- Schema forms steps

---

## 🎓 Learning Resources

### In-Project Resources

1. **Architecture:** `docs/ARCHITECTURE.md`
2. **Patterns:** `docs/PATTERNS.md`
3. **Integration:** `docs/INTEGRATION_GUIDE.md`
4. **Examples:** `.cursor/examples/`

### Ask Cursor

```
Explain the per-page template system architecture
```

```
Show me an example of using the useDebounce hook
```

```
What's the correct way to add a new field template?
```

---

## ✨ Tips & Tricks

### 1. Use Code Selection

Select code before opening Chat (`Cmd/Ctrl+Shift+L`) for context-aware suggestions.

### 2. Iterate Quickly

```
Add error handling to this function
[Cursor adds try-catch]

Now add a loading state
[Cursor adds useState and loading indicator]

Add a Toast notification on error
[Cursor integrates Toast]
```

### 3. Ask for Tests

After writing code:
```
Write unit tests for the function I just created
```

### 4. Request Cleanup

```
Refactor this function to be more readable and add comments
```

### 5. Get Explanations

```
Explain what this useEffect does and why the dependencies are needed
```

---

## 🔍 Troubleshooting

### Cursor Not Understanding Context

1. **Restart Cursor** (close and reopen)
2. **Check `.cursorrules` is present**
3. **Verify TypeScript compilation:** `pnpm type-check`

### Slow Responses

1. **Reduce code selection** - Select only relevant code
2. **Use specific prompts** - Reference exact files
3. **Break into smaller tasks** - One change at a time

### Unexpected Suggestions

1. **Be more specific** in prompts
2. **Reference documentation** explicitly
3. **Provide examples** of desired output

---

## 📞 Getting Help

### Within Cursor

```
I'm stuck on [problem]. Can you suggest an approach?
```

```
This isn't working as expected: [describe issue]
```

### Project Resources

- **Documentation:** `docs/` directory
- **Examples:** `.cursor/examples/`
- **Prompts:** `.cursor/prompts/`
- **Issues:** GitHub Issues

---

## 🎯 Next Steps

1. **Explore the codebase:**
   ```
   Give me a tour of the main components in App.tsx
   ```

2. **Try an integration:**
   ```
   Let's integrate the PDF upload feature step by step
   ```

3. **Create something new:**
   ```
   Create a component that displays project statistics
   ```

4. **Optimize existing code:**
   ```
   Help me optimize the highlight rendering for better performance
   ```

---

**Happy Coding with Cursor! 🚀**

---

**Last Updated:** November 2025
**Cursor Version:** Latest
**Project Version:** 2.0.0
