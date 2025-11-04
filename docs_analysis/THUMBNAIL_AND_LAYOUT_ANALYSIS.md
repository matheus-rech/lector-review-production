# Thumbnail and Layout Analysis

**Date**: November 4, 2025  
**Source**: Official Lector Documentation

---

## 🔍 Official Lector Thumbnails Pattern

### From: https://lector-weld.vercel.app/docs/code/thumbnails

### Thumbnail Sizing
**Official Code**:
```tsx
<Thumbnail className="transition-all w-48 hover:shadow-lg hover:outline hover:outline-gray-300" />
```

**Key Observations**:
- **Width**: `w-48` = **192px** (12rem)
- **Hover Effects**: Shadow and outline on hover
- **Transitions**: Smooth transitions on all properties

### Thumbnails Container
**Official Code**:
```tsx
<div className="w-96 overflow-x-hidden">
  <Thumbnails className="flex flex-col gap-4 items-center py-4">
    <Thumbnail className="transition-all w-48 hover:shadow-lg hover:outline hover:outline-gray-300" />
  </Thumbnails>
</div>
```

**Key Observations**:
- **Container Width**: `w-96` = **384px** (24rem)
- **Layout**: Flex column with gap-4 (16px spacing)
- **Alignment**: Items centered
- **Padding**: py-4 (16px top/bottom)
- **Overflow**: Hidden on X-axis

### Grid Layout
**Official Code**:
```tsx
<div className={cn(
  "basis-0 grow min-h-0 relative grid",
  "transition-all duration-300",
  showThumbnails ? "grid-cols-[24rem,1fr]" : "grid-cols-[0,1fr]"
)}>
```

**Key Observations**:
- **Grid Columns**: `grid-cols-[24rem,1fr]` when thumbnails shown
  - Thumbnails: **24rem** (384px) fixed width
  - PDF Viewer: **1fr** (flexible, takes remaining space)
- **Transitions**: 300ms duration
- **Toggle**: Collapses to `grid-cols-[0,1fr]` when hidden

---

## 📐 Our Current Implementation

### Current Thumbnail Sizing
**Our Code** (App.tsx line ~1339):
```tsx
<Thumbnails className="p-2 space-y-2">
  <Thumbnail className="border rounded hover:border-blue-500 cursor-pointer" />
</Thumbnails>
```

**Issues**:
- ❌ **No width specified** - Thumbnails are too large
- ❌ **No hover shadow** - Less visual feedback
- ❌ **No transitions** - Abrupt changes
- ❌ **Different hover style** - Blue border instead of shadow/outline

### Current Grid Layout
**Our Code** (App.tsx line ~1332):
```tsx
<div className={`flex-1 grid ${
  showThumbnails ? "grid-cols-[200px_1fr]" : "grid-cols-1"
} transition-all duration-300`}>
```

**Issues**:
- ❌ **Thumbnails too narrow**: 200px vs official 384px (24rem)
- ❌ **No centering**: Thumbnails not centered
- ⚠️ **Transitions present**: Good, but thumbnails need proper sizing

---

## 📊 PDF Layout Centering

### Official Pattern (from Search example)
**Official Code**:
```tsx
<Root source="/pdf/pathways.pdf" className="flex bg-gray-50 h-[500px]">
  <Search>
    <SearchUI />
  </Search>
  <Pages className="p-4 w-full">
    <Page>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer className="bg-yellow-200/70" />
    </Page>
  </Pages>
</Root>
```

**Key Observations**:
- **Pages className**: `p-4 w-full` (padding 16px, full width)
- **No max-width**: PDF takes full available width
- **Flex layout**: Root uses `flex` for horizontal layout
- **Simple and clean**: No complex centering needed

### Our Current Implementation
**Our Code** (App.tsx line ~402):
```tsx
<Pages className="p-6 max-w-4xl mx-auto dark:invert-[94%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]">
```

**Issues**:
- ⚠️ **max-w-4xl**: Limits PDF to 896px width
- ⚠️ **mx-auto**: Centers but may be too narrow
- ✅ **p-6**: Good padding (24px)
- ✅ **Dark mode**: Good dark mode support

**Potential Improvement**:
- Remove `max-w-4xl` to allow PDF to use full width
- Keep `mx-auto` for centering if needed
- Or use `w-full` like official docs

---

## ✅ Recommended Changes

### 1. Update Thumbnail Styling
**Change from**:
```tsx
<Thumbnails className="p-2 space-y-2">
  <Thumbnail className="border rounded hover:border-blue-500 cursor-pointer" />
</Thumbnails>
```

**Change to**:
```tsx
<div className="w-96 overflow-x-hidden">
  <Thumbnails className="flex flex-col gap-4 items-center py-4">
    <Thumbnail className="transition-all w-48 hover:shadow-lg hover:outline hover:outline-gray-300" />
  </Thumbnails>
</div>
```

### 2. Update Grid Layout
**Change from**:
```tsx
<div className={`flex-1 grid ${
  showThumbnails ? "grid-cols-[200px_1fr]" : "grid-cols-1"
} transition-all duration-300`}>
```

**Change to**:
```tsx
<div className={cn(
  "flex-1 grid min-h-0 relative",
  "transition-all duration-300",
  showThumbnails ? "grid-cols-[24rem,1fr]" : "grid-cols-[0,1fr]"
)}>
```

### 3. Update PDF Layout (Optional)
**Option A - Full Width** (like official docs):
```tsx
<Pages className="p-4 w-full dark:invert-[94%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]">
```

**Option B - Centered with More Space**:
```tsx
<Pages className="p-6 max-w-6xl mx-auto dark:invert-[94%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]">
```
(max-w-6xl = 1152px instead of 896px)

**Option C - Centered with Flexible Max Width**:
```tsx
<Pages className="p-6 max-w-screen-lg mx-auto dark:invert-[94%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]">
```
(max-w-screen-lg = 1024px)

---

## 📝 Summary

### Thumbnail Changes Needed
1. ✅ Add `w-48` (192px) to Thumbnail component
2. ✅ Change hover style to shadow + outline
3. ✅ Add transitions
4. ✅ Wrap in `w-96` container
5. ✅ Center thumbnails with `items-center`
6. ✅ Update grid to `grid-cols-[24rem,1fr]`

### PDF Layout Changes Needed
1. ⚠️ Consider removing `max-w-4xl` for more space
2. ⚠️ Or increase to `max-w-6xl` or `max-w-screen-lg`
3. ✅ Keep dark mode support
4. ✅ Keep padding for breathing room

### Expected Results
- ✅ Smaller, cleaner thumbnails (192px vs current larger size)
- ✅ Better hover feedback (shadow + outline)
- ✅ More space for thumbnails sidebar (384px vs 200px)
- ✅ More centered, spacious PDF layout
- ✅ Matches official Lector documentation styling
