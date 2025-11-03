# Implementation Plan - Lector Review Complete Integration

## Overview

This document outlines the comprehensive plan to integrate all remaining features, implement the JSON schema for systematic review data extraction, and prepare the application for GitHub deployment.

## Phase 1: Analyze JSON Schema and Plan Integration

### JSON Schema Analysis

The provided JSON schema is a comprehensive medical literature data extraction schema designed for systematic reviews and meta-analysis. Key features:

1. **Traceable Data Model**: Every data point includes:
   - `value`: The actual data
   - `source_text`: Exact quote from the document
   - `source_location`: Location in document (page, table, figure)

2. **Data Types**:
   - `SourcedString`: Text values with source traceability
   - `SourcedNumber`: Numeric values with source traceability
   - `SourcedInteger`: Integer values with source traceability
   - `SourcedEnumBase`: Enumerated values with source traceability

3. **Complex Structures**:
   - `statisticalReporting`: Mean/SD, Median/IQR, Median/Range
   - `countPercentage`: Count and percentage for categorical data
   - `statisticalComparison`: P-values, effect measures, confidence intervals
   - `riskEnum`: Risk of bias assessments

4. **Main Sections**:
   - **I. Study Metadata and Identification**
   - **II. Risk of Bias Assessment**
   - **III. Study Design and Purpose**
   - **IV. Patient Characteristics (Baseline)**
   - **V. Clinical and Radiological Factors (Baseline)**
   - **VI. Intervention Details**
   - **VII. Outcomes (Primary and Secondary)**
   - **VIII. Adverse Events**
   - **IX. Follow-up and Attrition**
   - **X. Additional Information**

### Integration Strategy

The schema will be integrated into the Lector Review application through:

1. **Dynamic Form Generation**: Generate forms based on schema structure
2. **Highlight Linking**: Connect highlights to specific fields
3. **Source Traceability**: Automatically populate `source_text` and `source_location` from highlights
4. **Validation**: Validate data against schema requirements
5. **Export Enhancement**: Export data in schema-compliant JSON format

---

## Phase 2: Integrate PDF Upload Component

### Current State
- Component exists at `src/components/PDFUpload.tsx`
- Not integrated into main App.tsx

### Implementation Steps

1. **Add PDF Upload UI**
   - Add "Upload PDF" button in sidebar
   - Show uploaded PDF list
   - Allow switching between PDFs

2. **PDF Storage**
   - Store uploaded PDFs in IndexedDB (for larger files)
   - Store PDF metadata in localStorage
   - Generate unique IDs for each PDF

3. **PDF Loading**
   - Load PDFs from File API
   - Convert to blob URLs for Lector
   - Handle PDF errors gracefully

4. **Multi-PDF Support**
   - Associate projects with specific PDFs
   - Allow multiple PDFs per project
   - Switch between PDFs within a project

### Technical Details

```typescript
interface PDFMetadata {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  blobUrl: string;
}

interface Project {
  name: string;
  pdfs: PDFMetadata[];
  currentPdfId: string;
  // ... existing fields
}
```

---

## Phase 3: Integrate Template Manager Component

### Current State
- Component exists at `src/components/TemplateManager.tsx`
- Not integrated into main App.tsx

### Implementation Steps

1. **Add Template Manager UI**
   - Add "Manage Templates" button in sidebar
   - Modal for creating/editing templates
   - List of available templates

2. **Template Structure**
   - Define template schema based on JSON schema
   - Allow custom field creation
   - Support nested structures

3. **Template Application**
   - Apply templates to pages
   - Auto-generate forms from templates
   - Validate data against template

4. **Template Storage**
   - Store templates in localStorage
   - Export/import templates
   - Share templates between projects

### Technical Details

```typescript
interface FieldTemplate {
  id: string;
  label: string;
  type: 'string' | 'number' | 'integer' | 'enum' | 'object' | 'array';
  schemaPath: string; // Path in JSON schema
  required: boolean;
  placeholder?: string;
  enum?: string[];
  children?: FieldTemplate[]; // For nested objects
}

interface PageTemplate {
  page: number;
  section: string; // e.g., "I_StudyMetadataAndIdentification"
  fields: FieldTemplate[];
}
```

---

## Phase 4: Implement JSON Schema for Data Extraction

### Implementation Steps

1. **Schema Parser**
   - Parse JSON schema
   - Generate field definitions
   - Create validation rules

2. **Form Generator**
   - Generate forms from schema
   - Support all data types
   - Handle nested structures

3. **Data Model**
   - Implement SourcedString, SourcedNumber, etc.
   - Link highlights to fields
   - Auto-populate source_text and source_location

4. **Validation**
   - Validate against schema
   - Show validation errors
   - Highlight missing required fields

5. **Export**
   - Export in schema-compliant format
   - Include all source traceability
   - Validate before export

### Technical Details

```typescript
interface SourcedValue<T> {
  value: T;
  source_text?: string;
  source_location?: string;
  highlightId?: string; // Link to highlight
}

interface ExtractedData {
  I_StudyMetadataAndIdentification: {
    studyID: SourcedValue<string>;
    authorAndYear: {
      firstAuthor: SourcedValue<string>;
      yearOfPublication: SourcedValue<number>;
    };
    country: SourcedValue<string>;
  };
  // ... other sections
}
```

---

## Phase 5: Enhance Multi-PDF Support

### Implementation Steps

1. **PDF Management**
   - Upload multiple PDFs
   - List all PDFs in project
   - Switch between PDFs

2. **Data Association**
   - Associate data with specific PDF
   - Maintain separate highlights per PDF
   - Merge data from multiple PDFs

3. **Navigation**
   - Quick switch between PDFs
   - Show current PDF name
   - Breadcrumb navigation

4. **Performance**
   - Lazy load PDFs
   - Cache rendered pages
   - Optimize memory usage

---

## Phase 6: Create GitHub Repository Structure

### Directory Structure

```
lector-review/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI/CD pipeline
│       └── deploy.yml          # Deployment workflow
├── public/
│   ├── Kim2016.pdf             # Sample PDF
│   └── favicon.ico             # Favicon
├── src/
│   ├── components/
│   │   ├── HelpModal.tsx
│   │   ├── Loading.tsx
│   │   ├── Modal.tsx
│   │   ├── PDFUpload.tsx
│   │   ├── TemplateManager.tsx
│   │   ├── SchemaForm.tsx      # NEW: Schema-based form
│   │   └── Toast.tsx
│   ├── hooks/
│   │   ├── useDarkMode.ts
│   │   ├── useDebounce.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── usePDFManager.ts    # NEW: PDF management
│   │   └── useUndoRedo.ts
│   ├── utils/
│   │   ├── importExport.ts
│   │   ├── schemaParser.ts     # NEW: Schema parsing
│   │   ├── validation.ts
│   │   └── pdfStorage.ts       # NEW: PDF storage
│   ├── types/
│   │   ├── schema.ts           # NEW: Schema types
│   │   └── index.ts
│   ├── __tests__/
│   │   ├── importExport.test.ts
│   │   ├── schemaParser.test.ts # NEW
│   │   ├── setup.ts
│   │   └── utils.test.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── e2e/
│   ├── basic-features.spec.ts
│   ├── pdf-upload.spec.ts      # NEW
│   ├── schema-extraction.spec.ts # NEW
│   └── project-management.spec.ts
├── docs/
│   ├── API.md                  # API documentation
│   ├── ARCHITECTURE.md         # Architecture overview
│   └── USER_GUIDE.md           # User guide
├── scripts/
│   └── deploy.sh               # Deployment script
├── schema.json                 # JSON schema
├── .gitignore
├── CHANGELOG.md
├── DEPLOYMENT_GUIDE.md
├── E2E_TEST_REPORT.md
├── IMPLEMENTATION_PLAN.md      # This file
├── IMPROVEMENT_STATUS_REPORT.md
├── LICENSE
├── package.json
├── playwright.config.ts
├── README.md
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── vitest.config.ts
```

---

## Phase 7: Create Deployment Script

### Script: `scripts/deploy.sh`

```bash
#!/bin/bash

# Lector Review - One-Click Deployment Script

set -e  # Exit on error

echo "🚀 Lector Review - Deployment Script"
echo "====================================="

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed."; exit 1; }

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Run tests
echo "🧪 Running tests..."
pnpm test

# Build application
echo "🔨 Building application..."
pnpm run build

# Check if gh CLI is available
if command -v gh >/dev/null 2>&1; then
    echo "📤 GitHub CLI detected. Pushing to GitHub..."
    
    # Initialize git if needed
    if [ ! -d ".git" ]; then
        git init
        git add .
        git commit -m "Initial commit: Lector Review Enhanced"
    fi
    
    # Create GitHub repository
    read -p "Enter GitHub repository name (default: lector-review): " REPO_NAME
    REPO_NAME=${REPO_NAME:-lector-review}
    
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
    
    echo "✅ Repository created and pushed to GitHub!"
    echo "🔗 Repository URL: https://github.com/$(gh api user -q .login)/$REPO_NAME"
else
    echo "⚠️  GitHub CLI not found. Skipping GitHub push."
    echo "📝 To push manually:"
    echo "   1. Create a repository on GitHub"
    echo "   2. git remote add origin <repository-url>"
    echo "   3. git push -u origin main"
fi

# Deploy to Vercel (if available)
if command -v vercel >/dev/null 2>&1; then
    read -p "Deploy to Vercel? (y/n): " DEPLOY_VERCEL
    if [ "$DEPLOY_VERCEL" = "y" ]; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
    fi
fi

echo ""
echo "✅ Deployment complete!"
echo "📂 Build output: dist/"
echo "🌐 Ready to deploy to any static hosting service"
```

---

## Phase 8: Documentation

### Documents to Create/Update

1. **README.md** - Main project documentation
2. **API.md** - API documentation for components and hooks
3. **ARCHITECTURE.md** - System architecture overview
4. **USER_GUIDE.md** - Comprehensive user guide
5. **CONTRIBUTING.md** - Contribution guidelines
6. **LICENSE** - MIT License

---

## Implementation Timeline

### Week 1: Core Integration
- Day 1-2: Integrate PDF upload component
- Day 3-4: Integrate template manager
- Day 5: Testing and bug fixes

### Week 2: Schema Implementation
- Day 1-2: Implement schema parser
- Day 3-4: Generate forms from schema
- Day 5: Data validation and export

### Week 3: Multi-PDF and Polish
- Day 1-2: Enhance multi-PDF support
- Day 3: UI/UX improvements
- Day 4-5: Comprehensive testing

### Week 4: Documentation and Deployment
- Day 1-2: Create documentation
- Day 3: Create deployment script
- Day 4: GitHub repository setup
- Day 5: Final testing and release

---

## Success Criteria

### Functionality
- ✅ PDF upload works with multiple files
- ✅ Template manager allows custom field creation
- ✅ Schema-based forms generate correctly
- ✅ Data extraction follows schema structure
- ✅ Source traceability works (highlights → fields)
- ✅ Export produces schema-compliant JSON
- ✅ Multi-PDF support is seamless

### Quality
- ✅ All tests pass (unit + E2E)
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Responsive design works
- ✅ Accessibility standards met
- ✅ Performance is acceptable

### Documentation
- ✅ README is comprehensive
- ✅ User guide is clear
- ✅ API documentation is complete
- ✅ Deployment guide works

### Deployment
- ✅ One-click deployment script works
- ✅ GitHub repository is well-organized
- ✅ CI/CD pipeline is configured
- ✅ Application deploys successfully

---

## Next Steps

After completing this plan:

1. **User Testing**: Gather feedback from researchers
2. **Feature Enhancements**: Based on user feedback
3. **Performance Optimization**: For large PDFs and datasets
4. **Collaboration Features**: Multi-user support
5. **AI Integration**: Auto-extraction using LLMs
6. **Mobile App**: React Native version

---

**Document Version:** 1.0  
**Last Updated:** November 3, 2025  
**Status:** Ready for Implementation
