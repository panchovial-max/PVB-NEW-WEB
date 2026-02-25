# 🔧 Figma Plugin Troubleshooting Guide

## ✅ Current Status

**Plugin Name:** Localhost Sync  
**Location:** `/Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/`  
**Backup Location:** `/Users/franciscovialbrown/Desktop/figma-localhost-sync/`

All files have been validated and are ready to import.

---

## 📋 Validated Checks

### ✅ Manifest.json
- Valid JSON syntax
- No BOM (Byte Order Mark)
- Clean UTF-8 encoding
- All required fields present:
  - `name`: "Localhost Sync"
  - `id`: "shotlist-localhost-sync"
  - `api`: "1.0.0"
  - `main`: "code.js"
  - `ui`: "ui.html"
  - `networkAccess`: 4 domains configured

### ✅ Plugin Files
- `code.js`: 19,512 bytes ✓
- `ui.html`: 6,864 bytes ✓
- `ui.js`: 4,727 bytes ✓
- All files readable with correct permissions

### ✅ Code Structure
- Contains `figma.showUI()` ✓
- Contains message handlers ✓
- 634 lines of code ✓

---

## 🚀 Import Instructions

### Method 1: Import from GitHub Directory

1. **Open Figma Desktop App** (not browser!)
2. Go to: **Plugins → Development → Import plugin from manifest...**
3. Navigate to:
   ```
   /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/
   ```
4. Select `manifest.json`
5. Click **"Open"**

### Method 2: Import from Desktop (Recommended)

1. **Open Figma Desktop App**
2. Go to: **Plugins → Development → Import plugin from manifest...**
3. Navigate to:
   ```
   /Users/franciscovialbrown/Desktop/figma-localhost-sync/
   ```
4. Select `manifest.json`
5. Click **"Open"**

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read JSON file"

**Solutions:**

1. **Check Figma Version**
   - You must use **Figma Desktop App** (not web browser)
   - Update to latest version: Figma → Check for Updates
   - Minimum version required: Figma 116+

2. **Restart Figma**
   ```bash
   # Quit Figma completely
   # Reopen and try importing again
   ```

3. **Try Desktop Copy**
   - Use the backup on Desktop instead
   - Path: `/Users/franciscovialbrown/Desktop/figma-localhost-sync/`

4. **Check File Permissions**
   ```bash
   cd /Users/franciscovialbrown/Desktop/figma-localhost-sync
   chmod 644 manifest.json code.js ui.html ui.js
   ```

5. **Verify Path**
   - Make sure you're selecting `manifest.json` itself, not the folder
   - The file picker should show "manifest.json" selected

### Issue: Plugin Imports but Doesn't Run

**Solutions:**

1. **Check Console**
   - Plugins → Development → Open Console
   - Look for error messages

2. **Verify Servers Running**
   ```bash
   curl http://localhost:8001/api/health
   ```
   Should return: `{"status": "healthy"}`

3. **Check Network Access**
   - Plugin needs localhost access
   - Check System Preferences → Security & Privacy
   - Allow network access for Figma

### Issue: Plugin UI Doesn't Show

**Solutions:**

1. **Verify ui.html exists**
   ```bash
   ls -la figma-localhost-sync/ui.html
   ```

2. **Check for JavaScript errors**
   - Open plugin
   - Right-click in plugin UI → Inspect Element
   - Check Console tab

3. **Rebuild if needed**
   ```bash
   cd figma-localhost-sync
   bun build ui.ts --outfile=ui.js
   bun build code.ts --outfile=code.js
   ```

---

## 🔍 Manual Verification

Run this in Terminal to verify everything:

```bash
cd /Users/franciscovialbrown/Desktop/figma-localhost-sync

# Check files exist
echo "=== Files Check ==="
ls -lh manifest.json code.js ui.html ui.js

# Validate JSON
echo -e "\n=== JSON Validation ==="
python3 -c "import json; print('✓ Valid' if json.load(open('manifest.json')) else '✗ Invalid')"

# Check encoding
echo -e "\n=== Encoding Check ==="
file manifest.json

# Test read permissions
echo -e "\n=== Permissions Check ==="
cat manifest.json > /dev/null && echo "✓ Readable" || echo "✗ Not readable"
```

---

## 📝 Current Manifest Contents

```json
{
  "name": "Localhost Sync",
  "id": "shotlist-localhost-sync",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "networkAccess": {
    "allowedDomains": [
      "localhost:8000",
      "localhost:8001",
      "127.0.0.1:8000",
      "127.0.0.1:8001"
    ]
  }
}
```

---

## 🎯 Step-by-Step Import (Detailed)

1. **Launch Figma Desktop**
   - Make sure it's the desktop app, not web
   - Version should be 116 or higher

2. **Open Development Menu**
   - Mac: Figma menu → Plugins → Development
   - Windows: Figma menu → Plugins → Development

3. **Click "Import plugin from manifest..."**
   - A file picker will appear

4. **Navigate to Plugin Folder**
   - Go to Desktop
   - Open `figma-localhost-sync` folder
   - You should see: manifest.json, code.js, ui.html, ui.js

5. **Select manifest.json**
   - Click on `manifest.json` (not any other file)
   - The file name should appear in the file picker

6. **Click "Open"**
   - Figma will process the manifest
   - Success message should appear

7. **Verify Installation**
   - Plugins → Development
   - Should see "Localhost Sync" in the list

8. **Run Plugin**
   - Select any frame (or create one)
   - Plugins → Development → Localhost Sync
   - Plugin UI should appear!

---

## 🔥 Nuclear Option: Complete Rebuild

If nothing works, rebuild everything:

```bash
# Go to project
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync

# Rebuild TypeScript
bun build code.ts --outfile=code.js
bun build ui.ts --outfile=ui.js

# Copy to Desktop
rm -rf /Users/franciscovialbrown/Desktop/figma-localhost-sync
cp -r /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync /Users/franciscovialbrown/Desktop/

# Try importing from Desktop
```

---

## 📞 Support

If issues persist, check:

1. **Figma Community Forum**: https://forum.figma.com
2. **Plugin Docs**: https://www.figma.com/plugin-docs/
3. **Console Logs**: Plugins → Development → Open Console

---

## ✨ Expected Success

When everything works:

```
✅ Import successful
✅ Plugin appears in Development menu
✅ UI loads when plugin is run
✅ Can export Figma → Code
✅ Can import Code → Figma
✅ Network requests work (localhost:8001)
```

---

## 🎉 Quick Test After Import

1. Create a simple rectangle in Figma
2. Select it
3. Run: Plugins → Development → Localhost Sync
4. Click "Export to Localhost"
5. Check project folder for exported files
6. Success! 🎊

---

**Last Updated:** October 27, 2025  
**Plugin Version:** 1.0.0  
**Manifest Location:** Desktop & GitHub Shotlist folder

