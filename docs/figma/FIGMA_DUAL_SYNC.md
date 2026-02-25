# 🎨 Dual Figma ↔ Localhost Bi-directional Sync

Complete guide for syncing **BOTH** your Figma files with your localhost application simultaneously.

## 📋 Overview

This system enables **real-time synchronization** between:

### Your Figma Files:
1. **[Shotlist Board](https://www.figma.com/board/lL7IWBeiwobQsbQXNxpEnN/Shotlist)** - Design Board
2. **[Shotlist Marketing Agency - Website Design](https://www.figma.com/design/PXHcQj8JYjvIPNfUx2RghG/Shotlist-Marketing-Agency---Website-Design)** - Marketing Design

### Localhost Apps:
- **API Server**: http://localhost:8001
- **Web Server**: http://localhost:8000

## 🚀 Quick Start

### 1. Ensure Servers Are Running

```bash
# Terminal 1: API Server
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
python3 api_server.py

# Terminal 2: Web Server
python3 -m http.server 8000
```

### 2. Run Dual Sync (Single Cycle)

```bash
python3 figma-sync-service-dual.py
```

Syncs both Figma files once, then exits.

### 3. Run Dual Sync (Watch Mode - Continuous)

```bash
python3 figma-sync-service-dual.py watch
```

Syncs both files every 30 seconds continuously.

### 4. Monitor Both Syncs

```bash
# In another terminal
tail -f figma-sync-data/shotlist-board/sync.log
```

Or for marketing design:
```bash
tail -f figma-sync-data/shotlist-marketing/sync.log
```

## 🔄 How Dual Sync Works

### Single Sync Cycle (Both Files Sequentially)

```
┌─────────────────────────────────────────────┐
│ SHOTLIST BOARD                              │
│                                             │
│ 1. Check Localhost Health       ✓ Healthy  │
│ 2. Export Figma Metadata        ✓ Done     │
│ 3. Export to Localhost          → API      │
│ 4. Import from Localhost        ← API      │
│ 5. Save Configuration           ✓ Saved    │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ SHOTLIST MARKETING                          │
│                                             │
│ 1. Check Localhost Health       ✓ Healthy  │
│ 2. Export Figma Metadata        ✓ Done     │
│ 3. Export to Localhost          → API      │
│ 4. Import from Localhost        ← API      │
│ 5. Save Configuration           ✓ Saved    │
└─────────────────────────────────────────────┘
```

### Watch Mode (Parallel Syncing)

- Each Figma file syncs in its own thread
- Both run simultaneously every 30 seconds
- Independent sync cycles
- Press `Ctrl+C` to stop all syncs

## 📁 Generated Files

Dual sync creates separate directories for each file:

```
figma-sync-data/
├── shotlist-board/
│   ├── figma-metadata.json      # Board design data
│   └── sync-config.json         # Board sync configuration
│
└── shotlist-marketing/
    ├── figma-metadata.json      # Marketing design data
    └── sync-config.json         # Marketing sync configuration
```

## 🔌 API Endpoints Used

Both sync services use the same endpoints:

### Health Check
```bash
GET /api/health
```

### Export to Localhost
```bash
POST /api/figma/export
Content-Type: application/json

{
  "source": "figma",
  "figma_name": "Shotlist-Board",  # or "Shotlist-Marketing"
  "timestamp": "2025-10-28T...",
  "data": {...}
}
```

### Import from Localhost
```bash
GET /api/figma/import
```

### Save Configuration
```bash
POST /api/figma/sync-config
Content-Type: application/json

{
  "figma_name": "Shotlist-Board",  # Identifies which file
  "figma_url": "https://...",
  "config": {...},
  "timestamp": "2025-10-28T..."
}
```

## 📊 Monitoring Both Syncs

### View All Sync Activity

```bash
# Watch board sync in real-time
tail -f figma-sync-data/shotlist-board/sync.log

# Watch marketing sync in real-time (in another terminal)
tail -f figma-sync-data/shotlist-marketing/sync.log
```

### Check Current Metadata

```bash
# Board metadata
cat figma-sync-data/shotlist-board/figma-metadata.json

# Marketing metadata
cat figma-sync-data/shotlist-marketing/figma-metadata.json
```

### Check Sync Configuration

```bash
# Board config
cat figma-sync-data/shotlist-board/sync-config.json

# Marketing config
cat figma-sync-data/shotlist-marketing/sync-config.json
```

## ⚙️ Configuration

### Modify Sync Interval

Edit `figma-sync-service-dual.py`:

```python
dual_sync.watch_all(interval=60)  # Change from 30s to 60s
```

### Add/Remove Figma Files

Edit the `FIGMA_FILES` list in the script:

```python
FIGMA_FILES = [
    ("https://www.figma.com/board/lL7IWBeiwobQsbQXNxpEnN/Shotlist", "Shotlist-Board"),
    ("https://www.figma.com/design/PXHcQj8JYjvIPNfUx2RghG/Shotlist-Marketing-Agency---Website-Design", "Shotlist-Marketing"),
    # Add more files here
]
```

### Change API Endpoint

```python
LOCALHOST_API = "http://localhost:8001"  # Change port if needed
```

## 🐛 Troubleshooting

### Both Syncs Say Localhost Not Available

**Problem**: "Cannot connect to localhost API"

**Solution**:
1. Start API server: `python3 api_server.py`
2. Check port is open: `lsof -i :8001`
3. Kill if busy: `lsof -ti:8001 | xargs kill -9`
4. Restart: `python3 api_server.py`

### One Sync Works, Other Fails

**Problem**: Board syncs but Marketing doesn't

**Solution**:
1. Check if both Figma files are accessible
2. Verify Figma URLs in `FIGMA_FILES` list
3. Check individual sync logs for errors
4. Restart just that sync manually

### Watch Mode Keeps Stopping

**Problem**: Watch mode exits unexpectedly

**Solution**:
1. Check logs for error messages
2. Verify localhost connection stability
3. Increase timeout: `timeout=20` in code
4. Try single sync first: `python3 figma-sync-service-dual.py`

### High CPU Usage with Watch Mode

**Problem**: Watch mode is using too much CPU

**Solution**:
1. Increase sync interval: `interval=60` (instead of 30)
2. Reduce number of files being synced
3. Use single sync for manual testing

## 📈 Usage Examples

### Example 1: Test Both Files Once

```bash
python3 figma-sync-service-dual.py
```

Output shows both files syncing sequentially.

### Example 2: Continuous Sync for Development

```bash
python3 figma-sync-service-dual.py watch
```

Syncs every 30 seconds. Press `Ctrl+C` to stop.

### Example 3: Monitor in Separate Terminals

Terminal 1: Start watch mode
```bash
python3 figma-sync-service-dual.py watch
```

Terminal 2: Watch board logs
```bash
tail -f figma-sync-data/shotlist-board/sync.log
```

Terminal 3: Watch marketing logs
```bash
tail -f figma-sync-data/shotlist-marketing/sync.log
```

### Example 4: Manually Run Single File Sync

If you only need one file:
```bash
python3 figma-sync-service.py  # Original single file sync
```

## 🎯 What's Currently Synced

For both files:
- ✓ Figma file metadata
- ✓ Design tokens
- ✓ Component information
- ✓ Page structure
- ✓ Sync configuration
- ✓ File identification (which file is which)

### Per-File Tracking

Each file is tracked independently:
- Separate sync directories
- Separate config files
- Separate metadata storage
- Separate sync logs

## 🚀 Advanced Features

### Threaded Sync (Watch Mode)

- Each file syncs in its own thread
- No blocking between syncs
- Parallel execution
- All sync simultaneously

### Error Handling

- Individual file errors don't affect others
- Failed sync doesn't stop watch mode
- Automatic retry on next cycle
- Detailed error logging

### Extensibility

Add more Figma files easily:

```python
FIGMA_FILES = [
    ("url1", "name1"),
    ("url2", "name2"),
    ("url3", "name3"),  # Easy to add more!
]
```

## 📞 Support

If sync fails:
1. Check both servers are running
2. Review sync logs for both files
3. Verify network connection
4. Check Figma URLs are correct
5. Verify API endpoints manually with curl

## 🎊 Success Indicators

When syncing is working correctly:
- ✓ Both log files update every 30 seconds
- ✓ Metadata JSON files contain Figma file info
- ✓ Config JSON files show recent timestamps
- ✓ No error messages in logs
- ✓ Both files sync independently

---

**Last Updated**: October 28, 2025  
**Status**: Production Ready  
**Files Syncing**: 2 (Shotlist Board + Marketing Design)  
**Sync Interval**: 30 seconds (configurable)

