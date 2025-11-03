# Lector GitHub Repository Findings

## Repository Information
- **URL**: https://github.com/anaralabs/lector
- **Stars**: 347
- **Forks**: 34
- **Latest Version**: v3.7.2 (Oct 7, 2025)
- **License**: MIT
- **Maintained by**: @anaralabs

## Key Features
- 📱 Responsive and mobile-friendly
- 🎨 Fully customizable UI components
- 🔍 Text selection and search functionality
- 📑 Page thumbnails and outline navigation
- 🌗 First-class dark mode support
- 🖱️ Pan and zoom controls
- 📝 Form filling support
- 🔗 Internal and external link handling

## Basic Usage Pattern
```tsx
import { CanvasLayer, Page, Pages, Root, TextLayer } from "@anaralabs/lector";
import "pdfjs-dist/web/pdf_viewer.css";

export default function PDFViewer() {
  return (
    <Root
      source="/sample.pdf"
      className="w-full h-[500px] border overflow-hidden rounded-lg"
      loader={<div className="p-4">Loading...</div>}
    >
      <Pages className="p-4">
        <Page>
          <CanvasLayer />
          <TextLayer />
        </Page>
      </Pages>
    </Root>
  );
}
```

## Documentation Site
- **URL**: https://lector-weld.vercel.app/
- Need to review for complete API reference and hooks documentation

## Next Steps
1. Visit the documentation site for detailed API reference
2. Review hooks documentation (useSearch, usePdfJump, useSelectionDimensions)
3. Check examples folder for advanced usage patterns
