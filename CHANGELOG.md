# Lector Review Application - Changelog

This document details all the improvements, new features, and bug fixes implemented in the Lector Review application.

## Immediate Priority Fixes (Phase 1)

These fixes address critical issues identified during the initial testing phase.

- **Search Debouncing:** Implemented a 500ms debounce on the search input to prevent performance degradation from rapid typing.
- **Toast Notifications:** Added a non-intrusive toast notification system to provide feedback for user actions (e.g., project creation, export success/failure).
- **Custom Modals:** Replaced all native browser prompts (`alert`, `prompt`, `confirm`) with custom, styled modals for a more consistent and professional user experience.
- **Improved Export Functionality:** Refactored the JSON and CSV export functions to include error handling and provide user feedback on success or failure.
- **General Error Handling:** Added `try...catch` blocks to critical functions to prevent application crashes and provide meaningful error messages.

## Medium Priority Enhancements (Phase 2)

These enhancements focus on improving the user experience and adding quality-of-life features.

- **Loading Indicators:** Implemented loading indicators for long-running operations like exporting data to provide visual feedback to the user.
- **Undo/Redo Functionality:** Added undo/redo functionality for data entry in the form fields, allowing users to easily revert or re-apply changes.
- **Keyboard Shortcuts:** Implemented a comprehensive set of keyboard shortcuts for common actions, including:
    - `Ctrl+Z` / `Ctrl+Y`: Undo/Redo
    - `Ctrl+F`: Focus search input
    - `ArrowLeft` / `ArrowRight`: Previous/Next page
    - `Ctrl+Shift+E` / `Ctrl+E`: Export JSON/CSV
    - `Ctrl+N`: New project
    - `Shift+?`: Show help
- **Field Validation:** Added basic validation for specific fields in the default templates (e.g., year, number, percentage).
- **Help Modal:** Created a help modal that provides an overview of the application's features and a list of all available keyboard shortcuts.

## Long-Term Improvements (Phase 3)

These are major new features that significantly expand the application's capabilities.

- **PDF Upload:** Implemented a PDF upload feature, allowing users to load their own PDF files into the application.
- **Template Manager:** Created a template manager that allows users to:
    - Add, remove, and edit fields for each page.
    - Copy a template from one page to all other pages.
- **Enhanced Import/Export:**
    - **Project Import/Export:** Added the ability to import and export individual projects as JSON files.
    - **All Projects Backup:** Implemented a feature to back up and restore all projects in a single JSON file.
    - **Summary Report:** Added a feature to generate and export a summary of the extracted data in Markdown format.

## Testing (Phase 4)

- **Unit and Integration Tests:** Created a comprehensive test suite using Vitest and React Testing Library to ensure the quality and stability of the application.
- **Test Coverage:** The test suite covers utility functions, validation logic, and import/export functionality.
- **Test Scripts:** Added `test`, `test:ui`, and `test:coverage` scripts to `package.json` for easy test execution.
