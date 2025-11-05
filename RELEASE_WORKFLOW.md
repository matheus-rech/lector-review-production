# Automated Release Workflow

This document outlines the automated release workflow for the Lector Review desktop application using GitHub Actions. This workflow builds and releases the application for Windows, macOS, and Linux.

## Overview

The workflow is defined in the file `.github/workflows/build-electron.yml`. It is triggered automatically when:
- A new tag is pushed to the repository (e.g., `v1.0.1`, `v1.1.0`)
- Code is pushed to the `release` branch
- Manually triggered from the GitHub Actions tab

## How it Works

The workflow performs the following steps:

1.  **Builds on Multiple Platforms**: It runs three parallel jobs on `ubuntu-latest`, `windows-latest`, and `macos-latest` to build the application for each platform.
2.  **Installs Dependencies**: It checks out the code, sets up Node.js, and installs all required npm dependencies.
3.  **Builds Electron App**: It runs `npm run electron:build` to create the distributable application files (AppImage for Linux, EXE for Windows, and DMG for macOS).
4.  **Uploads Artifacts**: The built files are uploaded as artifacts to the workflow run, so they can be downloaded and tested before a release is created.
5.  **Creates GitHub Release**: When a tag is pushed, a new GitHub Release is created automatically. The release notes are generated from the commit history, and the build artifacts are attached to the release for easy download.

## How to Trigger a Build

There are three ways to trigger the Electron build workflow:

### Option 1: Push a Version Tag (Creates GitHub Release)

1.  **Ensure the `master` branch is up to date** with all the changes you want to include in the release.
2.  **Create a new tag** and push it to the repository:

    ```bash
    git tag -a v1.0.1 -m "Release v1.0.1"
    git push origin v1.0.1
    ```

3.  **The workflow will automatically create a GitHub Release** with all installers attached.

### Option 2: Push to Release Branch (Build Only)

1.  **Push your changes to the `release` branch**:

    ```bash
    git checkout release
    git merge master
    git push origin release
    ```

2.  **The workflow will build installers** for all platforms and upload them as artifacts.
3.  **No GitHub Release is created** - this is useful for testing builds before creating an official release.

### Option 3: Manual Trigger

You can also trigger the workflow manually from the **Actions** tab in the GitHub repository. Select the **Build Electron App** workflow and click **Run workflow**.

## Build vs Release

**Important distinction:**
- **Tag push** → Builds installers AND creates a GitHub Release
- **Release branch push** → Builds installers only (no release created)
- **Manual trigger** → Builds installers only (no release created)

This allows you to test builds on the `release` branch before creating an official release with a tag.

## Manual Workflow Trigger

You can also trigger the workflow manually from the **Actions** tab in the GitHub repository. Select the **Build Electron App** workflow and click **Run workflow**. You can optionally specify a version number.

## Build Artifacts

After a workflow run, you can download the build artifacts from the workflow summary page. This is useful for testing the application before creating a release.

## Workflow File

Below is the content of the `.github/workflows/build-electron.yml` file:

```yaml
name: Build Electron App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to build (e.g., 1.0.0)'
        required: false
        default: ''

jobs:
  build:
    name: Build on ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        include:
          - os: ubuntu-latest
            platform: linux
            artifact_name: '*.AppImage'
            artifact_path: 'release/*.AppImage'
          - os: windows-latest
            platform: windows
            artifact_name: '*.exe'
            artifact_path: 'release/*.exe'
          - os: macos-latest
            platform: macos
            artifact_name: '*.dmg'
            artifact_path: 'release/*.dmg'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build Electron app
        run: npm run electron:build
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: List release directory
        run: |
          echo "Contents of release directory:"
          ls -lah release/ || dir release\
        shell: bash
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: lector-review-${{ matrix.platform }}
          path: ${{ matrix.artifact_path }}
          if-no-files-found: warn
          retention-days: 30
      
      - name: Upload all release files
        uses: actions/upload-artifact@v4
        with:
          name: lector-review-${{ matrix.platform }}-all
          path: release/
          retention-days: 30

  release:
    name: Create GitHub Release
    needs: build
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    
    permissions:
      contents: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        with:
          path: artifacts
      
      - name: List downloaded artifacts
        run: |
          echo "Downloaded artifacts:"
          find artifacts -type f
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          draft: false
          prerelease: false
          generate_release_notes: true
          files: |
            artifacts/**/*.AppImage
            artifacts/**/*.exe
            artifacts/**/*.dmg
            artifacts/**/*.yml
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
