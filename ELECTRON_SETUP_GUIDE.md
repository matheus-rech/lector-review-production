# 🖥️ Electron Desktop App Setup Guide

## Overview

This guide will help you convert Lector Review into a native desktop application using Electron.

---

## ✅ Benefits of Electron Desktop App

- ✅ **Offline Access** - Works without internet
- ✅ **Native Performance** - Faster than web browsers
- ✅ **File System Access** - Easy PDF loading from local files
- ✅ **Privacy** - All data stays on your computer
- ✅ **Cross-Platform** - Windows, macOS, Linux
- ✅ **Professional** - Standalone application

---

## 📦 Step 1: Install Dependencies

```bash
cd /home/ubuntu/lector-review-production

npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

**Packages installed:**
- `electron` - Electron framework
- `electron-builder` - Build and package the app
- `concurrently` - Run multiple commands
- `wait-on` - Wait for dev server
- `cross-env` - Cross-platform environment variables

---

## 📝 Step 2: Update package.json

Add the following to your `package.json`:

### Add "main" field (at top level):
```json
{
  "main": "electron/main.js",
  ...
}
```

### Add Electron scripts to "scripts" section:
```json
{
  "scripts": {
    ...existing scripts...,
    "electron": "wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .",
    "electron:dev": "concurrently \"npm run dev\" \"npm run electron\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux",
    "clean": "rm -rf node_modules dist .turbo release"
  }
}
```

### Add "build" configuration (at top level):
```json
{
  "build": {
    "appId": "com.lector.review",
    "productName": "Lector Review",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "electron/**/*",
      "package.json"
    ],
    "extraMetadata": {
      "main": "electron/main.js"
    },
    "win": {
      "target": [{"target": "nsis", "arch": ["x64"]}],
      "icon": "build/icon.png"
    },
    "mac": {
      "target": [{"target": "dmg", "arch": ["x64", "arm64"]}],
      "icon": "build/icon.png",
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": [{"target": "AppImage", "arch": ["x64"]}],
      "icon": "build/icon.png",
      "category": "Office"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

---

## 📁 Step 3: Electron Main Process (Already Created!)

The file `electron/main.js` has already been created for you with:
- ✅ Window creation
- ✅ Development/Production mode handling
- ✅ Application menu
- ✅ Lifecycle management
- ✅ Error handling

---

## 🎨 Step 4: Create App Icon (Optional)

Create a `build` directory and add an icon:

```bash
mkdir -p build
# Add your icon as build/icon.png (512x512 recommended)
```

**Icon requirements:**
- **Windows**: 256x256 PNG
- **macOS**: 512x512 PNG or ICNS
- **Linux**: 512x512 PNG

---

## 🚀 Step 5: Run in Development Mode

```bash
npm run electron:dev
```

This will:
1. Start Vite dev server (port 5173)
2. Wait for server to be ready
3. Launch Electron window
4. Open DevTools for debugging

---

## 📦 Step 6: Build for Distribution

### Build for your current platform:
```bash
npm run electron:build
```

### Or build for specific platforms:

#### Windows (creates installer):
```bash
npm run electron:build:win
```
**Output**: `release/Lector Review Setup.exe`

#### macOS (creates DMG):
```bash
npm run electron:build:mac
```
**Output**: `release/Lector Review.dmg`

#### Linux (creates AppImage):
```bash
npm run electron:build:linux
```
**Output**: `release/Lector Review.AppImage`

---

## 📊 Build Output

After building, you'll find:

```
release/
├── Lector Review Setup.exe    (Windows installer ~150MB)
├── Lector Review.dmg          (macOS disk image ~150MB)
└── Lector Review.AppImage     (Linux portable ~150MB)
```

---

## 🎯 Distribution

### Windows
- Share the `.exe` installer
- Users double-click to install
- Creates desktop shortcut
- Adds to Start Menu

### macOS
- Share the `.dmg` file
- Users drag to Applications folder
- May need to allow in Security settings

### Linux
- Share the `.AppImage` file
- Make executable: `chmod +x "Lector Review.AppImage"`
- Run directly: `./Lector\ Review.AppImage`

---

## 🔧 Customization Options

### Change App Name
In `package.json`:
```json
{
  "build": {
    "productName": "Your App Name"
  }
}
```

### Change App ID
In `package.json`:
```json
{
  "build": {
    "appId": "com.yourcompany.yourapp"
  }
}
```

### Change Window Size
In `electron/main.js`:
```javascript
const mainWindow = new BrowserWindow({
  width: 1600,  // Change width
  height: 1000, // Change height
  ...
});
```

---

## 🐛 Troubleshooting

### Issue: "electron: command not found"
**Solution**: Run `npm install` again

### Issue: Build fails with "icon not found"
**Solution**: Create `build/icon.png` or remove icon references from package.json

### Issue: White screen on launch
**Solution**: Check if Vite dev server is running (port 5173)

### Issue: "Cannot find module 'electron'"
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Quick Reference

### Development Commands
```bash
npm run dev              # Web dev server only
npm run electron:dev     # Electron + Web dev server
```

### Build Commands
```bash
npm run build           # Build web version
npm run electron:build  # Build desktop app (current platform)
```

### Platform-Specific Builds
```bash
npm run electron:build:win    # Windows
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
```

---

## ✅ Checklist

Before building for distribution:

- [ ] Install all dependencies (`npm install`)
- [ ] Update app name in package.json
- [ ] Update app ID in package.json
- [ ] Add app icon to `build/icon.png`
- [ ] Test in development mode (`npm run electron:dev`)
- [ ] Build for your platform (`npm run electron:build`)
- [ ] Test the built application
- [ ] Create README for users
- [ ] Prepare distribution method

---

## 🎉 You're Ready!

Your Electron desktop app setup is complete! You can now:

1. **Develop**: `npm run electron:dev`
2. **Build**: `npm run electron:build`
3. **Distribute**: Share the installer from `release/` folder

---

*Electron Setup Guide*  
*Created: November 4, 2025*  
*Ready to build your desktop app!* 🚀
