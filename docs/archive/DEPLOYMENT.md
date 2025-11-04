# Deployment Guide - Lector Review

## Quick Start

### Development Server

```bash
# Start the development server
pnpm run dev

# The application will be available at http://localhost:5173
```

### Production Build

```bash
# Build for production
pnpm run build

# The output will be in the `dist/` directory
# Preview the production build locally
pnpm run preview
```

## Deployment Options

### 1. Static Hosting (Recommended)

Since this is a pure frontend application, you can deploy it to any static hosting service.

#### Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

#### Netlify

```bash
# Install Netlify CLI
pnpm add -g netlify-cli

# Build and deploy
pnpm run build
netlify deploy --prod --dir=dist
```

Or drag and drop the `dist/` folder to [Netlify Drop](https://app.netlify.com/drop).

#### GitHub Pages

1. Build the project:
   ```bash
   pnpm run build
   ```

2. Push the `dist/` directory to the `gh-pages` branch:
   ```bash
   git subtree push --prefix dist origin gh-pages
   ```

3. Enable GitHub Pages in your repository settings

#### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `pnpm run build`
3. Set build output directory: `dist`
4. Deploy

### 2. Docker Deployment

Create a `Dockerfile`:

```dockerfile
# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t lector-review .
docker run -p 80:80 lector-review
```

### 3. Self-Hosted with Nginx

1. Build the project:
   ```bash
   pnpm run build
   ```

2. Copy the `dist/` directory to your web server:
   ```bash
   scp -r dist/* user@server:/var/www/lector-review/
   ```

3. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       root /var/www/lector-review;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Enable gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

4. Reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Environment Configuration

### Base URL

If deploying to a subdirectory, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-subdirectory/',
  // ... rest of config
});
```

### PDF Source

Update the default PDF source in `src/App.tsx`:

```typescript
const [source, setSource] = useState<string>("https://your-domain.com/sample.pdf");
```

## CORS Considerations

If loading PDFs from external URLs, ensure the server has proper CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, OPTIONS
```

For Nginx:

```nginx
location /pdfs/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
}
```

## Performance Optimization

### 1. Enable Compression

Most hosting platforms enable this by default. For self-hosted:

**Nginx**:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
gzip_min_length 1000;
```

### 2. Cache Static Assets

**Nginx**:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Optimize PDF Loading

- Compress PDFs before uploading
- Use linearized PDFs for faster initial display
- Consider using a CDN for PDF hosting

## Security Considerations

### 1. Content Security Policy

Add CSP headers to prevent XSS attacks:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";
```

### 2. HTTPS

Always use HTTPS in production. Most hosting platforms provide free SSL certificates via Let's Encrypt.

For self-hosted with Certbot:

```bash
sudo certbot --nginx -d your-domain.com
```

### 3. Data Privacy

Since all data is stored in browser localStorage:
- Data never leaves the user's browser
- No server-side storage or tracking
- Users should be informed about local data storage
- Provide a way to export/clear data

## Monitoring

### Error Tracking

Consider adding error tracking:

```bash
pnpm add @sentry/react
```

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

### Analytics

Add privacy-friendly analytics if needed:

```bash
pnpm add @vercel/analytics
```

```typescript
import { Analytics } from '@vercel/analytics/react';

function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

## Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm run build
```

### PDF.js Worker Issues

Ensure the worker file is correctly referenced:

```typescript
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();
```

### Routing Issues (404 on Refresh)

Ensure your hosting platform is configured for SPA routing:

**Vercel** (`vercel.json`):
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**Netlify** (`netlify.toml`):
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Scaling Considerations

Since this is a client-side application:
- No server scaling needed
- CDN can handle any traffic level
- Consider PDF hosting separately for large files
- Use lazy loading for large PDF documents

## Backup and Recovery

### User Data Backup

Educate users to:
1. Regularly export projects to JSON
2. Store exports in a safe location
3. Use browser sync if available

### Application Backup

1. Keep the source code in version control (Git)
2. Tag releases for easy rollback
3. Maintain deployment history on your hosting platform

## Updates and Maintenance

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update dependencies
pnpm update

# Test after updates
pnpm run build
pnpm run preview
```

### Security Updates

```bash
# Check for security vulnerabilities
pnpm audit

# Fix automatically if possible
pnpm audit fix
```

## Support

For deployment issues:
1. Check the hosting platform's documentation
2. Review build logs for errors
3. Test the production build locally first
4. Ensure all environment variables are set correctly
