# 🚀 SHOTLIST Analytics - Quick Start Guide

## ⚡ 3-Step Setup

### Step 1: Initialize Database
```bash
python3 init_database.py
```

### Step 2: Start Servers
```bash
./start_analytics.sh
```

### Step 3: Open Dashboard
```
http://localhost:8000/dashboard.html
```

---

## 📍 URLs

| Service | URL |
|---------|-----|
| **Dashboard** | http://localhost:8000/dashboard.html |
| **Main Website** | http://localhost:8000 |
| **API** | http://localhost:8001/api |

---

## 🎮 What You Get

### 5 Sample Campaigns
1. Summer Launch 2024 (Social Media)
2. SEO Optimization Q3 (SEO)
3. Holiday Campaign (Paid Ads)
4. Brand Awareness (Social Media)
5. Email Newsletter (Email)

### 660+ Metric Records
- 360 social media metrics
- 150 ROI metrics
- 30 SEO metrics
- 30 email metrics
- 90 paid ads metrics

---

## 📊 Dashboard Features

### KPI Cards
- **ROI**: Overall return on investment
- **Revenue**: Total revenue generated
- **Conversions**: Total conversions
- **ROAS**: Return on ad spend

### Charts
- **ROI Trend**: Line chart over time
- **Revenue vs Cost**: Bar chart comparison

### Social Media
- Instagram, Facebook, LinkedIn, TikTok
- Impressions, engagement, followers

### SEO Metrics
- Organic traffic
- Keyword rankings
- Backlinks
- Domain authority

### Campaign Table
- All campaigns with metrics
- Filter by type and status
- Export to CSV

---

## 🔄 Common Commands

### Start Everything
```bash
./start_analytics.sh
```

### Stop Servers
```bash
kill $(lsof -ti:8000 8001)
```

### Reset Database
```bash
rm shotlist_analytics.db
python3 init_database.py
```

### View API Logs
```bash
tail -f api_server.log
```

### Test API
```bash
curl http://localhost:8001/api/campaigns
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `dashboard.html` | Dashboard UI |
| `dashboard.css` | Dashboard styles |
| `dashboard.js` | Dashboard logic |
| `api_server.py` | REST API backend |
| `shotlist_analytics.db` | SQLite database |
| `start_analytics.sh` | Startup script |

---

## 🎯 Quick Tips

### Filter Data
- Use date range dropdown (7/30/90/365 days)
- Select specific campaign or view all
- Filter by campaign type

### Refresh Data
- Click "Refresh" button in top right
- Data updates automatically

### Export Data
- Click "Export" button
- Downloads CSV file with all data

### View Campaign Details
- Click "View" in campaign table
- Dashboard filters to that campaign

---

## 🐛 Troubleshooting

### "Port already in use"
```bash
kill $(lsof -ti:8000 8001)
./start_analytics.sh
```

### "Database not found"
```bash
python3 init_database.py
```

### "API not responding"
1. Check API is running: `lsof -ti:8001`
2. Restart: `python3 api_server.py &`

### Dashboard shows no data
1. Open browser console (F12)
2. Check for errors
3. Verify API is running on port 8001

---

## 📈 Next Steps

### Add Real Data
1. Modify `init_database.py`
2. Add your campaigns and metrics
3. Run: `python3 init_database.py`

### Customize Dashboard
1. Edit `dashboard.css` for styling
2. Edit `dashboard.js` for functionality
3. Edit `dashboard.html` for layout

### Deploy to Production
1. Choose hosting (Vercel, Heroku, VPS)
2. Set up production database
3. Add authentication
4. Configure SSL

---

## 🎨 Sample Data Overview

### Campaign Performance
- Average ROI: **265%**
- Total Revenue: **$77K**
- Total Conversions: **4,349**
- Average ROAS: **3.65x**

### Social Media Totals
- Impressions: **10.3M**
- Engagement: **754K**
- Reach: **7.7M**
- Followers Gained: **20K**

---

## ✅ System Check

Run this to verify everything is working:

```bash
# Check database
ls -lh shotlist_analytics.db

# Check API
curl http://localhost:8001/api/campaigns

# Check website
curl -I http://localhost:8000/dashboard.html

# Check processes
lsof -ti:8000 8001
```

---

## 🆘 Need Help?

### Check Documentation
- `ANALYTICS_README.md` - Full documentation
- Code comments in each file
- API endpoint descriptions

### Common Issues
- Port conflicts: Kill existing processes
- Database missing: Run init script
- API errors: Check logs

---

## 🎉 You're All Set!

Your campaign analytics system is ready to track ROI, social media performance, SEO metrics, and more!

**Start tracking your campaigns now:**
```bash
./start_analytics.sh
```

Then open: **http://localhost:8000/dashboard.html**

---

**Built by SHOTLIST - Marketing That Works** 🎨
