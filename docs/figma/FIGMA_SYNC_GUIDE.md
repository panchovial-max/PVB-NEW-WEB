# Figma Localhost Bi-directional Sync Plugin - Complete Guide

## Overview

The **Figma Localhost Sync Plugin** enables seamless bi-directional synchronization between Figma designs and your localhost SHOTLIST project. Export Figma designs as HTML/CSS or import existing code into Figma for visualization.

## Features

### ✨ Export (Figma → Code)
- Select Figma frames/components and export as HTML
- Automatically generates matching CSS
- Writes files to your project directory
- Supports custom file naming
- Preserves design tokens (colors, typography, spacing)
- Auto-layout → CSS Flexbox conversion

### ✨ Import (Code → Figma)
- Import HTML/CSS from localhost into Figma
- Automatically creates corresponding Figma frames
- Applies styles from CSS
- Supports all project pages (Dashboard, Settings, Login, Homepage)
- Design tokens automatically extracted

### ⚙️ Configuration
- Save localhost connection settings
- Configure sync preferences (auto-sync, watch mode)
- Toggle design token mapping
- Multiple sync scenarios

## Installation & Setup

### Step 1: Install Bun (if not already installed)

```bash
curl -fsSL https://bun.sh/install | bash
```

Verify installation:
```bash
bun --version
```

### Step 2: Navigate to Plugin Directory

```bash
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync
```

### Step 3: Install Dependencies

```bash
bun install
```

### Step 4: Build the Plugin

```bash
# Build both TypeScript files
bun build code.ts --outfile=code.js
bun build ui.ts --outfile=ui.js
```

Or use the watch mode for continuous building:

```bash
bun build code.ts --outfile=code.js --watch &
bun build ui.ts --outfile=ui.js --watch
```

### Step 5: Verify Build Output

Check that these files were created:
- `figma-localhost-sync/code.js` ✅
- `figma-localhost-sync/ui.js` ✅

## Importing into Figma

### Via Figma Desktop App

1. Open **Figma** on your desktop
2. Go to **Plugins** → **Development** → **Import plugin from manifest...**
3. Navigate to: `/Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/manifest.json`
4. Click **Open**
5. Plugin loads and is ready to use!

### Via Figma Web (Experimental)

Some features may be limited in the web version. Desktop app is recommended.

## How to Use

### Exporting Figma Designs to Code

1. **Prepare Your Design**
   - Open your Figma file
   - Create or select a frame/component to export
   - Example: Select the entire Settings section

2. **Open the Plugin**
   - Go to **Plugins** → **Localhost Sync**
   - Click the **Export** tab

3. **Configure Export**
   - **Target File**: Enter the output filename (e.g., `settings.html`)
   - **CSS File**: Specify CSS output (e.g., `exported-settings.css`)
   - Check **Overwrite existing files** if you want to replace files

4. **Export**
   - Click **Export to Localhost**
   - Monitor status for success/errors
   - Files are written to your project root

5. **Result**
   - HTML file with semantic structure
   - CSS file with all styles
   - Files ready to use in your project!

### Importing Code into Figma

1. **Open the Plugin**
   - Go to **Plugins** → **Localhost Sync**
   - Click the **Import** tab

2. **Select Source**
   - **Page**: Choose which page to import (Dashboard, Settings, Login, Homepage)
   - **Localhost URL**: Verify the API endpoint (default: `http://localhost:8000`)

3. **Import**
   - Click **Import from Localhost**
   - Plugin fetches HTML/CSS and creates Figma frames
   - Monitor status for completion

4. **Result**
   - New frame created with imported design
   - All styles applied
   - Design tokens extracted and used
   - Ready for editing in Figma!

### Configuring Sync Settings

1. **Open Plugin Settings**
   - Go to **Plugins** → **Localhost Sync**
   - Click the **Settings** tab

2. **Configure Connection**
   - **API URL**: Set your localhost API address (default: `http://localhost:8001`)
   - Verify connection works

3. **Sync Options**
   - ✅ **Auto-sync on save**: Automatically export on file save
   - ✅ **Watch for changes**: Monitor localhost for updates and auto-import

4. **Design Tokens**
   - ✅ **Sync colors**: Map Figma colors to CSS variables
   - ✅ **Sync typography**: Sync font styles and sizes

5. **Save**
   - Click **Save Settings**
   - Configuration is stored in database
   - Settings persist across sessions

## API Endpoints

The plugin communicates with three localhost API endpoints:

### POST `/api/figma/export`
**Export Figma design to HTML/CSS**

Request:
```json
{
  "targetFile": "exported-component.html",
  "targetCss": "exported-component.css",
  "overwrite": true,
  "designData": {
    "nodes": [...],
    "designTokens": {...}
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Successfully exported to exported-component.html",
  "files": {
    "html": "/path/to/exported-component.html",
    "css": "/path/to/exported-component.css"
  }
}
```

### GET `/api/figma/import?page=dashboard`
**Fetch HTML/CSS for import into Figma**

Query Parameters:
- `page`: `dashboard` | `settings` | `login` | `index`

Response:
```json
{
  "html": "<div class=\"dashboard\">...</div>",
  "css": ".dashboard { ... }",
  "designTokens": {
    "colors": {...},
    "typography": {...},
    "spacing": {...}
  },
  "page": "dashboard"
}
```

### POST `/api/figma/sync-config`
**Save sync configuration**

Request:
```json
{
  "config": {
    "localhostUrl": "http://localhost:8001",
    "autoSync": true,
    "watchMode": false,
    "syncColors": true,
    "syncTypography": true
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Configuration saved"
}
```

## Troubleshooting

### Plugin Won't Load

**Problem**: "Plugin failed to load" or "Invalid manifest"

**Solution**:
1. Verify `manifest.json` is valid JSON
2. Check that `code.js` and `ui.js` exist
3. Rebuild with: `bun build code.ts --outfile=code.js`
4. Try importing again

### Export Fails

**Problem**: "Export error: Connection refused"

**Solution**:
1. Verify servers are running:
   ```bash
   curl http://localhost:8001/api/health
   ```
2. Check firewall settings
3. Restart servers:
   ```bash
   bash START_SERVER.sh
   ```

### Import Creates Empty Frame

**Problem**: Frame imported but no content

**Solution**:
1. Verify HTML file exists in project
2. Check CSS file is in correct location
3. Review browser console for errors
4. Ensure fonts are loaded (Inter font required)

### Connection Timeout

**Problem**: "Request timed out" when importing/exporting

**Solution**:
1. Increase timeout in plugin settings
2. Check localhost API health:
   ```bash
   curl http://localhost:8001/api/health
   ```
3. Restart API server:
   ```bash
   pkill -f api_server
   python3 api_server.py &
   ```

### Files Not Written

**Problem**: Export completes but files don't appear

**Solution**:
1. Check file permissions: `ls -la`
2. Verify write access to project directory
3. Check disk space available
4. Review server logs for errors

## Advanced Usage

### Batch Export

To export multiple frames:
1. Create a group in Figma containing all frames
2. Select the group
3. Use export tab to save as single HTML file
4. Plugin generates combined output

### Selective Sync

Configure which design tokens to sync:
1. Open Settings tab
2. Toggle **Sync colors** on/off
3. Toggle **Sync typography** on/off
4. Click **Save Settings**

Only enabled tokens will be synchronized.

### Watch Mode

Enable continuous syncing:
1. Settings tab → Check **Watch for changes**
2. Plugin monitors localhost for updates
3. Auto-imports when files change
4. Useful for live preview workflows

### Auto-sync

Export on every save:
1. Settings tab → Check **Auto-sync on save**
2. Export tab → Configure target file
3. Every design save triggers export
4. Automated workflow for designers

## Design Token Mapping

The plugin maps design tokens between Figma and CSS:

### Colors
```
Figma Variable: primary → CSS Variable: --primary
Figma Variable: error → CSS Variable: --error
```

### Typography
```
Figma Font: Inter Bold 16px → CSS: font-family: Inter; font-weight: 700; font-size: 16px;
```

### Spacing
```
Figma: 8px gap → CSS: gap: 8px;
```

## Project Structure

```
figma-localhost-sync/
├── manifest.json           # Plugin manifest (Figma config)
├── code.ts                # Plugin backend (Figma context)
├── ui.html                # Plugin UI template
├── ui.ts                  # UI logic
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── code.js                # Compiled backend
├── ui.js                  # Compiled UI
└── sync/
    ├── types.ts           # Type definitions
    ├── figma-to-code.ts   # Export logic
    ├── code-to-figma.ts   # Import logic
    ├── figma-to-code.js   # Compiled export
    └── code-to-figma.js   # Compiled import
```

## Best Practices

### 1. Always Backup Before Export
Export creates/overwrites files. Save backups first.

### 2. Test Import Before Using
Try importing a page before using export to verify setup.

### 3. Use Semantic Naming
Name exported files clearly: `dashboard-header.html`, `settings-form.css`

### 4. Keep Localhost Running
Both API server (8001) and static server (8000) must run.

### 5. Regular Sync
Sync frequently to avoid large divergences between Figma and code.

### 6. Version Control
Commit exported files to git for history and rollback.

## Supported Pages for Import

- **Dashboard** (`dashboard.html`) - Main analytics dashboard
- **Settings** (`settings.html`) - User settings page
- **Login** (`login.html`) - Client login page
- **Homepage** (`index.html`) - Landing page

## Supported Figma Node Types

- ✅ Frames
- ✅ Components
- ✅ Text
- ✅ Shapes (Rectangle, Circle, Polygon)
- ✅ Images
- ✅ Groups
- ✅ Auto-layout groups

## CSS Features Supported

- ✅ Flexbox layouts
- ✅ Grid layouts
- ✅ Colors (RGB, HEX, CSS variables)
- ✅ Typography (font, size, weight, line-height)
- ✅ Spacing (margin, padding, gap)
- ✅ Borders
- ✅ Shadows
- ✅ Border radius
- ✅ Opacity
- ✅ Transform

## Development

### Building from Source

```bash
cd figma-localhost-sync
bun install
bun build code.ts --outfile=code.js
bun build ui.ts --outfile=ui.js
```

### Watch Mode for Development

```bash
# Terminal 1
bun build code.ts --outfile=code.js --watch

# Terminal 2
bun build ui.ts --outfile=ui.js --watch
```

### Adding New Features

1. Modify TypeScript files
2. Rebuild with Bun
3. Reload plugin in Figma (right-click → Reload)
4. Test new functionality

## FAQ

**Q: Can I export to multiple files at once?**
A: Currently exports one file at a time. For multiple exports, repeat the process.

**Q: Does the plugin work offline?**
A: No, both Figma and localhost must be accessible.

**Q: Will exported code be production-ready?**
A: Exported code includes structure and styles but may need tweaking for your use case.

**Q: Can I customize the export format?**
A: Currently uses HTML5 + CSS3. Custom formats coming soon.

**Q: Is my data secure?**
A: The plugin only communicates with your localhost. No data is sent to external servers.

## Support & Feedback

For issues or feature requests:

1. Check troubleshooting section
2. Review plugin console (Figma → Plugins → Development → Console)
3. Check server logs: `tail -f login_debug.log`
4. Review API health: `curl http://localhost:8001/api/health`

## Next Steps

1. ✅ Build plugin with Bun
2. ✅ Import manifest into Figma
3. ✅ Test export functionality
4. ✅ Test import functionality
5. ✅ Configure sync settings
6. 🎉 Start syncing!

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Plugin ID**: shotlist-localhost-sync
