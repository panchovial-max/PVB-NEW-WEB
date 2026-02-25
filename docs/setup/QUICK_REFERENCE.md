# 🎬 SHOTLIST Social Media Configuration - Quick Reference

## 🚀 Get Started in 5 Minutes

### 1. Start the Server
```bash
python3 api_server.py
```

### 2. Add a Social Media Account
```bash
curl -X POST http://localhost:8001/api/social-media/account \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "platform": "instagram",
    "username": "yourhandle",
    "account_email": "email@example.com",
    "access_token": "your_access_token_here"
  }'
```

### 3. View Connected Accounts
```bash
curl http://localhost:8001/api/social-media/accounts?user_id=2
```

### 4. Configure Settings
```bash
curl -X POST http://localhost:8001/api/social-media/settings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "auto_post": 1,
    "analytics_enabled": 1,
    "sync_followers": 1,
    "sync_engagement": 1
  }'
```

---

## 📋 API Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/social-media/account` | Add account |
| GET | `/api/social-media/accounts?user_id=X` | List accounts |
| POST | `/api/social-media/settings` | Update settings |
| GET | `/api/social-media/settings?user_id=X` | Get settings |
| POST | `/api/social-media/disconnect` | Remove account |
| GET | `/api/social-media/audit?account_id=X` | View audit log |

---

## 🎯 Platform Codes
- `instagram` - Instagram
- `facebook` - Facebook
- `tiktok` - TikTok
- `linkedin` - LinkedIn
- `twitter` - Twitter/X
- `youtube` - YouTube
- `snapchat` - Snapchat
- `pinterest` - Pinterest
- `threads` - Threads

---

## 🔧 Settings Configuration

### Available Settings:
```json
{
    "auto_post": 1,              // Enable auto-posting (0=off, 1=on)
    "auto_schedule": 1,          // Enable scheduling (0=off, 1=on)
    "analytics_enabled": 1,      // Track analytics (0=off, 1=on)
    "notifications_enabled": 1,  // Get notifications (0=off, 1=on)
    "sync_followers": 1,         // Sync follower data (0=off, 1=on)
    "sync_engagement": 1,        // Sync engagement metrics (0=off, 1=on)
    "sync_analytics": 1          // Sync analytics (0=off, 1=on)
}
```

---

## 💡 Common Tasks

### Add Multiple Accounts
```bash
# Instagram
curl -X POST http://localhost:8001/api/social-media/account \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "platform": "instagram", "username": "handle", "account_email": "email", "access_token": "token"}'

# Facebook
curl -X POST http://localhost:8001/api/social-media/account \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "platform": "facebook", "username": "handle", "account_email": "email", "access_token": "token"}'

# TikTok
curl -X POST http://localhost:8001/api/social-media/account \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "platform": "tiktok", "username": "handle", "account_email": "email", "access_token": "token"}'
```

### Disconnect Account
```bash
curl -X POST http://localhost:8001/api/social-media/disconnect \
  -H "Content-Type: application/json" \
  -d '{"account_id": 1}'
```

### View Audit Trail
```bash
curl 'http://localhost:8001/api/social-media/audit?account_id=1&limit=100'
```

---

## 🐍 Python Examples

### Import and Use
```python
from social_media_config import SocialMediaConfig

config = SocialMediaConfig()

# Add account
result = config.add_social_account(
    user_id=2,
    platform='instagram',
    username='yourhandle',
    account_email='email@example.com',
    access_token='your_token'
)
print(result)

# Get accounts
accounts = config.get_user_accounts(2)
print(f"User has {len(accounts['accounts'])} connected accounts")

# Update settings
config.update_account_settings(2, {
    'auto_post': 1,
    'analytics_enabled': 1
})

# Get audit log
audit = config.get_account_audit_log(1)
print(f"Found {len(audit['logs'])} audit entries")
```

---

## ✅ Test Users

### Client Account
- Email: `techstartup@example.com`
- Password: `demo123`
- User ID: 2

### Other Test Clients
- `ecommerce@example.com` / `demo123` (User ID: 3)
- `fashionbrand@example.com` / `demo123` (User ID: 4)
- `restaurant@example.com` / `demo123` (User ID: 5)
- `saascompany@example.com` / `demo123` (User ID: 6)

### Admin Account
- Email: `admin@shotlist.com`
- Password: `admin123`
- User ID: 1

---

## 🐛 Troubleshooting

### "Account already exists" Error
- User trying to add same account twice
- **Solution**: Disconnect first, then add again

### "Missing required field" Error
- One or more fields missing in request
- **Solution**: Ensure all fields present: `user_id`, `platform`, `username`, `account_email`, `access_token`

### "User not found" Error
- Invalid user_id
- **Solution**: Use valid user_id from test accounts above

### Database Locked Error
- Multiple concurrent requests
- **Solution**: Retry request after 1-2 seconds

---

## 📊 Response Format

### Success Response
```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response
```json
{
    "success": false,
    "message": "Human-readable error message",
    "error_code": "ERROR_CODE"
}
```

---

## 🔗 Resources

- **Full Guide**: `SOCIAL_MEDIA_CONFIG_GUIDE.md`
- **API Reference**: `API_ENDPOINTS.md`
- **Implementation Details**: `SOCIAL_MEDIA_IMPLEMENTATION_SUMMARY.md`
- **Python Module**: `social_media_config.py`
- **Test Suite**: `test_social_media_config.py`

---

## 🎓 Need Help?

1. Check the Full Guide: `SOCIAL_MEDIA_CONFIG_GUIDE.md`
2. Review API Reference: `API_ENDPOINTS.md`
3. Run test suite: `python3 test_social_media_config.py`
4. Check audit logs for operation history

---

**Version**: 1.0  
**Last Updated**: October 23, 2025  
**Status**: ✅ Production Ready

