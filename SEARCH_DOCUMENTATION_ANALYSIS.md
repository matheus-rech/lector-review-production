# Search Feature Documentation Analysis

## Official Lector Documentation Example

### Key Components Required

1. **Search** component wrapper
   - Wraps the search UI
   - Provides search context

2. **useSearch()** hook
   - Returns `{ searchResults, search }` object
   - `searchResults` contains:
     - `exactMatches` array
     - `fuzzyMatches` array
     - `hasMoreResults` boolean
   - `search(text, options)` function to perform search

3. **calculateHighlightRects()** function
   - Calculates highlight rectangles for search results
   - Parameters:
     - `pageProxy` - from `getPdfPageProxy(pageNumber)`
     - `options`:
       - `pageNumber`
       - `text`
       - `matchIndex`
       - `searchText` (optional - for exact term highlighting)

4. **usePdfJump()** hook
   - Returns `jumpToHighlightRects()` function
   - Used to navigate to search results

5. **HighlightLayer** component
   - Automatically renders highlights (including search highlights)
   - Uses className for styling

### Proper Structure

```tsx
<Root source="/pdf/document.pdf">
  <Search>
    <SearchUI />
  </Search>
  <Pages>
    <Page>
      <CanvasLayer />
      <TextLayer />
      <HighlightLayer className="bg-yellow-200/70" />
    </Page>
  </Pages>
</Root>
```

### Search Implementation Pattern

```tsx
const SearchUI = () => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 500);
  const { searchResults, search } = useSearch();
  
  useEffect(() => {
    search(debouncedSearchText, { limit: 5 });
  }, [debouncedSearchText]);
  
  return (
    <div>
      <input
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        placeholder="Search in document..."
      />
      {searchResults.exactMatches.map((result) => (
        <ResultItem key={result.id} result={result} />
      ))}
    </div>
  );
};
```

### Result Navigation Pattern

```tsx
const ResultItem = ({ result, originalSearchText }) => {
  const { jumpToHighlightRects } = usePdfJump();
  const getPdfPageProxy = usePdf((state) => state.getPdfPageProxy);
  
  const onClick = async () => {
    const pageProxy = getPdfPageProxy(result.pageNumber);
    const rects = await calculateHighlightRects(pageProxy, {
      pageNumber: result.pageNumber,
      text: result.text,
      matchIndex: result.matchIndex,
      searchText: originalSearchText, // For exact term highlighting
    });
    jumpToHighlightRects(rects, "pixels");
  };
  
  return <div onClick={onClick}>{result.text}</div>;
};
```

## Current Implementation Issues to Check

1. ❓ Are we using the `Search` component wrapper?
2. ❓ Are we using `useSearch()` hook correctly?
3. ❓ Are we using `calculateHighlightRects()` for search results?
4. ❓ Are we using `jumpToHighlightRects()` to navigate to results?
5. ❓ Are we using debouncing for search input?
6. ❓ Are search highlights integrated with HighlightLayer?

## Key Differences from Manual Implementation

- **Documentation uses**: `useSearch()` hook + `calculateHighlightRects()` + `HighlightLayer`
- **Manual approach**: Custom search logic + manual highlight rendering with CustomLayer

The documentation approach is more integrated with Lector's internal state management and provides better performance and consistency.
