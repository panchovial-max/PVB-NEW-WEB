# 🚀 Instagram API - Quick Start Guide

## 1️⃣ Get Instagram Credentials (5 minutes)

### Step 1: Register as Meta Developer
1. Go to https://developers.facebook.com
2. Click "Get Started"
3. Fill in your info and create account

### Step 2: Create an App
1. In developer dashboard, click "Create App"
2. Choose "Business" type
3. Name: "SHOTLIST Analytics"
4. Fill in business details
5. Click "Create App"

### Step 3: Get Credentials
In App Settings → Basic, copy:
- **App ID**: `XXXXXXXXXXXXXXXXX`
- **App Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 2️⃣ Set Environment Variables

Create `.env` file or add to your shell:

```bash
export INSTAGRAM_APP_ID="your_app_id_here"
export INSTAGRAM_APP_SECRET="your_app_secret_here"
export INSTAGRAM_REDIRECT_URI="http://localhost:8000/oauth/callback/instagram"
export INSTAGRAM_CACHE_TTL="1800"
```

Or update in your shell startup:
```bash
echo 'export INSTAGRAM_APP_ID="xxx"' >> ~/.zshrc
source ~/.zshrc
```

## 3️⃣ Initialize Instagram Integration

Run this to set up database tables:

```bash
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
python3 -c "from instagram_integration import InstagramDatabase; db = InstagramDatabase(); print('✅ Instagram database initialized')"
```

## 4️⃣ API Endpoints

### Link Instagram Account
```bash
curl -X POST http://localhost:8000/api/instagram/connect \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "access_token": "YOUR_ACCESS_TOKEN"
  }'
```

### Get Instagram Metrics
```bash
curl http://localhost:8000/api/instagram/metrics?user_id=1
```

Response:
```json
{
  "followers": 1234,
  "following": 567,
  "media_count": 56,
  "engagement_rate": 4.2,
  "reach": 5678,
  "impressions": 12345,
  "profile_views": 2345,
  "synced_at": "2024-01-15T10:30:00"
}
```

### Get Top Posts
```bash
curl http://localhost:8000/api/instagram/top-posts?user_id=1&limit=5
```

### Sync All Users
```bash
curl -X POST http://localhost:8000/api/instagram/sync-all
```

## 5️⃣ Integration Steps

### Option A: Manual Integration (Recommended for Testing)

1. **Import the module in api_server.py:**
```python
from instagram_integration import InstagramAPI, InstagramDatabase

# In CampaignAnalyticsAPI class
def __init__(self):
    self.instagram_db = InstagramDatabase()
```

2. **Add endpoint handlers:**
```python
elif path == '/api/instagram/connect':
    self.connect_instagram_account()
elif path == '/api/instagram/metrics':
    self.get_instagram_metrics(query_params)
elif path == '/api/instagram/sync-all':
    self.sync_all_instagram_metrics()
```

3. **Implement handlers:**
```python
def connect_instagram_account(self):
    """Connect Instagram account to user"""
    content_length = int(self.headers.get('Content-Length', 0))
    data = json.loads(self.rfile.read(content_length))
    
    user_id = data.get('user_id')
    access_token = data.get('access_token')
    
    instagram_api = InstagramAPI(access_token)
    user_info = instagram_api.get_user_info()
    
    if user_info:
        self.instagram_db.save_account(user_id, {**user_info, 'access_token': access_token})
        self._set_headers()
        self.wfile.write(json.dumps({'success': True}).encode())
    else:
        self._set_headers(400)
        self.wfile.write(json.dumps({'error': 'Failed to authenticate'}).encode())
```

### Option B: Automatic on User Creation

When a new user registers:

```python
def handle_registration(self, user_data):
    """Register new user and fetch Instagram metrics"""
    # ... existing registration code ...
    
    # Check for Instagram account
    instagram_handle = user_data.get('instagram_handle')
    if instagram_handle:
        # Fetch metrics in background
        self.fetch_instagram_metrics_for_user(user_id)
```

## 6️⃣ Dashboard Display

### Show Instagram Card in Dashboard

Add to dashboard.html:

```html
<div class="kpi-card instagram-metrics">
    <div class="kpi-icon instagram-icon">
        <svg><!-- Instagram icon SVG --></svg>
    </div>
    <div class="kpi-content">
        <div class="kpi-label">Instagram</div>
        <div class="kpi-value" id="instagramFollowers">0</div>
        <div class="kpi-change" id="instagramChange">0%</div>
    </div>
</div>
```

### Update in dashboard.js:

```javascript
// Fetch Instagram metrics
async function loadInstagramMetrics() {
    const sessionId = localStorage.getItem('session_id');
    const response = await fetch(`/api/instagram/metrics?user_id=${sessionId}`, {
        headers: {'X-Session-ID': sessionId}
    });
    
    const data = await response.json();
    document.getElementById('instagramFollowers').textContent = 
        data.followers?.toLocaleString() || '0';
}

// Call on dashboard load
loadInstagramMetrics();
```

## 7️⃣ Testing

### Test 1: Check Credentials
```bash
python3 << 'EOF'
import os
print(f"App ID: {os.getenv('INSTAGRAM_APP_ID', 'NOT SET')}")
print(f"App Secret: {os.getenv('INSTAGRAM_APP_SECRET', 'NOT SET')[:10]}...")
EOF
```

### Test 2: Get User Info
```bash
python3 << 'EOF'
from instagram_integration import InstagramAPI

# Replace with your access token
token = "YOUR_ACCESS_TOKEN"
api = InstagramAPI(token)
user_info = api.get_user_info()
print(user_info)
EOF
```

### Test 3: Get Metrics
```bash
python3 << 'EOF'
from instagram_integration import InstagramAPI

token = "YOUR_ACCESS_TOKEN"
api = InstagramAPI(token)
metrics = api.get_all_metrics()
print(metrics)
EOF
```

## 8️⃣ Troubleshooting

### "Access Token Invalid"
```
✗ Solution: Get new access token from Meta App Dashboard
  → Go to Meta App Dashboard → Tools → Access Token Tool
  → Generate new token with needed permissions
```

### "Rate Limit Exceeded"
```
✗ Rate limit: 200 requests/hour
✓ Solution: Results are cached for 30 minutes
  → Wait before making new requests
  → Use batch operations
```

### "User Not Found"
```
✗ Solution: Account setup incomplete
  ✓ Steps:
    1. Ensure Instagram Business Account is set up
    2. Link to Facebook Business Manager
    3. Grant required permissions
    4. Verify access token has correct scopes
```

### "No Metrics Data"
```
✗ Solution: Account needs activity history
  ✓ Steps:
    1. Account needs 7+ days of activity
    2. Make sure profile is public
    3. Check if posts are published
    4. Wait for Instagram to calculate metrics
```

## 9️⃣ Advanced Configuration

### Auto-Sync Every Hour

```python
import threading
import time
from datetime import datetime

def auto_sync_instagram():
    """Background sync every hour"""
    while True:
        try:
            logger.info("Starting Instagram metrics sync...")
            db = InstagramDatabase()
            # Sync all users' metrics
            logger.info("Instagram sync completed")
        except Exception as e:
            logger.error(f"Instagram sync failed: {e}")
        
        # Wait 1 hour
        time.sleep(3600)

# Start in background thread
sync_thread = threading.Thread(target=auto_sync_instagram, daemon=True)
sync_thread.start()
```

### Email Alerts on High Engagement

```python
def check_engagement_milestones(user_id):
    """Alert when follower count reaches milestones"""
    metrics = db.get_user_instagram_metrics(user_id)
    
    milestones = [1000, 5000, 10000, 50000, 100000]
    followers = metrics.get('followers', 0)
    
    for milestone in milestones:
        if followers >= milestone:
            send_email_alert(user_id, f"Reached {milestone} followers!")
```

## 🔟 Production Checklist

- [ ] Instagram App ID configured
- [ ] Instagram App Secret secured
- [ ] OAuth redirect URI matches
- [ ] Database tables created
- [ ] API endpoints implemented
- [ ] Dashboard metrics display tested
- [ ] Auto-sync working
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Access token refresh automated
- [ ] Metrics caching working
- [ ] User can see metrics on dashboard

## 📊 Expected Dashboard Display

When everything is set up:

```
┌─────────────────────────────────────────┐
│ DASHBOARD                               │
├─────────────────────────────────────────┤
│                                         │
│  📊 ROI        💰 Revenue               │
│  $1,234.56     $12,345.67               │
│  +15.2%        +8.3%                    │
│                                         │
│  📷 Instagram  👥 Followers             │
│  1,234         +45 this week            │
│  4.2% engagement                        │
│                                         │
│  📈 Top Posts                           │
│  1. Beach Sunset - 234 likes            │
│  2. Morning Coffee - 189 likes          │
│  3. Team Photo - 156 likes              │
│                                         │
└─────────────────────────────────────────┘
```

---

**Ready?** Start with Step 1 and follow through. You'll have Instagram metrics showing on your dashboard! 🎉
