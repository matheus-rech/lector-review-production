# Quick Start Guide

## Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ or 20+
- pnpm (or npm)

### Installation

```bash
# Extract the package
tar -xzf lector-review-final-github-ready.tar.gz
cd lector-review

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`

### First Steps

1. **View the Sample PDF**
   - The app loads with a sample research paper (Kim2016.pdf)
   - Navigate through pages using the arrow buttons or keyboard shortcuts (← →)

2. **Extract Data**
   - Fill in the extraction fields on the left sidebar
   - Data is automatically saved to localStorage
   - Use Ctrl+Z/Ctrl+Y for undo/redo

3. **Highlight Text**
   - Select text in the PDF
   - Click the "Highlight" button that appears
   - View your highlights in the sidebar

4. **Search**
   - Use the search box to find text in the PDF
   - Results are highlighted in yellow
   - Use Ctrl+F to focus the search box

5. **Export Data**
   - Click "Export JSON" for structured data
   - Click "Export CSV" for spreadsheet-compatible format
   - Files are downloaded to your Downloads folder

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+F` | Focus search |
| `Ctrl+→` | Next page |
| `Ctrl+←` | Previous page |
| `Ctrl+E` | Export CSV |
| `Ctrl+Shift+E` | Export JSON |
| `Ctrl+N` | New project |
| `Ctrl+D` | Toggle dark mode |
| `Ctrl+H` | Show help |

### Dark Mode

Click the 🌙/☀️ button in the top-left corner or press `Ctrl+D`

### Multiple Projects

1. Click the "+" button next to the project dropdown
2. Enter a project name
3. Switch between projects using the dropdown
4. Each project has its own data and highlights

### Build for Production

```bash
# Build the application
pnpm build

# Preview the production build
pnpm preview
```

The production files will be in the `dist/` directory.

### Deploy to GitHub

```bash
# Run the deployment script
./scripts/deploy.sh
```

This will:
- Install dependencies
- Run tests
- Build the application
- Create a GitHub repository (if gh CLI is available)
- Push to GitHub

### Troubleshooting

#### PDF Not Loading
- Check that `/Kim2016.pdf` exists in the `public/` directory
- Clear browser cache and reload
- Check browser console for errors

#### Data Not Saving
- Check browser localStorage is enabled
- Try a different browser
- Check browser console for errors

#### Build Errors
- Delete `node_modules/` and run `pnpm install` again
- Clear pnpm cache: `pnpm store prune`
- Check Node.js version: `node --version` (should be 18+)

### Next Steps

- Read [README.md](./README.md) for full documentation
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment options
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines
- Review [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for integration roadmap

### Support

- 📖 Documentation: See `docs/` directory
- 🐛 Issues: Create an issue on GitHub
- 💬 Questions: Use GitHub Discussions

---

**Happy systematic reviewing!** 🎉
