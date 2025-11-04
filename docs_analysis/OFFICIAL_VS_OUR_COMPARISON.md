# Official Lector Docs vs Our Implementation - Comparison

**Date**: November 4, 2025  
**Purpose**: Identify differences and match official patterns exactly

---

## 🔍 Official Documentation - Search Example

**Source**: https://lector-weld.vercel.app/docs/code/search

### UI Structure (Official)

```tsx
<Root source="/pdf/pathways.pdf" className="flex bg-gray-50 h-[500px]">
  <Search>
    <SearchUI />  {/* w-80 sidebar */}
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

### SearchUI Component (Official)

```tsx
function SearchUI() {
  return (
    <div className="flex flex-col w-80 h-full">
      {/* Header with search input */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <input
          type="text"
          placeholder="Search in document..."
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Results area */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="py-4">
          {/* Exact Matches section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              Exact Matches
            </h3>
            <div className="divide-y divide-gray-100">
              {/* Result items */}
            </div>
          </div>
          
          {/* Load More button */}
          <button className="w-full py-2 px-4 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600">
            Load More Results
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Result Item (Official)

```tsx
const ResultItem = ({ result, originalSearchText }) => {
  return (
    <div className="flex py-2 hover:bg-gray-50 flex-col cursor-pointer" onClick={onClick}>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{result.text}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="ml-auto">Page {result.pageNumber}</span>
      </div>
    </div>
  );
};
```

### Key Features (Official)
1. **Simple clean design** - No colored badges, no fuzzy matches shown
2. **"Exact Matches" heading** - Clear section title
3. **Page number on right** - Gray text, right-aligned
4. **Hover effect** - `hover:bg-gray-50`
5. **Load More button** - Blue button at bottom
6. **Clean white background** - No pink/colored backgrounds

---

## 🔍 Our Implementation

### UI Structure (Ours)

```tsx
<Root className="flex-1 flex">
  <Search>
    <div className="w-80 border-r bg-white overflow-y-auto flex-shrink-0">
      <SearchUI />
    </div>
    <div className="flex-1 flex flex-col">
      {/* Zoom controls and PDF viewer */}
    </div>
  </Search>
</Root>
```

### SearchUI Component (Ours)

```tsx
function SearchUI() {
  return (
    <div className="flex flex-col h-full bg-pink-50">  {/* ← PINK BACKGROUND! */}
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search
        </label>
        <input
          placeholder="Search in PDF..."
          className="w-full px-3 py-2 border rounded-md"
        />
        {results && (
          <p className="text-xs text-gray-600 mt-2">
            {totalMatches} matches found
          </p>
        )}
      </div>
      
      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Exact matches with green badges */}
        {/* Fuzzy matches with orange badges */}
        {/* "Showing first X of Y results" message */}
      </div>
    </div>
  );
}
```

### Result Item (Ours)

```tsx
const ResultItem = ({ result, type }) => {
  const badgeColor = type === 'exact' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  const badgeText = type === 'exact' ? '✓ Exact' : '≈ Fuzzy';
  
  return (
    <div className="p-3 hover:bg-white rounded-lg cursor-pointer border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">
          Page {result.pageNumber}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded ${badgeColor}`}>
          {badgeText}
        </span>
      </div>
      <p className="text-sm text-gray-700 line-clamp-2">
        {result.text}
      </p>
      {type === 'fuzzy' && (
        <span className="text-xs text-gray-500 mt-1">
          {result.score}% match
        </span>
      )}
    </div>
  );
};
```

---

## ⚠️ KEY DIFFERENCES

### 1. Background Color
- **Official**: Clean white background
- **Ours**: Pink background (`bg-pink-50`)

### 2. Badges
- **Official**: NO badges, just clean text
- **Ours**: Green "✓ Exact" and Orange "≈ Fuzzy" badges

### 3. Result Layout
- **Official**: Simple flex column, page number on right
- **Ours**: Complex layout with badges, borders, rounded corners

### 4. Fuzzy Matches
- **Official**: NOT shown separately (or at all)
- **Ours**: Shown with separate section and percentage scores

### 5. Search Label
- **Official**: No label, just input
- **Ours**: "Search" label above input

### 6. Match Count
- **Official**: Not shown
- **Ours**: "X matches found" below input

### 7. "Showing first X of Y" Message
- **Official**: Not shown
- **Ours**: Shown at bottom of results

---

## ✅ WHAT TO CHANGE

To match the official docs exactly:

1. **Remove pink background** - Use white
2. **Remove all badges** - No "✓ Exact" or "≈ Fuzzy"
3. **Simplify result items** - Just text and page number
4. **Remove fuzzy matches display** - Don't show them in UI
5. **Remove "Search" label** - Just the input
6. **Remove match count** - Don't show "X matches found"
7. **Remove "Showing first X of Y"** - Don't show this message
8. **Simplify hover** - Just `hover:bg-gray-50`
9. **Add "Exact Matches" heading** - Like official docs
10. **Match exact styling** - Use official Tailwind classes

---

## 🎯 CONCLUSION

Our implementation is **functionally correct** but has **too many visual enhancements** that don't match the official minimalist design.

The official pattern is:
- **Minimalist and clean**
- **No visual badges**
- **Simple hover effects**
- **Focus on content, not decoration**

We need to **simplify** our SearchUI to match this aesthetic.
