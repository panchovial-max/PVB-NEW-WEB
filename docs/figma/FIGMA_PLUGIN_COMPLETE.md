# 🎉 Figma Localhost Plugin - Complete Setup Guide

## ✅ All Issues Fixed!

The Figma plugin has been completely fixed and is ready to use. Here's what was corrected:

### Fixed Files

1. **`figma-localhost-sync/manifest.json`** ✅
   - Updated network permissions to include specific ports
   - Added both localhost and 127.0.0.1 addresses
   - Included full HTTP URLs for better compatibility

2. **`figma-localhost-sync/code.js`** ✅
   - Fixed API URL from port 8001 to 8000
   - Updated export function to use correct localhost URL
   - Fixed import function with proper URL construction
   - Updated config saving with correct URLs

3. **`figma-localhost-sync/ui.js`** ✅
   - Added default localhost URL fallback (http://localhost:8000)
   - Fixed settings form to properly handle URLs
   - Added config response handler
   - Implemented settings persistence

## 🚀 Quick Start

### 1. Start the API Server
```bash
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
python3 api_server.py
```

The server will start on **http://localhost:8000**

### 2. Open Figma
1. Open a Figma project with designs
2. Go to **Plugins** → **Development** → **New plugin**
3. Select **Link existing plugin** 
4. Navigate to: `/Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/manifest.json`
5. Click **Link**

Or if already linked:
- Go to **Plugins** → **Development** → **Localhost Sync**

### 3. Use the Plugin

#### Export Designs (Figma → HTML/CSS)
1. Select a frame/component in Figma
2. Open the plugin (Plugins → Localhost Sync)
3. Click the **Export** tab
4. Enter filename: `exported-component.html`
5. Enter CSS filename: `exported-component.css`
6. Click **Export to Localhost**
7. Files will be saved to the project root directory

#### Import HTML/CSS (HTML/CSS → Figma)
1. Open the plugin
2. Click the **Import** tab
3. Select a page (Dashboard, Settings, Login, etc.)
4. Localhost URL should be `http://localhost:8000` (default)
5. Click **Import from Localhost**
6. The HTML will be converted to Figma elements on a new frame

#### Configure Settings
1. Open the plugin
2. Click the **Settings** tab
3. Set Localhost URL: `http://localhost:8000`
4. Configure sync options:
   - ☑️ Auto-sync on save (optional)
   - ☑️ Watch for changes (optional)
5. Configure design tokens:
   - ☑️ Sync colors (recommended)
   - ☑️ Sync typography (recommended)
6. Click **Save Settings**

## 🔌 API Endpoints (Automatically Available)

All these endpoints are ready to use on `http://localhost:8000`:

### Figma Export
```
POST /api/figma/export
Content-Type: application/json

{
  "targetFile": "component.html",
  "targetCss": "component.css",
  "overwrite": true,
  "designData": {
    "html": "...",
    "css": "...",
    "nodes": [...],
    "designTokens": {...}
  }
}
```

### Figma Import
```
GET /api/figma/import?page=dashboard
```

Returns HTML, CSS, and design tokens for the selected page.

### Save Configuration
```
POST /api/figma/sync-config
Content-Type: application/json

{
  "config": {
    "localhostUrl": "http://localhost:8000",
    "autoSync": false,
    "watchMode": false,
    "syncColors": true,
    "syncTypography": true
  }
}
```

## 📁 Supported Pages for Import

- **dashboard** → imports from `dashboard.html`
- **settings** → imports from `settings.html`
- **login** → imports from `login.html`
- **index** → imports from `index.html`

## 🛠️ Troubleshooting

### Issue: Plugin not connecting
**Solution:**
1. Restart API server: `python3 api_server.py`
2. Reload plugin in Figma (right-click → Reload)
3. Check that port 8000 is not blocked by firewall
4. Try `127.0.0.1:8000` instead of `localhost:8000` if DNS issues

### Issue: Export fails
**Solution:**
1. Verify a frame/component is selected in Figma
2. Check filename has `.html` extension
3. Verify the project directory is writable
4. Check console for specific error messages

### Issue: Import returns "File not found"
**Solution:**
1. Ensure the HTML file exists in project root
2. Verify page name is correct (dashboard, settings, login, or index)
3. Check file permissions are readable
4. Verify correct localhost URL is entered

### Issue: Network error or connection refused
**Solution:**
1. Confirm API server is running: `curl http://localhost:8000/`
2. Check if ports are in use: `lsof -i :8000`
3. Try using `127.0.0.1` instead of `localhost`
4. Verify Figma plugin permissions allow network access

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ FIGMA                                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │     Figma Plugin UI                     │           │
│  │  (Export | Import | Settings)          │           │
│  └─────────────────┬──────────────────────┘           │
│                    │                                    │
│                    │ HTTP Requests                      │
│                    ▼                                    │
└─────────────────────────────────────────────────────────┘
                     │
                     │ POST /api/figma/export
                     │ GET  /api/figma/import
                     │ POST /api/figma/sync-config
                     ▼
┌─────────────────────────────────────────────────────────┐
│ LOCALHOST SERVER (port 8000)                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │  Python API Server (api_server.py)      │           │
│  │  - Receives design data                 │           │
│  │  - Reads/writes HTML & CSS files        │           │
│  │  - Manages configuration                │           │
│  └──────────────────────────────────────────┘           │
│                    │                                    │
│                    ▼                                    │
│  ┌──────────────────────────────────────────┐           │
│  │  Project Files                          │           │
│  │  - dashboard.html / settings.html       │           │
│  │  - dashboard.css / settings.css         │           │
│  │  - login.html / index.html              │           │
│  │  - Database (SQL)                       │           │
│  └──────────────────────────────────────────┘           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## ✨ Features

- ✅ **Bi-directional sync** - Export designs, import code
- ✅ **Multiple page support** - Dashboard, Settings, Login, Index
- ✅ **Design tokens** - Colors, typography, spacing
- ✅ **Auto-save capable** - Configure for automatic updates
- ✅ **Error handling** - Clear messages for troubleshooting
- ✅ **Persistent settings** - Configuration saved to database
- ✅ **CSS generation** - Automatic styling from Figma data

## 🔒 Security Notes

- Only allows connections to `localhost` and `127.0.0.1`
- Ports 8000 and 8001 are permitted
- Configuration stored in local SQLite database
- No external network calls beyond localhost
- Session-based authentication for API endpoints

## 📝 Next Steps

1. ✅ Start the API server
2. ✅ Link the plugin in Figma
3. ✅ Test export with a simple component
4. ✅ Test import from a page
5. ✅ Configure settings for your workflow
6. ✅ Enjoy seamless Figma ↔ Code synchronization!

## 📞 Support

For issues:
1. Check the **Troubleshooting** section above
2. Review console logs in Figma (⌘⌥I on Mac)
3. Check API server logs for errors
4. Verify all files are in correct locations

---

**Status**: ✅ Ready to Use
**Last Updated**: 2024
**Version**: 1.0.0
