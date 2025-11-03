# End-to-End Testing Plan - Lector Review Application

**Version:** 2.0.0  
**Date:** November 2025  
**Status:** Ready for Comprehensive Testing

---

## Executive Summary

This document outlines the comprehensive end-to-end testing plan for the Lector Review application. All pending integrations have been completed:

✅ **PDF Upload Component** - Fully integrated  
✅ **Template Manager** - Fully integrated  
✅ **Schema-Based Forms** - Fully integrated  
✅ **Toast Notifications** - Fully integrated  
✅ **Page Navigation** - Using Lector hooks  

---

## Pre-Testing Setup

### 1. Environment Preparation

```bash
# Ensure all dependencies are installed
pnpm install

# Verify TypeScript compilation
pnpm type-check

# Build the application
pnpm build

# Start development server
pnpm dev
```

### 2. Test Data Preparation

**Required Files:**
- `public/Kim2016.pdf` - Sample PDF for testing
- Additional test PDFs (optional, for upload testing)

**Browser Requirements:**
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest) - for macOS testing
- Edge (latest)

### 3. Browser DevTools Setup

**Enable:**
- Console logging
- Network throttling (for slow network testing)
- LocalStorage inspection
- IndexedDB inspection

---

## Test Scenarios

### Phase 1: Application Initialization

#### Test 1.1: Application Load
**Objective:** Verify application loads correctly

**Steps:**
1. Navigate to `http://localhost:5173`
2. Wait for application to load
3. Observe initial state

**Expected Results:**
- ✅ No console errors
- ✅ Toast component renders (even if empty)
- ✅ Left sidebar visible (Project selector, PDF Management, Search)
- ✅ PDF viewer area visible
- ✅ Right sidebar visible (Page navigation, Fields, Highlights)
- ✅ PDF loads and displays (may take 2-5 seconds)

**Pass Criteria:**
- All UI elements render correctly
- No JavaScript errors
- PDF canvas appears

---

#### Test 1.2: PDF Loading
**Objective:** Verify PDF loads from default source

**Steps:**
1. Wait for PDF to load
2. Check page indicator shows "1 / 9" (or correct total pages)
3. Verify PDF content is visible

**Expected Results:**
- ✅ PDF renders in viewer
- ✅ Page indicator shows correct current/total pages
- ✅ Canvas element visible
- ✅ No "Loading..." stuck state

**Pass Criteria:**
- PDF content visible within 5 seconds
- Page indicator accurate

---

### Phase 2: Project Management

#### Test 2.1: Create New Project
**Objective:** Verify project creation works

**Steps:**
1. Click "+" button next to project selector
2. Enter project name in prompt: "test-project-1"
3. Click OK

**Expected Results:**
- ✅ Toast notification: "Project 'test-project-1' created"
- ✅ Project selector shows new project
- ✅ Current project switches to new project
- ✅ Form fields are empty (new project)
- ✅ Highlights list is empty

**Pass Criteria:**
- Project created successfully
- Toast appears
- UI updates correctly

---

#### Test 2.2: Switch Between Projects
**Objective:** Verify project switching preserves data

**Steps:**
1. In "default" project, enter data in Study ID field: "10.1234/test"
2. Navigate to page 2
3. Switch to "test-project-1"
4. Verify data is different
5. Switch back to "default"
6. Verify original data persists

**Expected Results:**
- ✅ Data persists per project
- ✅ Current page resets per project
- ✅ Highlights are project-specific
- ✅ Templates are project-specific

**Pass Criteria:**
- Data isolation between projects works
- No data leakage between projects

---

#### Test 2.3: Delete Project
**Objective:** Verify project deletion works

**Steps:**
1. Create a test project: "delete-test"
2. Add some data to it
3. Switch to "default" project
4. Switch back to "delete-test"
5. Click "🗑" button
6. Confirm deletion in prompt

**Expected Results:**
- ✅ Toast notification: "Project 'delete-test' deleted"
- ✅ Project removed from selector
- ✅ Switches to "default" project
- ✅ Project data removed from localStorage

**Pass Criteria:**
- Project deleted successfully
- Cannot delete "default" project
- Data cleanup works

---

### Phase 3: PDF Upload & Management

#### Test 3.1: Upload PDF File
**Objective:** Verify PDF upload functionality

**Steps:**
1. Locate PDF upload area in left sidebar
2. Click "Click or drag PDF here" area
3. Select a PDF file from file system
4. Wait for upload to complete

**Expected Results:**
- ✅ Toast notification: "PDF '[filename]' uploaded successfully"
- ✅ PDF appears in PDF list below upload area
- ✅ PDF is selected automatically
- ✅ PDF loads in viewer
- ✅ URL input is disabled (grayed out)

**Pass Criteria:**
- Upload completes successfully
- PDF appears in list
- PDF loads in viewer

---

#### Test 3.2: Upload via Drag & Drop
**Objective:** Verify drag-and-drop upload

**Steps:**
1. Drag a PDF file from file explorer
2. Drop it on the upload area
3. Wait for upload

**Expected Results:**
- ✅ Upload area highlights during drag
- ✅ File uploads on drop
- ✅ Toast notification appears
- ✅ PDF appears in list

**Pass Criteria:**
- Drag-and-drop works
- Visual feedback during drag

---

#### Test 3.3: Select Different PDF
**Objective:** Verify PDF switching

**Steps:**
1. Upload multiple PDFs
2. Click on a different PDF in the list
3. Verify PDF switches

**Expected Results:**
- ✅ Toast notification: "PDF selected"
- ✅ Viewer updates to show new PDF
- ✅ Page indicator updates
- ✅ Highlights/fields remain project-specific

**Pass Criteria:**
- PDF switching works
- No data loss

---

#### Test 3.4: Delete PDF
**Objective:** Verify PDF deletion

**Steps:**
1. Upload a PDF
2. Click delete button (trash icon) next to PDF
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Toast notification: "PDF deleted"
- ✅ PDF removed from list
- ✅ If deleted PDF was current, another PDF selected or URL input enabled

**Pass Criteria:**
- Deletion works
- Cleanup successful

---

#### Test 3.5: URL-Based PDF Loading
**Objective:** Verify URL fallback works

**Steps:**
1. Ensure no PDF is uploaded (or delete all)
2. Enter URL in "Or load from URL" field: "/Kim2016.pdf"
3. Wait for PDF to load

**Expected Results:**
- ✅ PDF loads from URL
- ✅ Page indicator shows correct pages
- ✅ PDF content visible

**Pass Criteria:**
- URL loading works
- Fallback mechanism functional

---

### Phase 4: Page Navigation

#### Test 4.1: Navigate with Buttons
**Objective:** Verify page navigation buttons

**Steps:**
1. Start on page 1
2. Click "▶" (next) button
3. Click "◀" (previous) button
4. Use keyboard arrows (← →)

**Expected Results:**
- ✅ Page indicator updates: "2 / 9", "1 / 9"
- ✅ PDF content updates
- ✅ Buttons disabled at boundaries (page 1 prev disabled, last page next disabled)
- ✅ Keyboard navigation works

**Pass Criteria:**
- Navigation buttons work
- Boundaries enforced
- Keyboard shortcuts work

---

#### Test 4.2: Jump to Page from Highlights
**Objective:** Verify highlight navigation

**Steps:**
1. Create a highlight on page 3
2. Scroll to highlights list
3. Click "Go" button on highlight

**Expected Results:**
- ✅ PDF navigates to page 3
- ✅ Page indicator shows "3 / 9"
- ✅ Highlight is visible on page

**Pass Criteria:**
- Highlight navigation works
- Page jump accurate

---

### Phase 5: Template Forms

#### Test 5.1: Enter Data in Template Fields
**Objective:** Verify template-based data entry

**Steps:**
1. Ensure on page 1 (Study ID page)
2. Enter data in "Study ID (DOI/PMID)" field: "10.1234/test.2024"
3. Enter data in "First Author" field: "Smith"
4. Enter data in "Year of Publication" field: "2024"
5. Navigate to page 2
6. Enter data in "Study Design" field: "Randomized Controlled Trial"
7. Navigate back to page 1

**Expected Results:**
- ✅ Data persists in fields
- ✅ Different fields per page
- ✅ Data saves to localStorage automatically
- ✅ No data loss on navigation

**Pass Criteria:**
- Data entry works
- Per-page templates work
- Persistence works

---

#### Test 5.2: Add Custom Field
**Objective:** Verify dynamic field addition

**Steps:**
1. Navigate to any page
2. Click "+ field" button
3. Enter field label: "Custom Field"
4. Verify field appears

**Expected Results:**
- ✅ Prompt appears for field label
- ✅ Field added to template
- ✅ Field appears in form
- ✅ Field persists across page navigation

**Pass Criteria:**
- Field addition works
- Persistence works

---

#### Test 5.3: Template Manager - Add Field
**Objective:** Verify Template Manager functionality

**Steps:**
1. Click "Manage Templates" button
2. Verify modal opens
3. Select "Page 1" from dropdown
4. Click "+ Add Field"
5. Enter field label: "New Field"
6. Save template

**Expected Results:**
- ✅ Modal opens
- ✅ Page selector works
- ✅ Add field modal appears
- ✅ Field added to template
- ✅ Toast notification: "Templates saved"
- ✅ Modal closes
- ✅ Form updates with new field

**Pass Criteria:**
- Template Manager works
- Field addition works
- Persistence works

---

#### Test 5.4: Template Manager - Edit Field
**Objective:** Verify field editing

**Steps:**
1. Open Template Manager
2. Select a page with fields
3. Edit a field label
4. Change field type (if applicable)
5. Save

**Expected Results:**
- ✅ Field label updates
- ✅ Changes persist
- ✅ Form updates reflect changes

**Pass Criteria:**
- Field editing works
- Changes persist

---

#### Test 5.5: Template Manager - Remove Field
**Objective:** Verify field removal

**Steps:**
1. Open Template Manager
2. Select a page with fields
3. Click "✕" on a field
4. Confirm deletion
5. Save

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Field removed
- ✅ Form updates
- ✅ Data for removed field preserved (in pageForm)

**Pass Criteria:**
- Field removal works
- Confirmation works

---

#### Test 5.6: Template Manager - Copy to All Pages
**Objective:** Verify template copying

**Steps:**
1. Open Template Manager
2. Select page 1
3. Add/modify fields
4. Click "📋 Copy to All"
5. Confirm
6. Save
7. Navigate through pages

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Template copied to all pages
- ✅ All pages show same fields
- ✅ Existing templates overwritten

**Pass Criteria:**
- Copy functionality works
- All pages updated

---

### Phase 6: Schema-Based Forms

#### Test 6.1: Switch to Schema Form
**Objective:** Verify form type toggle

**Steps:**
1. Locate "Template Form" / "Schema Form" toggle buttons
2. Click "Schema Form" button

**Expected Results:**
- ✅ "Schema Form" button highlights (blue)
- ✅ "Template Form" button becomes gray
- ✅ Schema form renders
- ✅ Sections appear (collapsible)
- ✅ Fields organized by schema sections

**Pass Criteria:**
- Toggle works
- Schema form renders
- Sections visible

---

#### Test 6.2: Enter Data in Schema Form
**Objective:** Verify schema-based data entry

**Steps:**
1. Switch to Schema Form
2. Expand "I. Study Metadata and Identification" section
3. Enter data in "Study ID" field
4. Enter data in other fields
5. Expand other sections
6. Enter data

**Expected Results:**
- ✅ Fields accept input
- ✅ Sourced fields show source text/location inputs
- ✅ Enum fields show dropdowns
- ✅ Number fields validate numeric input
- ✅ Data persists

**Pass Criteria:**
- Schema form works
- Field types render correctly
- Data entry works

---

#### Test 6.3: Link Highlight to Field
**Objective:** Verify highlight linking

**Steps:**
1. Switch to Schema Form
2. Select text in PDF (create highlight)
3. Click "🔗 Link" button next to a sourced field
4. Verify highlight links

**Expected Results:**
- ✅ Link button appears for sourced fields
- ✅ Clicking link shows toast: "Link highlight to field: [path]"
- ✅ Source text populated from highlight (if implemented)
- ✅ Source location populated

**Pass Criteria:**
- Link functionality works
- Toast notifications appear

---

#### Test 6.4: Schema Form Sections
**Objective:** Verify collapsible sections

**Steps:**
1. Switch to Schema Form
2. Click on section headers
3. Verify expand/collapse

**Expected Results:**
- ✅ Sections collapse/expand
- ✅ Chevron icon rotates
- ✅ Fields hide/show correctly

**Pass Criteria:**
- Sections work
- Expand/collapse works

---

### Phase 7: Highlighting Features

#### Test 7.1: Create Highlight from Text Selection
**Objective:** Verify text selection highlighting

**Steps:**
1. Select text in PDF
2. Verify "📝 Highlight Selected Text" button appears
3. Click button
4. Enter label in prompt: "Important finding"
5. Click OK

**Expected Results:**
- ✅ Selection detected
- ✅ Button appears (bottom-right)
- ✅ Prompt appears
- ✅ Toast notification: "Highlight added"
- ✅ Highlight appears in highlights list
- ✅ Highlight renders on PDF (green)

**Pass Criteria:**
- Text selection works
- Highlight creation works
- Visual rendering works

---

#### Test 7.2: View Highlights List
**Objective:** Verify highlights display

**Steps:**
1. Create multiple highlights
2. Scroll to highlights list in right sidebar
3. Verify all highlights appear

**Expected Results:**
- ✅ All highlights listed
- ✅ User highlights show green dot
- ✅ Search highlights show yellow dot
- ✅ Labels visible
- ✅ Page numbers visible

**Pass Criteria:**
- Highlights list works
- Visual indicators correct

---

#### Test 7.3: Edit Highlight
**Objective:** Verify highlight editing

**Steps:**
1. Create a highlight
2. Click "✏" button on highlight
3. Enter new label: "Updated label"
4. Click OK

**Expected Results:**
- ✅ Prompt appears with current label
- ✅ Toast notification: "Highlight updated"
- ✅ Label updates in list
- ✅ Highlight still renders

**Pass Criteria:**
- Editing works
- Updates persist

---

#### Test 7.4: Delete Highlight
**Objective:** Verify highlight deletion

**Steps:**
1. Create a highlight
2. Click "✕" button on highlight

**Expected Results:**
- ✅ Toast notification: "Highlight deleted"
- ✅ Highlight removed from list
- ✅ Highlight removed from PDF

**Pass Criteria:**
- Deletion works
- Visual removal works

---

#### Test 7.5: Search Functionality
**Objective:** Verify PDF search

**Steps:**
1. Enter search term in search box: "stroke"
2. Wait for search to complete
3. Verify search results

**Expected Results:**
- ✅ Search debounced (500ms)
- ✅ Results count appears: "Found X matches"
- ✅ Search highlights appear (yellow)
- ✅ Search highlights listed in highlights list

**Pass Criteria:**
- Search works
- Debouncing works
- Visual highlighting works

---

#### Test 7.6: Clear Search
**Objective:** Verify search clearing

**Steps:**
1. Perform a search
2. Clear search input
3. Verify highlights clear

**Expected Results:**
- ✅ Search highlights removed
- ✅ User highlights remain
- ✅ Results count disappears

**Pass Criteria:**
- Search clearing works
- Highlights cleanup works

---

### Phase 8: Export Functionality

#### Test 8.1: Export JSON
**Objective:** Verify JSON export

**Steps:**
1. Enter data in multiple fields
2. Create highlights
3. Click "Export JSON" button
4. Verify file downloads
5. Open downloaded file

**Expected Results:**
- ✅ Toast notification: "Data exported as JSON"
- ✅ File downloads: `[project]_export_[timestamp].json`
- ✅ File contains:
  - Project name
  - PDF source (blob URL or static URL)
  - Highlights array
  - Templates object
  - pageForm object
  - exportedAt timestamp

**Pass Criteria:**
- Export works
- File format correct
- All data included

---

#### Test 8.2: Export CSV
**Objective:** Verify CSV export

**Steps:**
1. Enter data in fields
2. Create highlights
3. Click "Export CSV" button
4. Verify file downloads
5. Open downloaded file

**Expected Results:**
- ✅ Toast notification: "Data exported as CSV"
- ✅ File downloads: `[project]_export_[timestamp].csv`
- ✅ CSV format correct
- ✅ Headers present
- ✅ Data rows present
- ✅ Highlights included

**Pass Criteria:**
- CSV export works
- Format correct
- Data complete

---

#### Test 8.3: Export with Schema Data
**Objective:** Verify schema-formatted export

**Steps:**
1. Switch to Schema Form
2. Enter data
3. Export JSON
4. Verify schema structure

**Expected Results:**
- ✅ Export includes schema-structured data
- ✅ Sourced values include source_text and source_location
- ✅ Data organized by schema sections

**Pass Criteria:**
- Schema export works
- Structure correct

---

### Phase 9: Toast Notifications

#### Test 9.1: Toast Appearances
**Objective:** Verify toast notifications appear

**Actions to test:**
- Create project → Success toast
- Delete project → Success toast
- Upload PDF → Success toast
- Delete PDF → Success toast
- Add highlight → Success toast
- Export JSON → Success toast
- Export CSV → Success toast
- Save templates → Success toast

**Expected Results:**
- ✅ Toast appears top-right
- ✅ Correct color (green for success)
- ✅ Message clear
- ✅ Auto-dismisses after 3 seconds

**Pass Criteria:**
- All actions show toasts
- Auto-dismiss works

---

#### Test 9.2: Toast Dismissal
**Objective:** Verify toast can be dismissed

**Steps:**
1. Trigger an action that shows toast
2. Click toast or X button
3. Verify toast disappears

**Expected Results:**
- ✅ Toast dismisses on click
- ✅ Animation smooth

**Pass Criteria:**
- Manual dismissal works

---

### Phase 10: Error Handling & Edge Cases

#### Test 10.1: Invalid PDF Upload
**Objective:** Verify error handling for invalid files

**Steps:**
1. Try to upload non-PDF file
2. Try to upload PDF > 50MB

**Expected Results:**
- ✅ Error toast appears
- ✅ File rejected
- ✅ Upload area remains functional

**Pass Criteria:**
- Validation works
- Error messages clear

---

#### Test 10.2: Invalid URL
**Objective:** Verify error handling for invalid PDF URLs

**Steps:**
1. Enter invalid URL in PDF source field
2. Wait for load attempt

**Expected Results:**
- ✅ Error handling (if implemented)
- ✅ No crash
- ✅ User can correct

**Pass Criteria:**
- No crashes
- Graceful failure

---

#### Test 10.3: Empty Project Data
**Objective:** Verify handling of empty projects

**Steps:**
1. Create new project
2. Don't enter any data
3. Export JSON/CSV

**Expected Results:**
- ✅ Export succeeds
- ✅ Empty arrays/objects in export
- ✅ No errors

**Pass Criteria:**
- Empty data handled
- Export works

---

#### Test 10.4: Large Data Sets
**Objective:** Verify performance with large data

**Steps:**
1. Create many highlights (50+)
2. Enter data in many fields
3. Navigate through pages
4. Export

**Expected Results:**
- ✅ No performance degradation
- ✅ UI remains responsive
- ✅ Export works

**Pass Criteria:**
- Performance acceptable
- No crashes

---

### Phase 11: Browser Compatibility

#### Test 11.1: Chrome/Chromium
**Steps:**
- Run all Phase 1-10 tests in Chrome

**Expected Results:**
- ✅ All features work
- ✅ No browser-specific errors

---

#### Test 11.2: Firefox
**Steps:**
- Run all Phase 1-10 tests in Firefox

**Expected Results:**
- ✅ All features work
- ✅ IndexedDB works
- ✅ PDF.js works

---

#### Test 11.3: Safari (if available)
**Steps:**
- Run all Phase 1-10 tests in Safari

**Expected Results:**
- ✅ All features work
- ✅ No Safari-specific issues

---

### Phase 12: Performance Testing

#### Test 12.1: Initial Load Time
**Steps:**
1. Open browser DevTools
2. Navigate to app
3. Measure time to interactive

**Expected Results:**
- ✅ Loads within 3 seconds
- ✅ PDF renders within 5 seconds

---

#### Test 12.2: Data Entry Performance
**Steps:**
1. Rapidly enter data in multiple fields
2. Verify no lag

**Expected Results:**
- ✅ Input responsive
- ✅ No lag or stuttering

---

#### Test 12.3: Search Performance
**Steps:**
1. Perform multiple searches rapidly
2. Verify debouncing works

**Expected Results:**
- ✅ Debouncing prevents excessive searches
- ✅ Search completes within 1 second

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Dependencies installed (`pnpm install`)
- [ ] Application builds (`pnpm build`)
- [ ] Dev server starts (`pnpm dev`)
- [ ] Test PDFs available
- [ ] Browser DevTools open

### Test Execution
- [ ] Phase 1: Application Initialization
- [ ] Phase 2: Project Management
- [ ] Phase 3: PDF Upload & Management
- [ ] Phase 4: Page Navigation
- [ ] Phase 5: Template Forms
- [ ] Phase 6: Schema-Based Forms
- [ ] Phase 7: Highlighting Features
- [ ] Phase 8: Export Functionality
- [ ] Phase 9: Toast Notifications
- [ ] Phase 10: Error Handling & Edge Cases
- [ ] Phase 11: Browser Compatibility
- [ ] Phase 12: Performance Testing

### Post-Test
- [ ] Document any issues found
- [ ] Verify all features work
- [ ] Check console for errors
- [ ] Verify localStorage/IndexedDB data

---

## Expected Test Results Summary

| Feature Category | Tests | Expected Pass Rate |
|-----------------|-------|-------------------|
| Application Init | 2 | 100% |
| Project Management | 3 | 100% |
| PDF Upload | 5 | 100% |
| Page Navigation | 2 | 100% |
| Template Forms | 6 | 100% |
| Schema Forms | 4 | 100% |
| Highlighting | 6 | 100% |
| Export | 3 | 100% |
| Toast Notifications | 2 | 100% |
| Error Handling | 4 | 100% |
| Browser Compatibility | 3 | 100% |
| Performance | 3 | 100% |
| **TOTAL** | **43** | **100%** |

---

## Known Limitations & Workarounds

### 1. PDF Loading Delay
**Issue:** PDF may take 2-5 seconds to load initially  
**Workaround:** Wait for canvas to appear, check page indicator  
**Status:** Expected behavior

### 2. IndexedDB in Private Browsing
**Issue:** Some browsers block IndexedDB in private mode  
**Workaround:** Use normal browsing mode or URL-based PDFs  
**Status:** Browser limitation

### 3. Large PDF Performance
**Issue:** PDFs > 100 pages may be slower  
**Workaround:** Optimize PDF or use smaller files for testing  
**Status:** Expected behavior

---

## Reporting Issues

When reporting issues, include:
1. **Browser:** Chrome/Firefox/Safari/Edge + version
2. **OS:** Windows/macOS/Linux + version
3. **Steps to Reproduce:** Detailed steps
4. **Expected Behavior:** What should happen
5. **Actual Behavior:** What actually happened
6. **Console Errors:** Any JavaScript errors
7. **Screenshots:** If applicable

---

## Next Steps After Testing

1. **Fix any issues found**
2. **Update E2E test suite** with new test cases
3. **Run automated E2E tests:** `pnpm test:e2e`
4. **Deploy to staging** for additional testing
5. **Deploy to production** when all tests pass

---

**Document Version:** 1.0  
**Last Updated:** November 2025  
**Maintained By:** Lector Review Team
