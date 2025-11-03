# Lector Review - User Guide

## Overview

**Lector Review** is a React-based PDF viewer application designed for systematic review and data extraction from research papers. It provides tools for managing multiple projects, highlighting text, extracting data with custom field templates, and exporting results.

## Features

### Core Features

- **Multi-Project Management**: Create and manage multiple review projects with isolated data storage
- **PDF Viewing**: High-quality PDF rendering powered by PDF.js and @anaralabs/lector
- **Text Search**: Search within PDF documents
- **Manual Highlighting**: Select and label important text passages
- **Per-Page Field Templates**: Define custom data extraction fields for each page
- **Data Export**: Export extracted data to JSON or CSV formats
- **LocalStorage Persistence**: All project data is saved locally in your browser

### Project Management

#### Creating a Project

1. Click the **"+"** button next to the project dropdown
2. Enter a project name when prompted
3. The new project will be created and automatically selected

#### Switching Projects

Use the dropdown menu in the left sidebar to switch between projects. Each project maintains its own:
- Highlights
- Field templates
- Extracted data
- PDF source

#### Deleting a Project

1. Select the project you want to delete
2. Click the **🗑** (trash) button
3. Confirm the deletion
4. **Note**: The "default" project cannot be deleted

### PDF Management

#### Loading a PDF

1. Enter the PDF path or URL in the **"PDF Source"** field
2. The default sample PDF is located at `/sample.pdf`
3. You can use:
   - Relative paths (e.g., `/sample.pdf`)
   - Full URLs (e.g., `https://example.com/paper.pdf`)
   - Blob URLs from uploaded files

### Data Extraction

#### Per-Page Field Templates

Each page can have custom fields for data extraction:

1. Navigate to the page you want to extract data from
2. Click **"+ field"** in the right sidebar
3. Enter a field label (e.g., "Study ID", "Sample Size", "P-value")
4. The field will appear with an input box
5. Fill in the extracted data

**Default Templates** (can be customized):

- **Page 1**: Study ID, Design
- **Page 2**: Total N, Arms (brief)
- **Page 3**: Primary Outcome, Effect, 95% CI

#### Manual Highlights

To highlight and label important text:

1. Select text in the PDF (feature to be fully implemented with Lector hooks)
2. A prompt will ask for a label
3. Enter a descriptive label (e.g., "sample size", "p-value", "conclusion")
4. The highlight will be saved and listed in the right sidebar

**Managing Highlights**:
- **Go**: Jump to the page containing the highlight
- **Edit**: Change the highlight label
- **Del**: Remove the highlight

### Search

Use the search box in the left sidebar to find text within the PDF. Search results will be highlighted automatically (when fully implemented with Lector hooks).

### Export

#### Export to JSON

Click **"Export JSON"** to download a complete project export including:
- Project metadata
- All highlights with positions
- Field template definitions
- Extracted data for all pages
- PDF source

**Use case**: Backup, sharing, or importing into other tools

#### Export to CSV

Click **"Export CSV"** to download a tabular export with:
- One row per data point
- Columns: Project, Type, Page, Field, Label, Value, x, y, width, height

**Use case**: Analysis in Excel, R, or Python

## Technical Details

### Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **@anaralabs/lector** for PDF rendering
- **pdfjs-dist** for PDF processing

### Data Storage

All data is stored in browser `localStorage` with keys namespaced by project:
- `projects`: List of all projects
- `current-project`: Currently selected project
- `proj:{name}:highlights`: Highlights for a project
- `proj:{name}:pageForm`: Extracted field data
- `proj:{name}:templates`: Field template definitions
- `proj:{name}:pdfFormData`: Embedded PDF form data

### Browser Compatibility

- Modern browsers with ES6+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- Requires JavaScript enabled
- Requires localStorage enabled

## Development

### Running Locally

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

### Project Structure

```
lector-review/
├── public/
│   └── sample.pdf          # Sample PDF for testing
├── src/
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # Project documentation
```

## Known Limitations

### Current Implementation

The current implementation provides a **simplified version** of the original specification. Some advanced features using Lector hooks are not fully implemented:

1. **Lector Hooks**: The hooks (`usePdfJump`, `useSearch`, `useSelectionDimensions`) need to be called inside components wrapped by `Root`, which requires additional component restructuring
2. **Auto-highlighting from search**: Search highlighting is prepared but not fully active
3. **Selection-based highlighting**: Manual text selection highlighting needs additional implementation
4. **HighlightLayer rendering**: Highlight visualization on the PDF needs the proper hook integration
5. **AnnotationLayer**: PDF form field capture is prepared but not fully integrated

### Recommended Enhancements

To fully implement the specification:

1. Create a separate component for the PDF viewer content that uses Lector hooks
2. Implement the `useSelectionDimensions` hook for text selection
3. Integrate `useSearch` for auto-highlighting search results
4. Add `HighlightLayer` component with the highlights array
5. Implement `AnnotationLayer` for embedded PDF forms

## Troubleshooting

### PDF Not Loading

- Check the PDF source path is correct
- Ensure the PDF is accessible (CORS headers if loading from external URL)
- Check browser console for errors

### Data Not Persisting

- Ensure localStorage is enabled in your browser
- Check browser storage limits (typically 5-10MB)
- Try clearing old project data if storage is full

### Performance Issues

- Large PDFs may take time to render
- Consider reducing PDF file size
- Close unused browser tabs

## Support

For issues, questions, or feature requests, please refer to the project repository or contact the development team.

## License

This project is built with open-source libraries:
- @anaralabs/lector (check their license)
- pdfjs-dist (Apache 2.0)
- React (MIT)
- Vite (MIT)
