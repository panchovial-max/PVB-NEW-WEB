# Figma Localhost Sync Plugin - Quick Start

## 🚀 Import Plugin (2 minutes)

### Step 1: Open Figma Desktop App
- Launch Figma on your Mac

### Step 2: Import Plugin
```
Menu: Plugins → Development → Import plugin from manifest...
```

### Step 3: Select Manifest
```
Path: /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync/manifest.json
```

### Step 4: Click Open
Plugin appears in your Plugins menu! ✅

---

## 📤 Export Figma to Code (2 minutes)

### Step 1: Select Design
- Create or select a Figma frame/component

### Step 2: Open Plugin
```
Plugins → Localhost Sync
```

### Step 3: Go to Export Tab
- Enter target file: `settings.html`
- Enter CSS file: `settings.css`

### Step 4: Click Export
```
Button: Export to Localhost
```

### Step 5: Done! ✨
- HTML file created: `/Users/franciscovialbrown/Documents/GitHub/Shotlist/settings.html`
- CSS file created: `/Users/franciscovialbrown/Documents/GitHub/Shotlist/settings.css`

---

## 📥 Import Code to Figma (2 minutes)

### Step 1: Open Plugin
```
Plugins → Localhost Sync
```

### Step 2: Go to Import Tab
- Select page: `Dashboard`, `Settings`, `Login`, or `Homepage`
- Verify URL: `http://localhost:8000`

### Step 3: Click Import
```
Button: Import from Localhost
```

### Step 4: Done! ✨
- Figma frame created with imported design
- All styles applied automatically

---

## ⚙️ Configure Settings (1 minute)

### Step 1: Open Settings Tab
```
Plugin → Settings tab
```

### Step 2: Configure
- **API URL**: `http://localhost:8001` (default)
- **Auto-sync**: Toggle on/off
- **Watch mode**: Toggle on/off
- **Sync colors**: Toggle on/off
- **Sync typography**: Toggle on/off

### Step 3: Save
```
Button: Save Settings
```

---

## 📋 Checklist

Before you start:
- [ ] Figma Desktop App installed
- [ ] Localhost servers running (`bash START_SERVER.sh`)
- [ ] Plugin built (`bash BUILD_FIGMA_PLUGIN.sh`)
- [ ] Manifest file available

---

## 🔧 Rebuild Plugin (if needed)

```bash
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync
bash BUILD_FIGMA_PLUGIN.sh
```

Then reload in Figma: `Right-click plugin → Reload`

---

## 🆘 Troubleshooting

### Plugin won't load?
1. Check manifest.json is valid: `cat manifest.json | python3 -m json.tool`
2. Verify code.js exists: `ls -l code.js`
3. Rebuild: `bash BUILD_FIGMA_PLUGIN.sh`

### Export fails?
1. Check servers running: `curl http://localhost:8001/api/health`
2. Restart: `bash START_SERVER.sh`
3. Check logs: `tail -f login_debug.log`

### Import fails?
1. Verify HTML file exists: `ls -l dashboard.html`
2. Check CSS file: `ls -l dashboard.css`
3. Try different page: Try `Login` instead of `Dashboard`

### Connection timeout?
1. Restart servers: `pkill -f "python3"` then `bash START_SERVER.sh`
2. Check firewall settings
3. Verify localhost is accessible: `ping localhost`

---

## 📚 Full Documentation

For detailed guide, API endpoints, and advanced usage:
```
/Users/franciscovialbrown/Documents/GitHub/Shotlist/FIGMA_SYNC_GUIDE.md
```

---

## 🎯 Common Workflows

### Workflow 1: Designer → Developer
1. Design in Figma
2. Export to HTML/CSS
3. Developer integrates into project

### Workflow 2: Developer → Designer  
1. Update HTML/CSS in code
2. Import into Figma
3. Designer reviews design

### Workflow 3: Bi-directional
1. Export Figma → Code
2. Modify Code → Import back
3. Export updated Code → Figma

---

## ⚡ Quick Commands

```bash
# Build plugin
bash /Users/franciscovialbrown/Documents/GitHub/Shotlist/BUILD_FIGMA_PLUGIN.sh

# Start servers
bash /Users/franciscovialbrown/Documents/GitHub/Shotlist/START_SERVER.sh

# Check health
curl http://localhost:8001/api/health

# View logs
tail -f /Users/franciscovialbrown/Documents/GitHub/Shotlist/login_debug.log

# Rebuild on change
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist/figma-localhost-sync
bun build code.ts --outfile=code.js --watch &
bun build ui.ts --outfile=ui.js --watch
```

---

## 📞 Support

If stuck:
1. Check FIGMA_SYNC_GUIDE.md (full documentation)
2. Check plugin console: `Plugins → Development → Console`
3. Review server logs
4. Verify all components running

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: November 2025
