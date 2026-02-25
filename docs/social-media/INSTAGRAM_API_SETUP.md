# 📱 Instagram API Integration Setup Guide

## Overview
This guide explains how to set up Instagram API to automatically fetch metrics for every user created in the SHOTLIST dashboard.

## Step 1: Create a Meta Business Account

### 1.1 Prerequisites
- Facebook Business Account (create at https://business.facebook.com)
- Business Manager access
- Admin permissions on your business page

### 1.2 Create an App
1. Go to https://developers.facebook.com
2. Click "Create App"
3. Choose "Business" as app type
4. Fill in app details:
   - App Name: "SHOTLIST Analytics"
   - App Purpose: "Analytics & Reporting"
5. Click "Create App"

### 1.3 Add Instagram Product
1. In app dashboard, go to "Add Product"
2. Find "Instagram Graph API"
3. Click "Set Up"
4. Choose "Instagram Basic Display" or "Instagram Graph API"

## Step 2: Get API Credentials

### 2.1 Access Token
1. Go to Settings → Basic
2. Find "App ID" and "App Secret"
3. Generate access token:
   ```
   GET https://graph.instagram.com/v18.0/oauth/authorize?
   client_id=YOUR_APP_ID&
   redirect_uri=http://localhost:8000/oauth/callback/instagram&
   scopes=user_profile,user_media&
   response_type=code
   ```

### 2.2 Long-lived Access Token
Exchange short-lived token for long-lived token (valid 60 days):
```
GET https://graph.instagram.com/v18.0/access_token?
grant_type=ig_refresh_token&
access_token=YOUR_ACCESS_TOKEN
```

## Step 3: Database Configuration

### 3.1 Create Config Table
The system will create tables for storing:
- Instagram access tokens
- User account links
- Cached metrics

### 3.2 Store Credentials
Add to environment or config file:
```
INSTAGRAM_APP_ID=YOUR_APP_ID
INSTAGRAM_APP_SECRET=YOUR_APP_SECRET
INSTAGRAM_REDIRECT_URI=http://localhost:8000/oauth/callback/instagram
```

## Step 4: API Integration Code

### 4.1 Endpoints Available

#### Link Instagram Account
```
POST /api/instagram/connect
{
  "access_token": "YOUR_ACCESS_TOKEN",
  "user_id": "USER_ID"
}
```

#### Get Instagram Metrics
```
GET /api/instagram/metrics?user_id=USER_ID
```

Returns:
```json
{
  "followers": 1234,
  "media_count": 56,
  "engagement_rate": 4.2,
  "reach": 5678,
  "impressions": 12345,
  "profile_views": 2345
}
```

#### Get Media Performance
```
GET /api/instagram/media?user_id=USER_ID&limit=10
```

#### Sync Metrics for All Users
```
POST /api/instagram/sync-all
```

## Step 5: Automatic Metrics on User Creation

### 5.1 When User Registers
1. User creates account
2. API checks for connected Instagram account
3. If connected, fetches:
   - Follower count
   - Media count
   - Engagement rate
   - Top posts
   - Audience demographics

### 5.2 Auto-Update Frequency
- Real-time on user action
- Background sync every 6 hours
- Full sync every 24 hours

## Step 6: Dashboard Display

### 6.1 Metrics Shown
- **Followers**: Total follower count with trend
- **Engagement Rate**: Avg engagement % of followers
- **Reach**: Total weekly reach
- **Impressions**: Total weekly impressions
- **Profile Views**: Weekly profile visits
- **Top Posts**: Best performing 5 posts
- **Audience Insights**: Age, gender, location data

### 6.2 UI Integration
Metrics appear on:
- User dashboard
- Analytics page
- Settings → Linked Accounts

## Step 7: Implementation Checklist

- [ ] Create Meta/Facebook developer account
- [ ] Create app in Meta App Manager
- [ ] Add Instagram Graph API product
- [ ] Get App ID and App Secret
- [ ] Implement OAuth flow for Instagram
- [ ] Create database tables for Instagram data
- [ ] Add API endpoints for metrics
- [ ] Set up automatic sync scheduler
- [ ] Test with sample Instagram account
- [ ] Display metrics in dashboard
- [ ] Add error handling for API limits
- [ ] Implement rate limiting (200 requests/hour limit)

## Step 8: Rate Limits

Instagram Graph API has limits:
- **Throttle**: 200 requests/hour per access token
- **Batch**: Up to 50 requests per batch call
- **Rate**: Cache metrics for 1 hour minimum

Implemented throttling:
```python
# Cache metrics for 1 hour
# Queue batch requests to stay under limit
# Implement exponential backoff for retries
```

## Step 9: Testing

### 9.1 Test Connection
```bash
curl -X GET "https://graph.instagram.com/v18.0/me?fields=id,username&access_token=YOUR_TOKEN"
```

### 9.2 Test Metrics Fetch
```bash
curl -X GET "http://localhost:8000/api/instagram/metrics?user_id=1&access_token=YOUR_TOKEN"
```

### 9.3 Test Auto-Sync
```bash
curl -X POST "http://localhost:8000/api/instagram/sync-all"
```

## Step 10: Production Setup

### 10.1 Environment Variables
```
INSTAGRAM_APP_ID=your_app_id
INSTAGRAM_APP_SECRET=your_app_secret
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/oauth/callback/instagram
INSTAGRAM_SYNC_INTERVAL=3600  # seconds (1 hour)
INSTAGRAM_CACHE_TTL=1800  # seconds (30 minutes)
```

### 10.2 Security
- Never expose access tokens in frontend
- Use HTTPS for all API calls
- Refresh tokens before expiry
- Implement token rotation
- Store tokens encrypted in database

## Step 11: Troubleshooting

### Issue: "Invalid access token"
**Solution**: 
- Verify token hasn't expired
- Refresh token if needed
- Check app permissions

### Issue: "Rate limit exceeded"
**Solution**:
- Wait 1 hour before next request
- Implement caching
- Batch requests efficiently

### Issue: "User not found"
**Solution**:
- Verify Instagram account is linked
- Check access token has correct permissions
- Ensure user profile is public

### Issue: "No metrics data"
**Solution**:
- Account may need 7 days activity history
- Check Business Account is properly set up
- Verify Instagram is linked correctly

## Step 12: Metrics Data Structure

```json
{
  "user_id": 1,
  "instagram_handle": "@username",
  "instagram_id": "12345",
  "followers": 1234,
  "following": 567,
  "media_count": 56,
  "bio": "Account bio",
  "profile_picture_url": "https://...",
  "engagement_metrics": {
    "avg_engagement_rate": 4.2,
    "total_reach": 5678,
    "total_impressions": 12345,
    "saves": 234,
    "shares": 45,
    "comments": 123,
    "likes": 2345
  },
  "audience_insights": {
    "age_ranges": {
      "13-17": 5,
      "18-24": 25,
      "25-34": 40,
      "35-44": 20,
      "45-54": 8,
      "55-64": 2
    },
    "top_countries": ["US", "UK", "CA"],
    "top_cities": ["Los Angeles", "New York", "Toronto"]
  },
  "top_posts": [
    {
      "id": "post1",
      "caption": "Post caption",
      "likes": 234,
      "comments": 12,
      "reach": 1200,
      "impressions": 1800,
      "timestamp": "2024-01-15T10:30:00"
    }
  ],
  "last_sync": "2024-01-15T10:30:00",
  "sync_status": "completed"
}
```

## Next Steps

1. Register as Meta Developer
2. Create business app
3. Configure OAuth credentials
4. Implement database tables
5. Add API endpoints
6. Test with sample account
7. Deploy to production
8. Monitor rate limits
9. Add data visualizations
10. Implement alerts for important metrics

---

**Status**: Ready to implement
**Version**: 1.0.0
**Last Updated**: 2024
