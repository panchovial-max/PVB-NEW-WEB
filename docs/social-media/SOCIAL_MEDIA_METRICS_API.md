# 📊 Social Media Metrics & Analytics API - Complete Backend Configuration

## Overview

Comprehensive backend system for collecting, analyzing, and reporting real social media metrics across all platforms (Instagram, Facebook, TikTok, LinkedIn, Twitter, YouTube, etc.).

## Key Features

✅ **Real-Time Metrics Collection**
- Daily metrics recording
- Individual post/content performance tracking
- Audience demographic analysis
- Campaign ROI calculations

✅ **Multi-Platform Support**
- Instagram, Facebook, TikTok
- LinkedIn, Twitter/X, YouTube
- Snapchat, Pinterest, Threads
- Easily extensible for custom platforms

✅ **Comprehensive Analytics**
- Follower growth tracking
- Engagement rate analysis
- Reach and impressions metrics
- Content performance rankings
- Audience demographics
- Campaign ROI & ROAS

✅ **Data Persistence**
- SQLite database storage
- Historical data tracking
- Time-series analytics
- Audit logging

## Database Schema

### 1. Social Media Daily Metrics Table
Stores daily aggregated metrics for each account

```sql
social_media_daily_metrics
├─ metric_id (Primary Key)
├─ account_id (Foreign Key)
├─ platform (instagram, facebook, etc.)
├─ date
├─ followers, engagement_rate
├─ reach, impressions
├─ shares, comments, likes
├─ clicks, saves, video_views
├─ profile_visits, mentions
└─ created_at timestamp
```

**Tracked Metrics:**
- `followers` - Total follower count
- `engagement_rate` - % engagement (0-100)
- `reach` - Unique users reached
- `impressions` - Total content impressions
- `shares` - Number of shares
- `comments` - Total comments
- `likes` - Total likes
- `clicks` - Link clicks
- `saves` - Content saves
- `video_views` - Video view count
- `profile_visits` - Profile visits
- `mentions` - Account mentions

### 2. Content Performance Table
Tracks individual post/content performance

```sql
content_performance
├─ content_id (Primary Key)
├─ account_id (Foreign Key)
├─ platform
├─ post_id, post_type (carousel, video, image, etc.)
├─ caption, hashtags
├─ posted_at timestamp
├─ likes, comments, shares, saves
├─ views, reach, engagement_rate
└─ created_at timestamp
```

### 3. Audience Demographics Table
Records audience demographic breakdowns

```sql
audience_demographics
├─ demographic_id (Primary Key)
├─ account_id (Foreign Key)
├─ platform, date
├─ age_13_17, age_18_24, age_25_34, age_35_44
├─ age_45_54, age_55_64, age_65_plus
├─ male_percentage, female_percentage
├─ top_countries (JSON)
├─ top_cities (JSON)
└─ created_at timestamp
```

### 4. Campaign Social Metrics Table
Tracks campaign-specific metrics and ROI

```sql
campaign_social_metrics
├─ campaign_metric_id (Primary Key)
├─ account_id, campaign_id
├─ platform, start_date, end_date
├─ total_reach, total_impressions
├─ total_engagement, engagement_rate
├─ conversion_rate, cost_per_engagement
├─ cost_per_reach, revenue_generated
├─ roi
└─ created_at timestamp
```

## API Endpoints

### POST Endpoints

#### 1. Record Daily Metrics
**POST** `/api/social-media/metrics/daily`

Record daily social media metrics for an account.

**Request:**
```json
{
  "account_id": 1,
  "platform": "instagram",
  "followers": 15250,
  "engagement_rate": 4.8,
  "reach": 50000,
  "impressions": 125000,
  "shares": 450,
  "comments": 2100,
  "likes": 8950,
  "clicks": 1200,
  "saves": 350,
  "video_views": 75000,
  "profile_visits": 2500,
  "mentions": 120
}
```

**Response:**
```json
{
  "success": true,
  "message": "Daily metrics recorded",
  "date": "2025-10-23"
}
```

---

#### 2. Record Content Performance
**POST** `/api/social-media/metrics/content`

Track individual post/content performance metrics.

**Request:**
```json
{
  "account_id": 1,
  "platform": "instagram",
  "post_id": "post_123456",
  "post_type": "carousel",
  "caption": "Amazing product launch! 🚀",
  "hashtags": "#launch #product #innovation",
  "posted_at": "2025-10-23T10:30:00",
  "likes": 2450,
  "comments": 320,
  "shares": 180,
  "saves": 150,
  "views": 45000,
  "reach": 38000,
  "engagement_rate": 7.2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content performance recorded"
}
```

---

#### 3. Record Audience Demographics
**POST** `/api/social-media/metrics/audience`

Record audience demographic breakdowns.

**Request:**
```json
{
  "account_id": 1,
  "platform": "instagram",
  "age_13_17": 2.5,
  "age_18_24": 18.3,
  "age_25_34": 35.2,
  "age_35_44": 25.8,
  "age_45_54": 12.1,
  "age_55_64": 4.8,
  "age_65_plus": 1.3,
  "male_percentage": 42.5,
  "female_percentage": 57.5,
  "top_countries": "['USA', 'UK', 'Canada', 'Australia', 'Germany']",
  "top_cities": "['New York', 'Los Angeles', 'London', 'Toronto', 'Sydney']"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Demographics recorded"
}
```

---

#### 4. Calculate Campaign ROI
**POST** `/api/social-media/metrics/roi`

Calculate campaign ROI and performance metrics.

**Request:**
```json
{
  "account_id": 1,
  "platform": "instagram",
  "campaign_id": "campaign_2025_q4",
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "cost": 5000,
  "revenue": 25000,
  "conversions": 150,
  "impressions": 500000,
  "reach": 150000
}
```

**Response:**
```json
{
  "success": true,
  "roi": 400.0,
  "roas": 5.0,
  "conversion_rate": 0.03,
  "cost_per_conversion": 33.33,
  "cost_per_reach": 0.0333
}
```

### GET Endpoints

#### 1. Get Daily Metrics
**GET** `/api/social-media/metrics/daily?account_id=1&platform=instagram&days=30`

Retrieve daily metrics for a specified period.

**Parameters:**
- `account_id` (required) - Account ID
- `platform` (required) - Platform name
- `days` (optional) - Number of days to retrieve (default: 30)

**Response:**
```json
{
  "success": true,
  "metrics": [
    {
      "metric_id": 1,
      "account_id": 1,
      "platform": "instagram",
      "date": "2025-10-23",
      "followers": 15250,
      "engagement_rate": 4.8,
      "reach": 50000,
      "impressions": 125000,
      ...
    }
  ],
  "count": 1,
  "platform": "instagram"
}
```

---

#### 2. Get Performance Summary
**GET** `/api/social-media/metrics/summary?account_id=1&platform=instagram`

Get performance summary with growth trends.

**Parameters:**
- `account_id` (required)
- `platform` (required)

**Response:**
```json
{
  "success": true,
  "summary": {
    "platform": "instagram",
    "current_followers": 15250,
    "growth_30d": 500,
    "growth_rate": 3.39,
    "avg_engagement": 4.8,
    "reach_30d": 1500000,
    "impressions_30d": 3750000,
    "latest_update": "2025-10-23"
  }
}
```

---

#### 3. Get Top Content
**GET** `/api/social-media/metrics/content?account_id=1&platform=instagram&limit=10`

Get top performing content/posts.

**Parameters:**
- `account_id` (required)
- `platform` (required)
- `limit` (optional) - Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "top_content": [
    {
      "content_id": 1,
      "post_id": "post_123456",
      "post_type": "carousel",
      "caption": "Amazing product launch! 🚀",
      "likes": 2450,
      "comments": 320,
      "engagement_rate": 7.2,
      ...
    }
  ],
  "count": 1
}
```

---

#### 4. Get Audience Insights
**GET** `/api/social-media/metrics/audience?account_id=1&platform=instagram`

Get audience demographic insights.

**Parameters:**
- `account_id` (required)
- `platform` (required)

**Response:**
```json
{
  "success": true,
  "demographics": {
    "demographic_id": 1,
    "platform": "instagram",
    "date": "2025-10-23",
    "age_13_17": 2.5,
    "age_18_24": 18.3,
    "age_25_34": 35.2,
    "male_percentage": 42.5,
    "female_percentage": 57.5,
    "top_countries": "['USA', 'UK', 'Canada']",
    "top_cities": "['New York', 'Los Angeles', 'London']"
  }
}
```

## Key Metrics Explained

### Engagement Rate
**Formula:** `(likes + comments + shares + saves) / reach * 100`

The percentage of people who engaged with content out of total reach.

### ROI (Return on Investment)
**Formula:** `((revenue - cost) / cost) * 100`

Percentage return on advertising spend.

### ROAS (Return on Ad Spend)
**Formula:** `revenue / cost`

Revenue generated per dollar spent (should be > 1).

### Cost Per Reach (CPR)
**Formula:** `cost / reach`

Average cost to reach one person.

### Cost Per Conversion (CPC)
**Formula:** `cost / conversions`

Average cost to achieve one conversion.

### Conversion Rate
**Formula:** `(conversions / impressions) * 100`

Percentage of impressions that converted.

## Performance Metrics

### Tracked for Each Platform
- Daily Followers
- Engagement Rate
- Reach & Impressions
- Content Engagement
- Audience Demographics
- Campaign Performance
- ROI & ROAS

### Time-Series Analytics
- 7-day trends
- 30-day aggregates
- Monthly summaries
- Year-over-year comparisons

## Use Cases

### 1. Campaign Performance Tracking
Monitor how campaigns perform across different platforms in real-time.

### 2. Content Strategy Optimization
Identify top-performing content types and optimize accordingly.

### 3. Audience Analysis
Understand audience demographics and adapt content strategy.

### 4. ROI Measurement
Calculate exact ROI for each campaign and platform.

### 5. Growth Monitoring
Track follower growth and engagement trends over time.

## Integration with Dashboard

The metrics system integrates seamlessly with the dashboard to provide:
- Real-time performance graphs
- Comparative analytics
- Trend analysis
- Content recommendations
- Performance alerts

## Testing

### Test Adding Daily Metrics
```bash
curl -X POST 'http://localhost:8001/api/social-media/metrics/daily' \
  -H 'Content-Type: application/json' \
  -d '{
    "account_id": 1,
    "platform": "instagram",
    "followers": 15250,
    "engagement_rate": 4.8,
    "reach": 50000,
    "impressions": 125000
  }'
```

### Test Retrieving Metrics
```bash
curl 'http://localhost:8001/api/social-media/metrics/daily?account_id=1&platform=instagram&days=30'
```

### Test Performance Summary
```bash
curl 'http://localhost:8001/api/social-media/metrics/summary?account_id=1&platform=instagram'
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad request (missing parameters)
- `404` - Data not found
- `500` - Server error

## Future Enhancements

- [ ] Real-time data streaming
- [ ] Machine learning predictions
- [ ] Anomaly detection
- [ ] Automated alerts
- [ ] Export to external tools
- [ ] API rate limiting
- [ ] Batch operations
- [ ] Webhook integrations
- [ ] Historical data archiving
- [ ] Advanced filtering options

---

**Status**: ✅ Complete and Production Ready
**Version**: 1.0
**Last Updated**: October 24, 2025

