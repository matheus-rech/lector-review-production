<p align="center">
  <!-- <h1 align="center"><img src="https://www.anara.ai/icons/logo.png" width="196" /></h1> -->
  <p align="center">
    <i>Simple primitives to compose powerful PDF viewing experiences.<br>powered by <code><a href="https://mozilla.github.io/pdf.js/">PDF.js</a></code> and <code><a href="https://reactjs.org/">React</a></code></i>
  </p>
</p>

# `lector`

A composable, headless PDF viewer toolkit for React applications, powered by `PDF.js`. Build feature-rich PDF viewing experiences with full control over the UI and functionality.

[![npm version](https://badge.fury.io/js/@anaralabs%2Flector.svg)](https://www.npmjs.com/package/@anaralabs/lector)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

```bash
npm install @anaralabs/lector pdfjs-dist

# or with yarn
yarn add @anaralabs/lector pdfjs-dist

# or with pnpm
pnpm add @anaralabs/lector pdfjs-dist
```

## Basic Usage

Here's a simple example of how to create a basic PDF viewer:

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

## Features

- 📱 Responsive and mobile-friendly
- 🎨 Fully customizable UI components
- 🔍 Text selection and search functionality
- 📑 Page thumbnails and outline navigation
- 🌗 First-class dark mode support
- 🖱️ Pan and zoom controls
- 📝 Form filling support
- 🔗 Internal and external link handling

## Contributing

We welcome contributions! Key areas we're focusing on:

1. Performance optimizations
2. Accessibility improvements
3. Mobile/touch interactions
4. Documentation and examples

## Thanks

Special thanks to these open-source projects that provided inspiration:

- [react-pdf-headless](https://github.com/jkgenser/react-pdf-headless)
- [pdfreader](https://github.com/OnedocLabs/pdfreader)

## License

MIT © [Unriddle AI]()
