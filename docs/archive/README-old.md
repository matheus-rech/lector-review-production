# Lector Review

A React-based PDF viewer application with advanced features for systematic review and data extraction from research papers.

## Features

### 📁 Multi-Project Management
- Create and manage multiple projects with isolated data
- Switch between projects seamlessly
- Delete projects (except the default one)
- All data persisted in browser localStorage

### 📄 PDF Viewing
- Powered by `@anaralabs/lector` and `pdfjs-dist`
- High-quality PDF rendering
- Page navigation controls
- Zoom and pan capabilities

### 🔍 Search Functionality
- Full-text search across the PDF
- Auto-highlighting of search results
- Navigate between search hits with previous/next buttons
- Real-time search result count

### ✏️ Manual Highlighting
- Select text or regions in the PDF
- Add custom labels to highlights (e.g., "n", "mean", "CI")
- Rename or delete highlights
- Jump to specific highlights
- Highlights persist per project

### 📋 Per-Page Field Templates
- Define custom data extraction fields for each page
- Pre-configured templates for common research paper sections:
  - Page 1: Study ID, Design
  - Page 2: Total N, Arms description
  - Page 3: Primary Outcome, Effect, 95% CI
- Add new fields dynamically
- All field values persist per project

### 📝 Embedded PDF Form Support
- Capture data from PDF AcroForms
- Submit and save form values locally
- Persist form data per project

### 💾 Export Capabilities
- **JSON Export**: Complete project data including highlights, templates, and form data
- **CSV Export**: Tabular format with highlights, page fields, and PDF form data
- Easy data integration with other tools

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## Usage

1. **Open the application** at [http://localhost:5173](http://localhost:5173)

2. **Select or create a project** using the dropdown and buttons in the left sidebar

3. **Load a PDF** by changing the PDF Source field (default: `/sample.pdf`)

4. **Search the PDF** by typing in the search box - matches will be auto-highlighted

5. **Add highlights**:
   - Select text or a region in the PDF
   - Click "Add from Selection"
   - Enter a label for the highlight

6. **Fill in page fields** in the right sidebar based on the current page template

7. **Export your data** using the "Export JSON" or "Export CSV" buttons

## Project Structure

```
lector-review/
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── public/
│   └── sample.pdf          # Sample PDF for testing
└── src/
    ├── main.tsx            # Application entry point
    ├── App.tsx             # Main application component
    └── index.css           # Global styles
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **@anaralabs/lector** - PDF viewer component library
- **pdfjs-dist** - PDF.js library for PDF rendering

## Data Persistence

All data is stored in browser `localStorage` with the following structure:

- `projects`: List of all project names
- `current-project`: Currently selected project
- `proj:{projectName}:highlights`: User-created highlights
- `proj:{projectName}:pageForm`: Per-page field values
- `proj:{projectName}:templates`: Per-page field templates
- `proj:{projectName}:pdfFormData`: Embedded PDF form data

## Notes

- **Auto-highlighted search**: Search matches are visualized as highlights and you can navigate between them
- **Per-page templates**: Fields are tied to specific pages and can be customized
- **Highlight labeling**: Select text, add a label, and manage highlights from the right sidebar
- **PDF forms**: Embedded AcroForms are handled by the AnnotationLayer component
- **Multi-project support**: All data is namespaced by project name in localStorage

## License

MIT
