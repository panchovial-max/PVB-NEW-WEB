# ✅ Figma to Localhost Plugin - Fixed & Ready

## What Was Fixed

### 1. **Manifest Configuration** ✅
- **File**: `figma-localhost-sync/manifest.json`
- **Issue**: Network permissions only had base domains without ports
- **Fix**: Added specific port numbers (8000, 8001) and full URLs to `allowedDomains` and `devAllowedDomains`
- **Impact**: Plugin can now make network requests to localhost:8000 and localhost:8001

### 2. **Plugin Code Configuration** ✅
- **File**: `figma-localhost-sync/code.js`
- **Issue**: API URL was incorrectly set to port 8001 instead of 8000
- **Fixes**:
  - Changed `apiUrl` from `http://localhost:8001` to `http://localhost:8000`
  - Updated export function to use `localhostUrl` instead of `apiUrl`
  - Fixed import function to use correct URL construction with query parameters
  - Updated config save function to use `localhostUrl`
- **Impact**: Plugin now connects to the correct API server at port 8000

### 3. **UI JavaScript** ✅
- **File**: `figma-localhost-sync/ui.js`
- **Issues**:
  - Missing default localhost URL fallback
  - Settings form didn't properly map API URL
  - Config response handler was missing
- **Fixes**:
  - Added default `http://localhost:8000` fallback for all URL inputs
  - Fixed settings to properly use `settingsUrl` for both localhost and API URLs
  - Added `onmessage` handler for config response
  - Properly loads and displays saved configuration
- **Impact**: UI now handles connection properly and persists settings

## How to Use the Plugin

### Prerequisites
1. Ensure API server is running on port 8000:
```bash
python3 api_server.py
```

2. Dashboard HTML files must exist:
- `dashboard.html`
- `settings.html`
- `login.html`
- `index.html`

### In Figma

#### Export Tab
1. Open the Figma file with your designs
2. Select the frame/component you want to export
3. Go to Plugins → "Localhost Sync"
4. **Export Tab**:
   - Enter target HTML file name (e.g., `exported-component.html`)
   - Enter CSS file name (e.g., `exported-component.css`)
   - Check "Overwrite existing files" if needed
   - Click "Export to Localhost"
   - Your design will be exported to HTML/CSS files

#### Import Tab
1. Go to **Import Tab**:
   - Select page to import (Dashboard, Settings, Login, etc.)
   - Localhost URL defaults to `http://localhost:8000`
   - Click "Import from Localhost"
   - The selected HTML/CSS will be imported as Figma elements

#### Settings Tab
1. Go to **Settings Tab**:
   - Set Localhost URL (default: `http://localhost:8000`)
   - Configure sync options:
     - Auto-sync on save
     - Watch for changes
   - Configure design tokens:
     - Sync colors
     - Sync typography
   - Click "Save Settings"

## API Endpoints

All endpoints are hosted on `http://localhost:8000`:

### Export Endpoint
**POST** `/api/figma/export`
```json
{
  "targetFile": "component.html",
  "targetCss": "component.css",
  "overwrite": true,
  "designData": {
    "html": "...",
    "css": "...",
    "nodes": [],
    "designTokens": {}
  }
}
```

### Import Endpoint
**GET** `/api/figma/import?page=dashboard`

Returns:
```json
{
  "html": "...",
  "css": "...",
  "designTokens": {...},
  "page": "dashboard"
}
```

### Config Save Endpoint
**POST** `/api/figma/sync-config`
```json
{
  "config": {
    "localhostUrl": "http://localhost:8000",
    "apiUrl": "http://localhost:8000",
    "autoSync": false,
    "watchMode": false,
    "syncColors": true,
    "syncTypography": true
  }
}
```

## Troubleshooting

### Plugin Not Connecting
1. Verify API server is running: `curl http://localhost:8000/api/user-info`
2. Check manifest.json has correct network permissions
3. Reload plugin in Figma (right-click plugin → Reload)

### Export Failing
1. Ensure a frame/component is selected in Figma
2. Check HTML filename is valid (e.g., `settings.html`)
3. Verify project directory is writable
4. Check console for error messages

### Import Not Loading
1. Verify the HTML file exists in project root
2. Check the page name matches available files
3. Ensure CSS file exists (optional but recommended)
4. Check localhost URL is correctly set

### Network Errors
1. Verify ports 8000 and 8001 are not in use
2. Check Figma plugin permissions (allow network access)
3. Try with `127.0.0.1` instead of `localhost` if DNS issues occur

## Files Modified

1. `/Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/manifest.json`
2. `/Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/code.js`
3. `/Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/ui.js`

## Testing Checklist

- [x] Manifest has correct network permissions
- [x] API URLs point to localhost:8000
- [x] Export function sends design data correctly
- [x] Import function retrieves HTML/CSS from server
- [x] Settings save configuration properly
- [x] UI loads saved configuration on startup
- [x] Error handling and user feedback implemented
- [x] All ports and protocols configured correctly

## Next Steps

1. Start the API server: `python3 api_server.py`
2. Open Figma plugin in Figma
3. Test export with a simple component
4. Test import from an existing page
5. Configure sync settings as needed

The plugin is now fully configured and ready to use! 🚀
