# 🎨 View Full Website in Figma - Complete Guide

## ✅ Yes! You CAN see your entire website in Figma!

Your setup already supports importing pages into Figma. Here's how to view the **complete website**:

---

## 🚀 Quick Method: Import All Pages

### Step 1: Start Your API Server

```bash
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
python3 api_server.py
```

The server should be running on `http://localhost:8001`

### Step 2: Open Figma Desktop App

1. Open **Figma Desktop App** (not web version)
2. Open your Figma file:
   - https://www.figma.com/board/lL7IWBeiwobQsbQXNxpEnN/Shotlist

### Step 3: Load the Localhost Sync Plugin

1. In Figma, go to **Plugins** → **Development** → **Import plugin from manifest...**
2. Navigate to:
   ```
   /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/manifest.json
   ```
3. Click **Open**
4. Plugin loads and appears in your Plugins menu

### Step 4: Import All Pages

1. Go to **Plugins** → **Localhost Sync**
2. Click the **Import** tab
3. Import each page one by one:

   **Homepage:**
   - Select page: **"index"**
   - Click **"Import from Localhost"**
   - ✓ Creates a frame with your homepage

   **Dashboard:**
   - Select page: **"dashboard"**
   - Click **"Import from Localhost"**
   - ✓ Creates a frame with your dashboard

   **Settings:**
   - Select page: **"settings"**
   - Click **"Import from Localhost"**
   - ✓ Creates a frame with your settings page

   **Login:**
   - Select page: **"login"**
   - Click **"Import from Localhost"**
   - ✓ Creates a frame with your login page

### Step 5: Arrange Pages to See Full Website

1. **Select all imported frames** (Shift+Click)
2. **Arrange them** side by side or in a grid:
   - Homepage | Dashboard | Settings | Login
3. **Create a master frame** called "Full Website Overview"
4. **Group all pages** together

**Result:** You'll see your complete website structure in Figma! 🎉

---

## 🔧 Alternative: Use the Import-All Script

I've created a helper script that prepares everything:

```bash
python3 export_website_to_figma.py
```

This script:
- ✓ Checks API server is running
- ✓ Gathers all page data
- ✓ Creates website structure JSON
- ✓ Generates import instructions

---

## 📡 Using the API Directly

### Get All Pages at Once

```bash
curl http://localhost:8001/api/figma/import-all
```

This returns JSON with all pages:
```json
{
  "pages": {
    "index": {
      "html": "...",
      "css": "...",
      "file": "index.html"
    },
    "dashboard": {
      "html": "...",
      "css": "...",
      "file": "dashboard.html"
    },
    "settings": {
      "html": "...",
      "css": "...",
      "file": "settings.html"
    },
    "login": {
      "html": "...",
      "css": "...",
      "file": "login.html"
    }
  },
  "designTokens": {...},
  "totalPages": 4
}
```

### Get Individual Pages

```bash
# Homepage
curl http://localhost:8001/api/figma/import?page=index

# Dashboard
curl http://localhost:8001/api/figma/import?page=dashboard

# Settings
curl http://localhost:8001/api/figma/import?page=settings

# Login
curl http://localhost:8001/api/figma/import?page=login
```

---

## 🎯 What Gets Imported

When you import a page, Figma receives:

1. **Complete HTML** - Full page structure
2. **Complete CSS** - All styles and animations
3. **Design Tokens** - Colors, typography, spacing
4. **Page Structure** - Sections, components, layout

The plugin converts this into Figma frames and elements that you can:
- ✅ Edit in Figma
- ✅ Export back to code
- ✅ Use as design reference
- ✅ Share with team

---

## 📋 Complete Workflow

### Option A: Manual Import (Step by Step)

1. ✅ Start API: `python3 api_server.py`
2. ✅ Open Figma Desktop
3. ✅ Load plugin: `figma-localhost-sync/manifest.json`
4. ✅ Import index page
5. ✅ Import dashboard page
6. ✅ Import settings page
7. ✅ Import login page
8. ✅ Arrange all frames
9. ✅ Create "Website Overview" frame

**Time:** ~5-10 minutes

### Option B: Automated Script

1. ✅ Run: `python3 export_website_to_figma.py`
2. ✅ Follow printed instructions
3. ✅ Use plugin to import all pages

**Time:** ~2-3 minutes

---

## 🎨 Creating a Website Overview in Figma

After importing all pages, create a master view:

1. **Create a new page** in Figma called "Website Overview"
2. **Create a large frame** (e.g., 4000x3000px)
3. **Arrange imported pages** in a grid:
   ```
   ┌─────────────┬─────────────┐
   │  Homepage    │  Dashboard   │
   │  (index)     │              │
   ├─────────────┼─────────────┤
   │  Settings    │  Login       │
   │              │              │
   └─────────────┴─────────────┘
   ```
4. **Add labels** for each page
5. **Add navigation flow** arrows showing page connections
6. **Export as image** for presentations

---

## 🔍 What You'll See in Figma

### For Each Page:

- **Layout Structure** - Frames representing sections
- **Typography** - Text styles and fonts
- **Colors** - Design tokens as Figma color styles
- **Components** - Reusable elements
- **Spacing** - Layout grids and spacing

### Full Website View:

- **All 4 pages** side by side
- **Complete navigation** structure
- **Design system** (colors, fonts, spacing)
- **Component library** overview

---

## ⚠️ Troubleshooting

### Plugin Won't Load

**Problem:** "Plugin failed to load"

**Solution:**
1. Check `manifest.json` exists
2. Verify `code.js` and `ui.js` are in the plugin folder
3. Try reloading: Right-click plugin → Reload

### API Not Connecting

**Problem:** "Cannot connect to localhost"

**Solution:**
1. Verify API is running: `curl http://localhost:8001/api/health`
2. Check port: Default is 8001
3. Try `127.0.0.1:8001` instead of `localhost:8001`

### Pages Not Importing

**Problem:** "File not found" or empty import

**Solution:**
1. Check files exist: `ls *.html`
2. Verify API endpoint: `curl http://localhost:8001/api/figma/import?page=index`
3. Check file paths in API response

### Import Creates Empty Frames

**Problem:** Frames created but no content

**Solution:**
1. Check HTML/CSS is being returned by API
2. Verify plugin is parsing HTML correctly
3. Check browser console for errors

---

## 💡 Pro Tips

1. **Create a Figma Component Library**
   - Import pages
   - Extract reusable components
   - Create a design system

2. **Use Figma Auto Layout**
   - After import, convert frames to auto-layout
   - Makes editing easier

3. **Sync Design Tokens**
   - Colors, fonts, spacing sync automatically
   - Use Figma variables for consistency

4. **Export Back to Code**
   - After editing in Figma, export back
   - Use the Export tab in plugin

---

## 📊 Current Status

✅ **Working:**
- Import individual pages
- HTML/CSS conversion
- Design token sync
- API endpoints ready

🔄 **Can Be Enhanced:**
- Batch import (import all at once)
- Auto-arrange pages
- Screenshot import option
- Real-time sync

---

## 🚀 Next Steps

1. **Try it now:**
   ```bash
   python3 api_server.py
   ```
   Then use the Figma plugin to import pages!

2. **Run the helper script:**
   ```bash
   python3 export_website_to_figma.py
   ```

3. **Check the structure:**
   ```bash
   cat figma-sync-data/website-structure.json
   ```

---

**You now have everything you need to view your complete website in Figma!** 🎨

The plugin will convert your HTML/CSS into Figma elements, and you can see all pages together for a complete website overview.

