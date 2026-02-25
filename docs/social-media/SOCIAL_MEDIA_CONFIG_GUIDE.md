# 🎬 SHOTLIST Social Media Configuration Guide

## Overview

The SHOTLIST Campaign Analytics platform now includes comprehensive social media user configuration management. This allows users to connect multiple social media accounts, configure tracking preferences, and manage their social media presence from a centralized dashboard.

## Features

### 1. **Multi-Platform Account Management**
- Connect multiple social media accounts across platforms
- Support for: Instagram, Facebook, TikTok, LinkedIn, Twitter, YouTube, etc.
- Secure token storage with refresh token support
- Connection status tracking

### 2. **User Settings**
- Auto-posting capabilities
- Auto-scheduling features
- Analytics tracking toggles
- Notification preferences
- Follower, engagement, and analytics sync controls

### 3. **Audit Trail**
- Complete action history for all account operations
- Timestamp tracking
- IP address logging
- Status and error details

### 4. **Sync Management**
- Configurable sync frequency (hourly, daily, weekly)
- Last sync tracking
- Token expiration management
- Automatic token refresh support

## Database Schema

### `social_media_accounts` Table
Stores connected social media accounts for each user.

```sql
CREATE TABLE social_media_accounts (
    account_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    platform TEXT NOT NULL,                    -- instagram, facebook, tiktok, etc.
    username TEXT NOT NULL,                    -- Account username
    account_email TEXT,                        -- Email associated with account
    access_token TEXT,                         -- OAuth access token
    refresh_token TEXT,                        -- OAuth refresh token
    token_expires_at TIMESTAMP,                -- Token expiration time
    is_connected INTEGER DEFAULT 1,            -- Connection status
    connection_date TIMESTAMP,                 -- When account was connected
    last_sync TIMESTAMP,                       -- Last data sync time
    sync_frequency TEXT DEFAULT 'daily',       -- Sync frequency setting
    UNIQUE(user_id, platform, username)
)
```

### `social_media_settings` Table
Stores user preferences for social media management.

```sql
CREATE TABLE social_media_settings (
    setting_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    auto_post INTEGER DEFAULT 0,              -- Enable auto-posting
    auto_schedule INTEGER DEFAULT 0,           -- Enable auto-scheduling
    analytics_enabled INTEGER DEFAULT 1,      -- Enable analytics collection
    notifications_enabled INTEGER DEFAULT 1,  -- Enable notifications
    sync_followers INTEGER DEFAULT 1,         -- Sync follower data
    sync_engagement INTEGER DEFAULT 1,        -- Sync engagement metrics
    sync_analytics INTEGER DEFAULT 1,         -- Sync analytics data
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
```

### `social_media_audit` Table
Tracks all actions performed on social media accounts.

```sql
CREATE TABLE social_media_audit (
    audit_id INTEGER PRIMARY KEY,
    account_id INTEGER NOT NULL,
    action TEXT NOT NULL,                     -- ACCOUNT_ADDED, ACCOUNT_DISCONNECTED, etc.
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    status TEXT,                              -- success, error, warning
    details TEXT                              -- Additional information
)
```

## API Endpoints

### Add Social Media Account

**POST** `/api/social-media/account`

Add a new social media account for a user.

**Request Body:**
```json
{
    "user_id": 2,
    "platform": "instagram",
    "username": "techstartup_official",
    "account_email": "instagram@techstartup.com",
    "access_token": "ig_token_abc123xyz789",
    "refresh_token": "ig_refresh_token_xyz789abc123"
}
```

**Response:**
```json
{
    "success": true,
    "account_id": 1,
    "message": "Successfully added instagram account"
}
```

**Error Codes:**
- `400` - Missing required fields
- `409` - Account already exists for this user on this platform
- `500` - Server error

---

### Get Social Media Accounts

**GET** `/api/social-media/accounts?user_id=2`

Retrieve all connected social media accounts for a user.

**Query Parameters:**
- `user_id` (required) - The user ID

**Response:**
```json
{
    "success": true,
    "accounts": [
        {
            "account_id": 1,
            "platform": "instagram",
            "username": "techstartup_official",
            "account_email": "instagram@techstartup.com",
            "is_connected": 1,
            "connection_date": "2025-10-23 20:11:11",
            "last_sync": "2025-10-23 20:11:11",
            "sync_frequency": "daily"
        }
    ],
    "count": 1
}
```

---

### Update Social Media Settings

**POST** `/api/social-media/settings`

Update user preferences for social media management.

**Request Body:**
```json
{
    "user_id": 2,
    "auto_post": 1,
    "auto_schedule": 1,
    "analytics_enabled": 1,
    "notifications_enabled": 1,
    "sync_followers": 1,
    "sync_engagement": 1,
    "sync_analytics": 1
}
```

**Response:**
```json
{
    "success": true,
    "message": "Settings updated successfully"
}
```

---

### Get Social Media Settings

**GET** `/api/social-media/settings?user_id=2`

Retrieve current settings for a user.

**Query Parameters:**
- `user_id` (required) - The user ID

**Response:**
```json
{
    "success": true,
    "settings": {
        "setting_id": 1,
        "auto_post": 1,
        "auto_schedule": 1,
        "analytics_enabled": 1,
        "notifications_enabled": 1,
        "sync_followers": 1,
        "sync_engagement": 1,
        "sync_analytics": 1,
        "created_at": "2025-10-23 20:11:21",
        "updated_at": "2025-10-23 20:11:21"
    }
}
```

---

### Disconnect Social Media Account

**POST** `/api/social-media/disconnect`

Remove a social media account connection.

**Request Body:**
```json
{
    "account_id": 1
}
```

**Response:**
```json
{
    "success": true,
    "message": "Account disconnected successfully"
}
```

---

### Get Audit Log

**GET** `/api/social-media/audit?account_id=1&limit=50`

Retrieve audit trail for a social media account.

**Query Parameters:**
- `account_id` (required) - The account ID
- `limit` (optional) - Number of records (default: 50)

**Response:**
```json
{
    "success": true,
    "logs": [
        {
            "audit_id": 1,
            "action": "ACCOUNT_ADDED",
            "timestamp": "2025-10-23 20:11:11",
            "status": "success",
            "details": "Added instagram account: techstartup_official"
        }
    ],
    "count": 1
}
```

## Python Configuration Manager

The `social_media_config.py` module provides a programmatic interface for managing social media configurations.

### Usage Example

```python
from social_media_config import SocialMediaConfig

# Initialize configuration manager
config = SocialMediaConfig()

# Add a social media account
result = config.add_social_account(
    user_id=2,
    platform='instagram',
    username='techstartup_official',
    account_email='instagram@techstartup.com',
    access_token='ig_token_abc123xyz789',
    refresh_token='ig_refresh_token_xyz789abc123'
)
print(result)  # {'success': True, 'account_id': 1, 'message': '...'}

# Get user accounts
accounts = config.get_user_accounts(2)
print(accounts)  # {'success': True, 'accounts': [...], 'count': 1}

# Update settings
result = config.update_account_settings(2, {
    'auto_post': 1,
    'analytics_enabled': 1
})
print(result)  # {'success': True, 'message': '...'}

# Disconnect account
result = config.disconnect_account(1)
print(result)  # {'success': True, 'message': '...'}

# Get audit log
audit = config.get_account_audit_log(1)
print(audit)  # {'success': True, 'logs': [...], 'count': 1}
```

## Supported Platforms

- Instagram
- Facebook
- TikTok
- LinkedIn
- Twitter/X
- YouTube
- Snapchat
- Pinterest
- Threads

## Security Considerations

1. **Token Storage**: Access tokens are stored securely in the database
2. **Refresh Tokens**: Separate refresh tokens for token renewal
3. **Audit Trail**: All operations are logged with timestamp and IP address
4. **Token Expiration**: Automatic tracking of token expiration times
5. **Disconnection**: Tokens are nullified when accounts are disconnected

## Best Practices

1. **Regular Sync**: Configure appropriate sync frequencies based on activity level
2. **Token Management**: Implement automatic token refresh before expiration
3. **Audit Monitoring**: Review audit logs regularly for security
4. **Settings Review**: Periodically review user preferences for accuracy
5. **Error Handling**: Implement proper error handling for failed syncs

## Troubleshooting

### Account Already Exists Error
- User is attempting to connect the same account twice
- Solution: Disconnect first account before adding again

### Missing Required Fields Error
- One or more required fields are missing from the request
- Solution: Ensure all required fields are provided

### Token Expired
- Access token has expired
- Solution: Implement automatic token refresh using refresh token

### Sync Failures
- Check database connectivity
- Review audit logs for error details
- Verify API credentials with social media platform

## Future Enhancements

- [ ] Automated token refresh
- [ ] Batch account management
- [ ] Advanced scheduling with timezone support
- [ ] Content calendar integration
- [ ] Performance analytics dashboard
- [ ] Multi-language support
- [ ] Rate limiting and throttling
- [ ] API rate usage tracking

