# GitHub Actions Setup Instructions

This guide explains how to set up the GitHub Actions workflow for automated Electron builds. Due to GitHub security restrictions, workflow files must be added manually to the repository.

## Step 1: Add the Workflow File

The workflow file has been created at `.github/workflows/build-electron.yml` in your local repository. To add it to GitHub, you have two options:

### Option A: Push via Command Line (Recommended)

If you have the repository cloned locally with workflow permissions:

```bash
cd /path/to/lector-review-production
git add .github/workflows/build-electron.yml
git commit -m "ci: Add GitHub Actions workflow for Electron builds"
git push origin master
```

### Option B: Add via GitHub Web Interface

1. Go to your repository on GitHub: https://github.com/matheus-rech/lector-review-production
2. Navigate to the `.github/workflows/` directory (create it if it doesn't exist)
3. Click **Add file** → **Create new file**
4. Name the file `build-electron.yml`
5. Copy the workflow content from the local file `.github/workflows/build-electron.yml`
6. Commit the file directly to the `master` branch

## Step 2: Verify the Workflow

After adding the workflow file:

1. Go to the **Actions** tab in your GitHub repository
2. You should see the **Build Electron App** workflow listed
3. The workflow is now ready to run

## Step 3: Create Your First Release

To trigger the workflow and create your first release:

```bash
# Make sure you're on the master branch with all changes committed
git checkout master
git pull origin master

# Create and push a version tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial Electron desktop app"
git push origin v1.0.0
```

The workflow will automatically:
- Build the app for Windows, macOS, and Linux
- Create installers for each platform
- Create a GitHub Release with all the installers attached
- Generate release notes from your commit history

## Step 4: Monitor the Build

1. Go to the **Actions** tab in your repository
2. Click on the running workflow to see the build progress
3. Each platform (Windows, macOS, Linux) builds in parallel
4. The build typically takes 5-10 minutes

## Step 5: Download and Test

Once the workflow completes:

1. Go to the **Releases** page in your repository
2. You'll see the new release with attached files:
   - `Lector-Review-1.0.0.AppImage` (Linux)
   - `Lector-Review-Setup-1.0.0.exe` (Windows)
   - `Lector-Review-1.0.0.dmg` (macOS)
3. Download and test the appropriate installer for your platform

## Workflow Features

The workflow includes:

- **Multi-platform builds**: Automatically builds for Windows, macOS, and Linux
- **Artifact uploads**: Build artifacts are saved for 30 days for testing
- **Auto-release**: Creates GitHub releases automatically when tags are pushed
- **Release notes**: Generates release notes from commit history
- **Manual trigger**: Can be triggered manually from the Actions tab

## Troubleshooting

### Workflow doesn't appear in Actions tab

- Make sure the workflow file is in `.github/workflows/` directory
- Check that the file has a `.yml` or `.yaml` extension
- Verify the YAML syntax is correct

### Build fails

- Check the Actions tab for detailed error logs
- Common issues:
  - Missing dependencies in `package.json`
  - Syntax errors in `electron/main.js`
  - Icon file missing in `build/` directory

### Release not created

- Make sure you pushed a tag starting with `v` (e.g., `v1.0.0`)
- Check that the workflow has `contents: write` permission
- Verify the build jobs completed successfully

## Next Steps

After setting up the workflow:

1. **Test the workflow** by creating a test tag (e.g., `v1.0.0-beta`)
2. **Update the version** in `package.json` before each release
3. **Write good commit messages** - they become your release notes
4. **Consider adding** code signing for Windows and macOS builds (requires certificates)

## Security Notes

- The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub
- No additional secrets are required for basic builds
- For code signing, you'll need to add signing certificates as repository secrets

## Manual Workflow Trigger

You can also trigger builds manually without creating a tag:

1. Go to **Actions** tab
2. Select **Build Electron App** workflow
3. Click **Run workflow**
4. Choose the branch and optionally specify a version
5. Click **Run workflow** button

This is useful for testing builds before creating an official release.
