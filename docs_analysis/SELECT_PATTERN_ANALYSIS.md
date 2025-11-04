# Select Pattern Analysis

**Date**: November 4, 2025  
**Source**: https://lector-weld.vercel.app/docs/code/select  
**Purpose**: Understand Select component for text highlighting

---

## 🎯 Select Component Overview

**Purpose**: Allow users to highlight selected text in a PDF

**Key Components**:
1. `useSelectionDimensions()` - Hook to get selection dimensions
2. `SelectionTooltip` - Component that appears when text is selected
3. `setHighlight()` - Function to save highlights

---

## 📊 Official Pattern

### Basic Structure

```tsx
<Root source="/pdf/document.pdf" className="flex bg-gray-50 h-[500px]">
  <HighlightLayerContent />
</Root>
```

### HighlightLayerContent Component

```tsx
const HighlightLayerContent = () => {
  const selectionDimensions = useSelectionDimensions();
  const setHighlights = usePdf((state) => state.setHighlight);
  
  const handleHighlight = () => {
    const dimension = selectionDimensions.getDimension();
    if (dimension && !dimension.isCollapsed) {
      setHighlights(dimension.highlights);
    }
  };
  
  return (
    <Pages className="p-4 w-full">
      <Page>
        {selectionDimensions && <CustomSelect onHighlight={handleHighlight} />}
        <CanvasLayer />
        <TextLayer />
        <HighlightLayer className="bg-yellow-200/70" />
      </Page>
    </Pages>
  );
};
```

### CustomSelect Component (Tooltip)

```tsx
import { SelectionTooltip } from "@anaralabs/lector";

export const CustomSelect = ({ onHighlight }: { onHighlight: () => void }) => {
  return (
    <SelectionTooltip>
      <button
        className="bg-white shadow-lg rounded-md px-3 py-1 hover:bg-yellow-200/70"
        onClick={onHighlight}
      >
        Highlight
      </button>
    </SelectionTooltip>
  );
};
```

---

## 🔍 Key Observations

### 1. No Wrapper Required
- **Select does NOT need a wrapper** like `<Search>`
- Works directly inside `<Page>`
- Uses hooks: `useSelectionDimensions()` and `usePdf()`

### 2. Component Placement
```tsx
<Page>
  {selectionDimensions && <CustomSelect onHighlight={handleHighlight} />}
  <CanvasLayer />
  <TextLayer />
  <HighlightLayer className="bg-yellow-200/70" />
</Page>
```

**Order**:
1. CustomSelect (conditional)
2. CanvasLayer
3. TextLayer
4. HighlightLayer

### 3. SelectionTooltip
- Automatically positions itself near selected text
- Only appears when text is selected
- Can contain any custom content (buttons, icons, etc.)

### 4. Highlight Flow
1. User selects text
2. `useSelectionDimensions()` detects selection
3. `SelectionTooltip` appears
4. User clicks "Highlight" button
5. `handleHighlight()` is called
6. `setHighlights()` saves the highlight
7. `HighlightLayer` displays the highlight

---

## 🎨 Select vs Search Comparison

### Search Pattern
```tsx
<Root>
  <Search>  {/* ← Wrapper required */}
    <SearchUI />
    <Pages>
      <Page>
        <CanvasLayer />
        <TextLayer />
        <HighlightLayer />
      </Page>
    </Pages>
  </Search>
</Root>
```

### Select Pattern
```tsx
<Root>
  <Pages>
    <Page>
      <SelectionTooltip>  {/* ← No wrapper, inside Page */}
        <button>Highlight</button>
      </SelectionTooltip>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer />
    </Page>
  </Pages>
</Root>
```

---

## ✅ Both Search AND Select Together

```tsx
<Root source={pdfSource}>
  <Search>  {/* ← Search wrapper */}
    <div className="flex h-screen">
      <aside>
        <SearchUI />  {/* ← Search feature */}
      </aside>
      
      <main>
        <Pages>
          <Page>
            {selectionDimensions && (  {/* ← Select feature */}
              <SelectionTooltip>
                <button onClick={handleHighlight}>Highlight</button>
              </SelectionTooltip>
            )}
            <CanvasLayer />
            <TextLayer />
            <HighlightLayer />  {/* ← Shared by both features */}
          </Page>
        </Pages>
      </main>
    </div>
  </Search>
</Root>
```

**Key Points**:
- ✅ Search wrapper around everything
- ✅ SearchUI in sidebar (uses Search context)
- ✅ SelectionTooltip inside Page (independent)
- ✅ HighlightLayer used by both features
- ✅ Both features work independently

---

## 🚀 Implementation Plan

### Step 1: Add Search Wrapper
```tsx
import { Search } from "@anaralabs/lector";

return (
  <Search>
    {/* Existing layout */}
  </Search>
);
```

### Step 2: Replace Old Search with SearchUI
```tsx
{/* OLD: 98 lines */}
{/* NEW: */}
<SearchUI />
```

### Step 3: Add Select Functionality
```tsx
// Inside Page component
{selectionDimensions && (
  <SelectionTooltip>
    <button onClick={handleHighlight}>Highlight</button>
  </SelectionTooltip>
)}
```

### Step 4: Add Selection Hooks
```tsx
const selectionDimensions = useSelectionDimensions();
const setHighlights = usePdf((state) => state.setHighlight);

const handleHighlight = () => {
  const dimension = selectionDimensions.getDimension();
  if (dimension && !dimension.isCollapsed) {
    setHighlights(dimension.highlights);
  }
};
```

---

## 📈 Features Comparison

### Search Feature
- **Purpose**: Find text in PDF
- **UI**: Sidebar with search input and results
- **Wrapper**: `<Search>` required
- **Hooks**: `useSearch()`, `usePdfJump()`
- **Highlighting**: Temporary (yellow) for search results

### Select Feature
- **Purpose**: Manually highlight text
- **UI**: Tooltip that appears on text selection
- **Wrapper**: None required
- **Hooks**: `useSelectionDimensions()`, `usePdf()`
- **Highlighting**: Permanent (saved) user highlights

### Both Use
- **HighlightLayer**: Displays all highlights
- **TextLayer**: Enables text selection
- **Root**: PDF context provider

---

## 🎯 Implementation Status

- ✅ **Search Pattern**: Documented and understood
- ✅ **Select Pattern**: Documented and understood
- ⏳ **Search Implementation**: Ready to implement
- ⏳ **Select Implementation**: Ready to implement
- ⏳ **Integration**: Both features together
- ⏳ **Testing**: Verify both work independently

---

## 💡 Key Takeaways

1. **Independent Features**: Search and Select are separate
2. **Different Patterns**: Search needs wrapper, Select doesn't
3. **Shared Components**: Both use HighlightLayer
4. **Compatible**: Can be used together without conflicts
5. **User Experience**: Search = find text, Select = save highlights

---

*Analysis Completed: November 4, 2025*  
*Official Docs: https://lector-weld.vercel.app/docs/code/select*  
*Status: Ready for implementation*  
*Confidence: High*
