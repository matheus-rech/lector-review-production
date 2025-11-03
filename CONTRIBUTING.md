# Contributing to Lector Review

Thank you for your interest in contributing to Lector Review! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- **Clear use case**
- **Expected behavior**
- **Potential implementation approach**
- **Mockups or examples** (if applicable)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes**
   ```bash
   pnpm test
   pnpm test:e2e
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   
   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation changes
   - `style:` Code style changes (formatting, etc.)
   - `refactor:` Code refactoring
   - `test:` Adding or updating tests
   - `chore:` Maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of the changes
   - Reference any related issues
   - Include screenshots for UI changes

## Development Setup

### Prerequisites
- Node.js 18+ or 20+
- pnpm (recommended)

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/lector-review.git
cd lector-review

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/lector-review.git

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Development Workflow

```bash
# Run tests in watch mode
pnpm test:watch

# Run linter
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build
```

## Code Style

- **TypeScript**: Use TypeScript for all new code
- **Formatting**: Code is automatically formatted with Prettier
- **Linting**: Follow ESLint rules
- **Components**: Use functional components with hooks
- **Naming**: Use descriptive names (camelCase for variables, PascalCase for components)

## Testing Guidelines

### Unit Tests
- Write tests for utility functions
- Test edge cases and error handling
- Aim for high code coverage

### E2E Tests
- Test critical user flows
- Test across different browsers
- Include accessibility tests

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { formatFileSize } from './pdfStorage';

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });
});
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for complex functions
- Update CHANGELOG.md for notable changes
- Create/update wiki pages for major features

## Project Structure

```
src/
├── components/     # React components
│   ├── Modal.tsx
│   ├── Toast.tsx
│   └── ...
├── hooks/          # Custom React hooks
│   ├── useDarkMode.ts
│   ├── useDebounce.ts
│   └── ...
├── utils/          # Utility functions
│   ├── pdfStorage.ts
│   ├── schemaParser.ts
│   └── ...
├── App.tsx         # Main application
└── main.tsx        # Entry point
```

## Commit Message Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Tests
- `chore`: Maintenance

### Examples

```
feat(pdf): add multi-PDF upload support

- Implement PDF upload component
- Add IndexedDB storage
- Update UI for PDF management

Closes #123
```

```
fix(search): resolve debounce issue

The search was not debouncing correctly, causing
performance issues with large PDFs.

Fixes #456
```

## Review Process

1. **Automated checks** must pass (tests, linting)
2. **Code review** by maintainers
3. **Testing** on multiple browsers
4. **Documentation** review
5. **Merge** after approval

## Getting Help

- 💬 Discussions: Use GitHub Discussions for questions
- 🐛 Issues: Create an issue for bugs
- 📧 Email: Contact maintainers directly for sensitive matters

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to Lector Review! 🎉
