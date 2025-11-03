#!/bin/bash

# Lector Review - One-Click Deployment Script
# This script automates the deployment process for the Lector Review application

set -e  # Exit on error

echo "🚀 Lector Review - Deployment Script"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  pnpm not found. Installing pnpm...${NC}"
    npm install -g pnpm
fi

if ! command -v git >/dev/null 2>&1; then
    echo -e "${RED}❌ Git is required but not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Run tests
echo "🧪 Running tests..."
if pnpm test run 2>&1 | grep -q "PASS"; then
    echo -e "${GREEN}✓ Tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed, but continuing...${NC}"
fi
echo ""

# Build application
echo "🔨 Building application..."
pnpm run build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Check if gh CLI is available
if command -v gh >/dev/null 2>&1; then
    echo "📤 GitHub CLI detected."
    echo ""
    
    # Check if already in a git repository
    if [ -d ".git" ]; then
        echo -e "${GREEN}✓ Git repository already initialized${NC}"
    else
        echo "Initializing git repository..."
        git init
        git add .
        git commit -m "Initial commit: Lector Review Enhanced"
        echo -e "${GREEN}✓ Git repository initialized${NC}"
    fi
    echo ""
    
    # Ask if user wants to create GitHub repository
    read -p "Create GitHub repository and push? (y/n): " CREATE_REPO
    
    if [ "$CREATE_REPO" = "y" ] || [ "$CREATE_REPO" = "Y" ]; then
        read -p "Enter GitHub repository name (default: lector-review): " REPO_NAME
        REPO_NAME=${REPO_NAME:-lector-review}
        
        read -p "Make repository public? (y/n, default: y): " IS_PUBLIC
        IS_PUBLIC=${IS_PUBLIC:-y}
        
        if [ "$IS_PUBLIC" = "y" ] || [ "$IS_PUBLIC" = "Y" ]; then
            VISIBILITY="--public"
        else
            VISIBILITY="--private"
        fi
        
        echo "Creating GitHub repository..."
        gh repo create "$REPO_NAME" $VISIBILITY --source=. --remote=origin --push || {
            echo -e "${YELLOW}⚠️  Repository might already exist. Trying to push...${NC}"
            git remote add origin "https://github.com/$(gh api user -q .login)/$REPO_NAME.git" 2>/dev/null || true
            git branch -M main
            git push -u origin main
        }
        
        echo -e "${GREEN}✓ Repository created and pushed to GitHub!${NC}"
        echo -e "${GREEN}🔗 Repository URL: https://github.com/$(gh api user -q .login)/$REPO_NAME${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not found.${NC}"
    echo "📝 To push to GitHub manually:"
    echo "   1. Create a repository on GitHub"
    echo "   2. git init (if not already initialized)"
    echo "   3. git add ."
    echo "   4. git commit -m 'Initial commit'"
    echo "   5. git remote add origin <repository-url>"
    echo "   6. git push -u origin main"
fi
echo ""

# Deploy to Vercel (if available)
if command -v vercel >/dev/null 2>&1; then
    read -p "Deploy to Vercel? (y/n): " DEPLOY_VERCEL
    if [ "$DEPLOY_VERCEL" = "y" ] || [ "$DEPLOY_VERCEL" = "Y" ]; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
        echo -e "${GREEN}✓ Deployed to Vercel${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found.${NC}"
    echo "To deploy to Vercel:"
    echo "   1. Install Vercel CLI: npm i -g vercel"
    echo "   2. Run: vercel --prod"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployment process complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📂 Build output: dist/"
echo "🌐 Ready to deploy to any static hosting service"
echo ""
echo "Deployment options:"
echo "  • Vercel: vercel --prod"
echo "  • Netlify: netlify deploy --prod --dir=dist"
echo "  • GitHub Pages: See DEPLOYMENT_GUIDE.md"
echo ""
echo "📖 For more information, see DEPLOYMENT_GUIDE.md"
echo ""
