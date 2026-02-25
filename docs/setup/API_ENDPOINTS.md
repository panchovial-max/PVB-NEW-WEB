# 🎬 SHOTLIST API Endpoints Reference

## Base URL
```
http://localhost:8001
```

## Authentication Endpoints

### Login
**POST** `/api/login`

Traditional email/password login.

**Request:**
```json
{
    "email": "techstartup@example.com",
    "password": "demo123",
    "rememberMe": false
}
```

**Response (Success):**
```json
{
    "success": true,
    "session_id": "3c0c238f-6533-4a5e-8160-d0b5fbd3c74b",
    "user": {
        "user_id": 2,
        "email": "techstartup@example.com",
        "full_name": "Tech Startup Client",
        "role": "client"
    }
}
```

**Response (Error):**
```json
{
    "success": false,
    "message": "User not found. Please check your email or sign up.",
    "error_code": "USER_NOT_FOUND"
}
```

---

## Social Media Configuration Endpoints

### Add Social Media Account
**POST** `/api/social-media/account`

Add a new social media account for a user.

**Request:**
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

**Response (Success):**
```json
{
    "success": true,
    "account_id": 1,
    "message": "Successfully added instagram account"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Missing required fields
- `409` - Account already exists
- `500` - Server error

---

### Get Social Media Accounts
**GET** `/api/social-media/accounts`

Retrieve all connected social media accounts for a user.

**Query Parameters:**
- `user_id` (required, integer) - The user ID

**Example:**
```
GET /api/social-media/accounts?user_id=2
```

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
        },
        {
            "account_id": 2,
            "platform": "facebook",
            "username": "techstartup",
            "account_email": "facebook@techstartup.com",
            "is_connected": 1,
            "connection_date": "2025-10-23 20:12:00",
            "last_sync": "2025-10-23 20:12:00",
            "sync_frequency": "daily"
        }
    ],
    "count": 2
}
```

---

### Update Social Media Settings
**POST** `/api/social-media/settings`

Update user preferences for social media management.

**Request:**
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

**HTTP Status Codes:**
- `200` - Success
- `400` - Missing user_id
- `500` - Server error

---

### Get Social Media Settings
**GET** `/api/social-media/settings`

Retrieve current settings for a user.

**Query Parameters:**
- `user_id` (required, integer) - The user ID

**Example:**
```
GET /api/social-media/settings?user_id=2
```

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

**Request:**
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

**HTTP Status Codes:**
- `200` - Success
- `400` - Missing account_id
- `500` - Server error

---

### Get Audit Log
**GET** `/api/social-media/audit`

Retrieve audit trail for a social media account.

**Query Parameters:**
- `account_id` (required, integer) - The account ID
- `limit` (optional, integer) - Number of records to return (default: 50, max: 500)

**Example:**
```
GET /api/social-media/audit?account_id=1&limit=100
```

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
        },
        {
            "audit_id": 2,
            "action": "SETTINGS_UPDATED",
            "timestamp": "2025-10-23 20:11:21",
            "status": "success",
            "details": "Updated social media settings"
        }
    ],
    "count": 2
}
```

---

## Analytics Endpoints

### Get Campaigns
**GET** `/api/campaigns`

Retrieve campaign data.

**Response:**
```json
{
    "success": true,
    "campaigns": [...]
}
```

---

### Get KPIs
**GET** `/api/kpis`

Retrieve key performance indicators.

**Response:**
```json
{
    "success": true,
    "kpis": {...}
}
```

---

### Get Social Media Metrics
**GET** `/api/social-media`

Retrieve social media performance metrics.

**Response:**
```json
{
    "success": true,
    "social_media": {...}
}
```

---

### Get SEO Metrics
**GET** `/api/seo-metrics`

Retrieve SEO performance metrics.

**Response:**
```json
{
    "success": true,
    "seo": {...}
}
```

---

### Get ROI Trend
**GET** `/api/roi-trend`

Retrieve ROI trend data.

**Response:**
```json
{
    "success": true,
    "roi": [...]}
```

---

### Get Revenue/Cost Data
**GET** `/api/revenue-cost`

Retrieve revenue and cost data.

**Response:**
```json
{
    "success": true,
    "revenue_cost": {...}
}
```

---

## Health & Status Endpoints

### Health Check
**GET** `/api/health`

Check API server status.

**Response:**
```json
{
    "status": "healthy",
    "database": "connected",
    "timestamp": "2025-10-23T20:15:00Z"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
    "success": false,
    "message": "Human-readable error message",
    "error_code": "ERROR_CODE",
    "details": "Optional detailed error information"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `USER_NOT_FOUND` | 401 | User does not exist or invalid credentials |
| `MISSING_REQUIRED_FIELD` | 400 | A required field is missing from request |
| `INVALID_JSON` | 400 | Request body is not valid JSON |
| `DUPLICATE_ACCOUNT` | 409 | Account already exists for this user/platform |
| `ACCOUNT_INACTIVE` | 403 | User account is inactive |
| `INTERNAL_SERVER_ERROR` | 500 | Server error occurred |
| `DATABASE_ERROR` | 500 | Database operation failed |

---

## Rate Limiting

**Current Status**: No rate limiting implemented

Recommended: Add rate limiting in future versions

---

## Authentication

**Current Status**: Session-based via `session_id`

**Future**: JWT token support planned

---

## CORS Headers

All endpoints include:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## Testing

### Using cURL

**Add Account:**
```bash
curl -X POST http://localhost:8001/api/social-media/account \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 2,
    "platform": "instagram",
    "username": "test",
    "account_email": "test@example.com",
    "access_token": "token_xyz"
  }'
```

**Get Accounts:**
```bash
curl http://localhost:8001/api/social-media/accounts?user_id=2
```

**Update Settings:**
```bash
curl -X POST http://localhost:8001/api/social-media/settings \
  -H "Content-Type: application/json" \
  -d '{"user_id": 2, "auto_post": 1, "analytics_enabled": 1}'
```

### Using Python

```python
import requests

# Get accounts
response = requests.get('http://localhost:8001/api/social-media/accounts?user_id=2')
print(response.json())

# Add account
response = requests.post(
    'http://localhost:8001/api/social-media/account',
    json={
        "user_id": 2,
        "platform": "instagram",
        "username": "test",
        "account_email": "test@example.com",
        "access_token": "token_xyz"
    }
)
print(response.json())
```

---

## Webhook Support

**Current Status**: Not implemented

**Planned**: Webhook support for real-time account sync events

---

**Last Updated**: October 23, 2025
**API Version**: 1.0

