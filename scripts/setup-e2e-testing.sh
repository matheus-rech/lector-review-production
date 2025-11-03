#!/bin/bash

# E2E Testing Setup Script for Lector Review
# This script prepares the environment for comprehensive end-to-end testing

set -e

echo "🚀 Lector Review - E2E Testing Setup"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install pnpm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ pnpm found${NC}"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
pnpm install

# Type check
echo ""
echo "🔍 Running TypeScript type check..."
if pnpm type-check; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi

# Build application
echo ""
echo "🏗️  Building application..."
if pnpm build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Run unit tests
echo ""
echo "🧪 Running unit tests..."
if pnpm test; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some unit tests failed (check output above)${NC}"
fi

# Check for test PDF
echo ""
if [ -f "public/Kim2016.pdf" ]; then
    echo -e "${GREEN}✅ Test PDF found (public/Kim2016.pdf)${NC}"
else
    echo -e "${YELLOW}⚠️  Test PDF not found (public/Kim2016.pdf)${NC}"
    echo "   You may need to add a test PDF for full testing"
fi

echo ""
echo "===================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start dev server: ${YELLOW}pnpm dev${NC}"
echo "2. Open browser: ${YELLOW}http://localhost:5173${NC}"
echo "3. Follow E2E_TESTING_PLAN.md for comprehensive testing"
echo ""
echo "To run automated E2E tests:"
echo "  ${YELLOW}pnpm test:e2e${NC}"
echo ""
echo "Happy testing! 🎉"
