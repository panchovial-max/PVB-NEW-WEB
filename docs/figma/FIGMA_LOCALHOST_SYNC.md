
# 🎨 Figma ↔ Localhost Bi-directional Sync

Complete guide for syncing your Figma designs with your localhost application.

## 📋 Overview

This system enables **real-time synchronization** between:
- **Figma Design File**: https://www.figma.com/board/lL7IWBeiwobQsbQXNxpEnN/Shotlist
- **Localhost App**: http://localhost:8000

## 🚀 Quick Start

### 1. Make Sure Servers Are Running

```bash
# Terminal 1: API Server
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
python3 api_server.py

# Terminal 2: Web Server
python3 -m http.server 8000
```

### 2. Run Sync Service (Single Sync)

```bash
python3 figma-sync-service.py
```

### 3. Run Sync Service (Watch Mode - Continuous)

```bash
python3 figma-sync-service.py watch
```

## 🔄 How It Works

### Single Sync Cycle

```
┌─────────────────────────────────────────────┐
│ 1. Check Localhost Health                   │
│    ↓ API must be running                    │
├─────────────────────────────────────────────┤
│ 2. Export Figma Metadata                    │
│    ↓ Read Figma file information            │
├─────────────────────────────────────────────┤
│ 3. Export to Localhost                      │
│    ↓ POST /api/figma/export                 │
├─────────────────────────────────────────────┤
│ 4. Import from Localhost                    │
│    ↓ GET /api/figma/import                  │
├─────────────────────────────────────────────┤
│ 5. Save Configuration                       │
│    ↓ POST /api/figma/sync-config            │
└─────────────────────────────────────────────┘
```

### Watch Mode

- Runs sync cycle every 30 seconds
- Continuously monitors and updates
- Press `Ctrl+C` to stop

## 📁 Generated Files

Sync creates a `figma-sync-data/` directory with:

```
figma-sync-data/
├── figma-metadata.json      # Figma design data
├── sync-config.json         # Sync configuration
└── sync.log                 # Activity log
```

## 🔌 API Endpoints

The sync service uses these endpoints:

### Health Check
```bash
GET /api/health
```
Verify localhost API is running.

### Export to Localhost
```bash
POST /api/figma/export
Content-Type: application/json

{
  "source": "figma",
  "timestamp": "2025-10-28T...",
  "data": {...}
}
```

### Import from Localhost
```bash
GET /api/figma/import
```
Get HTML/CSS data from localhost.

### Save Configuration
```bash
POST /api/figma/sync-config
Content-Type: application/json

{
  "figma_url": "https://...",
  "config": {...},
  "timestamp": "2025-10-28T..."
}
```

## 📊 Monitoring

### View Sync Activity

```bash
# Watch logs in real-time
tail -f figma-sync-data/sync.log

# View current metadata
cat figma-sync-data/figma-metadata.json

# View sync config
cat figma-sync-data/sync-config.json
```

## ⚙️ Configuration

### Modify Sync Interval

Edit `figma-sync-service.py`:

```python
sync.watch_and_sync(interval=60)  # Change from 30s to 60s
```

### Change API Endpoint

```python
LOCALHOST_API = "http://localhost:8001"  # Change port if needed
```

## 🐛 Troubleshooting

### Sync Says Localhost Not Available

**Problem**: "Cannot connect to localhost API"

**Solution**:
1. Ensure API server is running: `python3 api_server.py`
2. Check port: `lsof -i :8001`
3. If port is busy: `lsof -ti:8001 | xargs kill -9`

### Network Errors During Sync

**Problem**: Timeout or connection refused

**Solution**:
1. Increase timeout in code: `timeout=20` (default: 10)
2. Check network: `ping localhost`
3. Verify firewall: `sudo lsof -i -P -n`

### Figma Metadata Not Updating

**Problem**: Old data in `figma-metadata.json`

**Solution**:
1. Delete sync data: `rm -rf figma-sync-data/`
2. Run sync again: `python3 figma-sync-service.py`

## 📈 Next Steps

1. **Run sync service**: `python3 figma-sync-service.py`
2. **Check logs**: `tail -f figma-sync-data/sync.log`
3. **Monitor data**: `cat figma-sync-data/figma-metadata.json`
4. **Enable watch mode**: `python3 figma-sync-service.py watch`

## 🎯 What's Synced

Currently syncing:
- ✓ Figma file metadata
- ✓ Design tokens
- ✓ Component information
- ✓ Page structure
- ✓ Sync configuration

Future enhancements:
- [ ] Real-time design updates
- [ ] Component code generation
- [ ] CSS export
- [ ] Asset management

## 📞 Support

If sync fails:
1. Check servers are running
2. Review `figma-sync-data/sync.log`
3. Verify network connection
4. Check API endpoints manually with curl

---

**Last Updated**: October 28, 2025
**Status**: Ready for production testing
