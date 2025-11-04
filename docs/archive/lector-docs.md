# Lector Basic Usage Documentation

## Core Concepts

Lector follows a component-based architecture with three main layers:

1. **Root Container**: Manages the PDF document state and context
2. **Pages Container**: Handles page layout and virtualization
3. **Layer Components**: Render different aspects of each page (canvas, text, annotations)

## Basic Setup

First, set up the PDF.js worker:

```tsx
import { GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

// Set up the worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
```

## Creating a Basic Viewer

Here's a minimal example of a PDF viewer:

```tsx
import { Root, Pages, Page, CanvasLayer, TextLayer } from "@anaralabs/lector";

function PDFViewer() {
  return (
    <Root source='/sample.pdf' className='w-full h-[600px] border rounded-lg overflow-hidden'>
      <Pages className='p-4'>
        <Page>
          <CanvasLayer />
          <TextLayer />
        </Page>
      </Pages>
    </Root>
  );
}
```

## Root Component

The `Root` component is the main container that manages the PDF document state:

```tsx
<Root
  source='/path/to/pdf' // URL or path to PDF file
  className='...' // Container styling
  loader={<Loading />} // Custom loading component
  onLoad={handleLoad} // Called when PDF is loaded
  onError={handleError} // Called on load error
>
  {/* Child components */}
</Root>
```

## Pages Component

The `Pages` component handles page layout and virtualization:

```tsx
<Pages className='...'>
  {/* Page component */}
</Pages>
```

## Page Layers

Each page can have multiple layers for different functionality:

```tsx
<Page>
  <CanvasLayer /> {/* Renders the PDF content */}
  <TextLayer /> {/* Enables text selection */}
  <AnnotationLayer /> {/* Renders annotations and links */}
  <HighlightLayer /> {/* Custom highlight overlay */}
</Page>
```
