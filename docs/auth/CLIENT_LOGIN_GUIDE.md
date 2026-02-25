# 🔐 Client Login Guide - WORKING ✅

## Quick Start

### Step 1: Start the Servers
```bash
# Terminal 1 - Start API Server
python3 api_server.py

# Terminal 2 - Start Website Server (if needed)
python3 -m http.server 8000
```

### Step 2: Access Login Page
Open your browser and navigate to:
```
http://localhost:8000/login.html
```

### Step 3: Login with Test Credentials

All test accounts use password: **`demo123`**

#### Client Accounts:
1. **Tech Startup**
   - Email: `techstartup@example.com`
   - Password: `demo123`

2. **E-commerce**
   - Email: `ecommerce@example.com`
   - Password: `demo123`

3. **Fashion Brand**
   - Email: `fashionbrand@example.com`
   - Password: `demo123`

4. **Restaurant**
   - Email: `restaurant@example.com`
   - Password: `demo123`

5. **SaaS Company**
   - Email: `saascompany@example.com`
   - Password: `demo123`

#### Admin Account:
- Email: `admin@shotlist.com`
- Password: `admin123`

---

## Login Features

### ✅ Features Included

1. **Quick Login Buttons**
   - Click any client profile to auto-fill credentials
   - One-click login for testing

2. **Manual Login**
   - Enter email and password
   - "Remember me" option
   - "Forgot password" link

3. **Debug Console**
   - Click "Toggle Debug Info" for detailed logs
   - Network status display
   - Error messages and timestamps

4. **Error Handling**
   - Clear error messages
   - Network status detection
   - Server connectivity checks

---

## API Testing

### Test Login via cURL

```bash
curl -X POST http://localhost:8001/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "techstartup@example.com",
    "password": "demo123"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "session_id": "ac2bebe4-8c04-433e-a869-6e55ec990758",
  "user": {
    "user_id": 2,
    "email": "techstartup@example.com",
    "full_name": "Tech Startup Client",
    "role": "client"
  }
}
```

---

## Troubleshooting

### Issue: "Server error please try again"
**Solution:** 
1. Ensure API server is running on port 8001
2. Check if database exists: `ls -la shotlist_analytics.db`
3. Reinitialize database: `python3 init_database.py`

### Issue: "User not found"
**Solution:**
1. Verify email address is correct
2. Ensure database was initialized with users
3. Check test credentials above

### Issue: Database locked error
**Solution:**
```bash
# Kill all Python processes
pkill -9 -f "python"

# Remove lock files
rm -f shotlist_analytics.db-wal shotlist_analytics.db-shm

# Reinitialize and restart
python3 init_database.py && sleep 2 && python3 api_server.py
```

---

## What Happens After Login

1. **Session Created**
   - Unique session_id generated
   - User information returned
   - Session stored in browser localStorage

2. **Access Dashboard**
   - User redirected to dashboard
   - Campaign analytics displayed
   - Real-time metrics shown

3. **Social Media Integration**
   - Connected accounts visible
   - Campaign performance tracked
   - ROI calculations displayed

---

## API Endpoints

### Authentication
- **POST** `/api/login` - Login with email/password
- **GET** `/api/health` - Check server status

### Dashboard Data
- **GET** `/api/campaigns` - Get campaign list
- **GET** `/api/kpis` - Get KPI metrics
- **GET** `/api/social-media` - Get social media stats
- **GET** `/api/roi-trend` - Get ROI trends

### Social Media
- **POST** `/api/social-media/account` - Add social account
- **GET** `/api/social-media/accounts?user_id=X` - List accounts
- **POST** `/api/social-media/settings` - Update settings
- **GET** `/api/social-media/metrics/daily?account_id=X&platform=Y` - Get metrics

---

## Server Status

### Check if Servers are Running

```bash
# Check API Server (port 8001)
lsof -i :8001

# Check Website Server (port 8000)
lsof -i :8000
```

### Start Fresh

```bash
# Kill all running servers
pkill -9 -f "python"

# Reinitialize database
python3 init_database.py

# Start API server
python3 api_server.py &

# Start website server (optional)
python3 -m http.server 8000 &
```

---

## Security Notes

⚠️ **These are test credentials - NOT for production use!**

- Passwords are hashed with SHA-256
- Sessions are UUID-based
- All credentials stored securely in SQLite
- Login attempts are logged

---

## Next Steps

After logging in:
1. ✅ View dashboard and analytics
2. ✅ Configure social media accounts
3. ✅ Monitor campaign performance
4. ✅ Check social media metrics
5. ✅ View audience insights
6. ✅ Calculate ROI and ROAS

---

**Status**: ✅ All Client Logins Working
**Last Updated**: October 24, 2025

