# Deployment Guide - Lector Review (Enhanced)

This guide provides step-by-step instructions for deploying the Lector Review application to production.

## Prerequisites

- Node.js 18+ installed
- pnpm 8+ installed
- Git (for version control)
- Access to a static hosting service (Vercel, Netlify, GitHub Pages, etc.)

## Quick Start

### 1. Extract the Package

```bash
tar -xzf lector-review-production.tar.gz
cd lector-review
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Tests

```bash
# Run unit tests
pnpm test

# Run E2E tests (optional, requires browser)
pnpm test:e2e
```

### 4. Build for Production

```bash
pnpm run build
```

This creates an optimized production build in the `dist/` directory.

### 5. Test the Production Build Locally

```bash
pnpm run preview
```

Visit http://localhost:4173 to test the production build.

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel deploy
   ```

3. **Follow the prompts** to configure your project

4. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build the project:**
   ```bash
   pnpm run build
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod --dir=dist
   ```

### Option 3: GitHub Pages

1. **Install gh-pages:**
   ```bash
   pnpm add -D gh-pages
   ```

2. **Add deploy script to package.json:**
   ```json
   {
     "scripts": {
       "deploy": "pnpm run build && gh-pages -d dist"
     }
   }
   ```

3. **Deploy:**
   ```bash
   pnpm run deploy
   ```

### Option 4: Static Hosting (AWS S3, Azure, etc.)

1. **Build the project:**
   ```bash
   pnpm run build
   ```

2. **Upload the `dist/` directory** to your static hosting service

3. **Configure routing** to serve `index.html` for all routes

## Configuration

### Base URL

If deploying to a subdirectory, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-subdirectory/',
  // ...
});
```

### PDF Source

The default PDF is located at `/Kim2016.pdf` in the public directory. To use a different PDF:

1. Place your PDF in the `public/` directory
2. Update the default source in `src/App.tsx`:
   ```typescript
   const [source, setSource] = useState("/your-pdf.pdf");
   ```

## Environment Variables

This application runs entirely in the browser and does not require environment variables.

## Performance Optimization

### Enable Compression

Most hosting services automatically enable gzip/brotli compression. If deploying to a custom server, ensure compression is enabled for:
- `.js` files
- `.css` files
- `.html` files

### CDN Configuration

For optimal performance, configure your CDN to:
- Cache static assets (JS, CSS, images) for 1 year
- Cache `index.html` for a short duration (5 minutes)
- Enable HTTP/2 or HTTP/3

### Service Worker (Optional)

To enable offline support, add a service worker:

```bash
pnpm add -D vite-plugin-pwa
```

Update `vite.config.ts`:

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Lector Review',
        short_name: 'Lector',
        description: 'PDF review and data extraction tool',
        theme_color: '#3b82f6',
      },
    }),
  ],
});
```

## Monitoring & Analytics

### Error Tracking

Consider integrating error tracking:

1. **Sentry:**
   ```bash
   pnpm add @sentry/react
   ```

2. **Configure in `src/main.tsx`:**
   ```typescript
   import * as Sentry from "@sentry/react";

   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: "production",
   });
   ```

### Analytics

Add analytics to track usage:

1. **Google Analytics:**
   ```bash
   pnpm add react-ga4
   ```

2. **Configure in `src/main.tsx`:**
   ```typescript
   import ReactGA from "react-ga4";

   ReactGA.initialize("YOUR_GA_ID");
   ```

## Security Considerations

### Content Security Policy

Add a CSP header to your hosting configuration:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;
```

### HTTPS

Ensure your application is served over HTTPS. Most modern hosting services provide this automatically.

## Troubleshooting

### PDF Not Loading

**Issue:** PDF shows "Loading..." indefinitely

**Solutions:**
1. Ensure the PDF file is in the `public/` directory
2. Check browser console for errors
3. Verify the PDF path is correct
4. Try a different PDF to rule out file corruption

### Dark Mode Not Persisting

**Issue:** Dark mode resets on page reload

**Solutions:**
1. Check that localStorage is enabled in the browser
2. Verify the domain is not blocking localStorage
3. Check browser privacy settings

### Export Not Working

**Issue:** Export buttons don't download files

**Solutions:**
1. Check browser download settings
2. Ensure pop-ups are not blocked
3. Verify the browser supports the Blob API

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] PDF renders properly
- [ ] All features work (navigation, search, export)
- [ ] Dark mode toggles correctly
- [ ] Keyboard shortcuts function
- [ ] Data persists in localStorage
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] Performance is acceptable (< 3s initial load)
- [ ] Analytics/monitoring is configured (if applicable)

## Maintenance

### Updating the Application

1. **Pull latest changes:**
   ```bash
   git pull origin main
   ```

2. **Install new dependencies:**
   ```bash
   pnpm install
   ```

3. **Run tests:**
   ```bash
   pnpm test
   ```

4. **Build and deploy:**
   ```bash
   pnpm run build
   vercel --prod  # or your deployment command
   ```

### Monitoring

Regularly check:
- Error logs (if error tracking is configured)
- User feedback
- Browser compatibility
- Performance metrics

## Support

For issues or questions:
- Check the README.md for usage instructions
- Review the E2E_TEST_REPORT.md for known issues
- Open an issue on GitHub

---

**Last Updated:** November 3, 2025  
**Version:** 0.0.1 (Enhanced)
