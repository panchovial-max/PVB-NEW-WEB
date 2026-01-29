# 📋 Notion & Google Workspace Integration Status

## ✅ Current Implementation Status

### 1. **Notion Calendar Integration** ✅ IMPLEMENTED

#### Backend Endpoints (`api_server.py`):
- ✅ `POST /api/notion/connect` - Connect Notion Calendar
- ✅ `POST /api/notion/test` - Test Notion connection
- ✅ `GET /api/notion/config` - Get Notion configuration
- ✅ `GET /api/notion/events` - Get Notion events
- ✅ `POST /api/notion/sync-event` - Sync event to Notion

#### Features:
- ✅ API Key authentication
- ✅ Database ID configuration
- ✅ Connection testing
- ✅ Automatic sync support
- ✅ Bidirectional sync support
- ✅ Event retrieval
- ✅ Event synchronization

#### Database Table:
```sql
CREATE TABLE notion_config (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    api_key TEXT NOT NULL,
    database_id TEXT NOT NULL,
    sync_enabled INTEGER DEFAULT 0,
    bidirectional INTEGER DEFAULT 0,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP,
    UNIQUE(user_id)
)
```

#### Settings UI (`settings.html`):
- ✅ Notion API Key input field
- ✅ Database ID input field
- ✅ Enable automatic sync checkbox
- ✅ Bidirectional sync checkbox
- ✅ Connect button
- ✅ Test Connection button
- ✅ Status indicator

---

### 2. **Google Workspace Integration** ⚠️ PARTIAL

#### Current Implementation:

**OAuth Configuration** ✅:
```python
'google': {
    'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
    'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
    'authorization_url': 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url': 'https://oauth2.googleapis.com/token',
    'userinfo_url': 'https://openidconnect.googleapis.com/v1/userinfo',
    'scope': 'openid email profile',
    'redirect_uri': 'http://localhost:8000/oauth/callback/google'
}
```

**Current Scopes**: 
- ✅ `openid email profile` (Basic authentication)
- ❌ Missing Google Calendar scopes
- ❌ Missing Google Workspace APIs

#### What's Missing for Google Workspace:
1. ❌ Google Calendar API integration
2. ❌ Google Calendar scopes (`https://www.googleapis.com/auth/calendar`)
3. ❌ Google Calendar event sync
4. ❌ Google Workspace domain management
5. ❌ Google Drive integration (if needed)
6. ❌ Google Contacts integration (if needed)

---

## 🔧 How to Use Notion Integration

### Step 1: Get Notion API Key
1. Go to: https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Name it: "PVB Estudio Calendar"
4. Copy the **Internal Integration Token** (starts with `secret_`)

### Step 2: Get Notion Database ID
1. Open your Notion calendar database
2. Click **"..."** (three dots) → **"Copy link"**
3. Extract the Database ID from the URL:
   ```
   https://www.notion.so/YOUR-WORKSPACE/DATABASE_ID?v=...
   ```
   The Database ID is the long string before `?v=`

### Step 3: Share Database with Integration
1. In your Notion database, click **"..."** → **"Connections"**
2. Add your integration: **"PVB Estudio Calendar"**

### Step 4: Connect in Settings
1. Go to: `settings.html` → **"📢 Ads APIs"** tab
2. Scroll to **"Notion Calendar Integration"**
3. Enter:
   - **Notion API Key**: `secret_XXXXXXXX`
   - **Database ID**: Your database ID
4. Check **"Enable automatic sync"** (optional)
5. Check **"Bidirectional sync"** (optional)
6. Click **"Connect Notion Calendar"**
7. Click **"Test Connection"** to verify

---

## 🔧 How to Set Up Google Workspace Integration

### Step 1: Create Google Cloud Project
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable **Google Calendar API**:
   - APIs & Services → Library
   - Search "Google Calendar API"
   - Click **Enable**

### Step 2: Create OAuth Credentials
1. Go to: **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Configure consent screen (if first time):
   - User Type: External (or Internal for Workspace)
   - App name: "PVB Estudio Creativo"
   - User support email: Your email
   - Developer contact: Your email
4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "PVB Estudio Web Client"
   - Authorized redirect URIs:
     - `http://localhost:8000/oauth/callback/google`
     - `http://localhost:8001/oauth/callback/google` (if using port 8001)
5. Copy **Client ID** and **Client Secret**

### Step 3: Update Google OAuth Scopes
**Current scopes** (in `api_server.py` line 52):
```python
'scope': 'openid email profile',
```

**Should be** (for Calendar access):
```python
'scope': 'openid email profile https://www.googleapis.com/auth/calendar',
```

### Step 4: Set Environment Variables
```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

Or add to `.env` file:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 🚀 Implementation Plan for Google Workspace

### Phase 1: Google Calendar Integration ⚠️ NEEDS IMPLEMENTATION

#### Add to `api_server.py`:

1. **Update OAuth Scopes**:
```python
'google': {
    'client_id': os.environ.get('GOOGLE_CLIENT_ID', ''),
    'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
    'authorization_url': 'https://accounts.google.com/o/oauth2/v2/auth',
    'token_url': 'https://oauth2.googleapis.com/token',
    'userinfo_url': 'https://openidconnect.googleapis.com/v1/userinfo',
    'scope': 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    'redirect_uri': 'http://localhost:8000/oauth/callback/google'
}
```

2. **Add Google Calendar Endpoints**:
- `POST /api/google/calendar/connect` - Connect Google Calendar
- `GET /api/google/calendar/events` - Get calendar events
- `POST /api/google/calendar/events` - Create calendar event
- `PUT /api/google/calendar/events/:id` - Update event
- `DELETE /api/google/calendar/events/:id` - Delete event
- `POST /api/google/calendar/sync` - Sync events with agenda

3. **Database Table**:
```sql
CREATE TABLE google_calendar_config (
    config_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    calendar_id TEXT DEFAULT 'primary',
    sync_enabled INTEGER DEFAULT 0,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP,
    token_expires_at TIMESTAMP,
    UNIQUE(user_id)
)
```

4. **Settings UI** (add to `settings.html`):
- Google Calendar connection section
- Calendar selection dropdown
- Sync options
- Test connection button

---

## 📊 Current Status Summary

| Integration | Status | Backend | Frontend | Ready to Use |
|------------|--------|---------|----------|--------------|
| **Notion Calendar** | ✅ Complete | ✅ Yes | ✅ Yes | ✅ Yes |
| **Google OAuth (Basic)** | ✅ Implemented | ✅ Yes | ✅ Yes | ⚠️ Limited |
| **Google Calendar** | ❌ Not Implemented | ❌ No | ❌ No | ❌ No |
| **Google Workspace** | ❌ Not Implemented | ❌ No | ❌ No | ❌ No |

---

## 🎯 Next Steps

### For Notion (Already Working):
1. ✅ Test connection in settings
2. ✅ Sync agenda events
3. ✅ Verify bidirectional sync works

### For Google Workspace (Needs Implementation):
1. ⚠️ Update OAuth scopes to include Calendar
2. ⚠️ Implement Google Calendar API endpoints
3. ⚠️ Add Google Calendar UI to settings
4. ⚠️ Create sync functionality
5. ⚠️ Test integration

---

## 📝 Testing Checklist

### Notion Integration:
- [ ] Get Notion API key
- [ ] Get Notion Database ID
- [ ] Share database with integration
- [ ] Connect in settings
- [ ] Test connection
- [ ] Verify events sync

### Google Workspace:
- [ ] Create Google Cloud project
- [ ] Enable Calendar API
- [ ] Create OAuth credentials
- [ ] Update OAuth scopes in code
- [ ] Implement Calendar endpoints
- [ ] Test OAuth flow
- [ ] Test Calendar sync

---

## 🔗 Resources

- **Notion API Docs**: https://developers.notion.com/
- **Google Calendar API**: https://developers.google.com/calendar/api
- **Google OAuth 2.0**: https://developers.google.com/identity/protocols/oauth2
- **Google Workspace APIs**: https://developers.google.com/workspace/apis

---

## ❓ Questions?

If you need help with:
- Setting up Notion integration → Follow "How to Use Notion Integration" above
- Implementing Google Calendar → See "Implementation Plan" above
- Testing connections → Use test buttons in settings

Let me know which integration you'd like to work on first!

