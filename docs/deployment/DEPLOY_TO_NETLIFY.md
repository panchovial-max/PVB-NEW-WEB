# 🚀 Deploy to Netlify - Step by Step Guide

## ⚡ Quick Deploy (5 Minutes)

### Method 1: Drag & Drop (Easiest)

1. **Prepare Your Files**
   ```bash
   cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
   ```
   
   Make sure these files are in the folder:
   - ✅ index.html
   - ✅ styles.css
   - ✅ script.js
   - ✅ pvb-logo.svg

2. **Go to Netlify**
   - Visit: https://www.netlify.com
   - Click **Sign up** (free)
   - Sign up with GitHub, Google, or Email

3. **Deploy**
   - After logging in, you'll see a deploy zone
   - **Drag your Shotlist folder** into the zone
   - Wait 30 seconds
   - ✓ Your site is live!

4. **Get Your URL**
   - Netlify gives you: `random-name-123.netlify.app`
   - Test it: Visit the URL
   - ✓ Your website is live!

---

### Method 2: Netlify CLI (Command Line)

```bash
# Install Netlify CLI (one time)
npm install -g netlify-cli

# Navigate to project
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod

# Follow prompts
```

---

### Method 3: GitHub Integration (Best for Updates)

1. **Push to GitHub** (if not already)
   ```bash
   cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
   git init  # if not already a git repo
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Connect Netlify to GitHub**
   - In Netlify dashboard
   - Click **Add new site** → **Import an existing project**
   - Choose **GitHub**
   - Authorize Netlify
   - Select your repository
   - Click **Deploy site**

3. **Auto-Deploy Setup**
   - Netlify automatically deploys on every `git push`
   - Make changes → Push to GitHub → Site updates automatically!

---

## 🔗 Connect Your Domain: www.panchovial.com

### Step 1: Add Domain in Netlify

1. In Netlify dashboard, click your site
2. Go to **Domain settings**
3. Click **Add custom domain**
4. Enter: `panchovial.com`
5. Also add: `www.panchovial.com`
6. Netlify will show you DNS records

### Step 2: Update DNS at Your Registrar

Netlify will show you something like:

```
A Record:
  Name: @
  Value: 75.2.60.5

CNAME Record:
  Name: www
  Value: your-site-name.netlify.app
```

**Update these at your domain registrar** (GoDaddy, Namecheap, etc.)

### Step 3: Wait for DNS

- Wait 5 minutes to 2 hours
- Visit www.panchovial.com
- ✓ Should work!

---

## 📋 What Files to Include

### ✅ Include (Essential):
- index.html
- styles.css
- script.js
- pvb-logo.svg
- _netlify.toml (optional, helps with redirects)

### ✅ Include (Optional):
- hero-video.mp4 (if exists)
- favicon.ico (if exists)
- Any other images/assets

### ❌ Don't Include:
- api_server.py (backend, not needed)
- *.db files (database)
- *.log files
- node_modules/
- .git/ (optional)

---

## 🎯 After Deployment

Your site will be:
- ✅ Live at https://your-site.netlify.app
- ✅ Fast & secure
- ✅ Mobile-friendly
- ✅ Ready to connect domain

---

## 💡 Pro Tips

1. **Use GitHub Integration** for automatic updates
2. **Add _netlify.toml** for better redirects
3. **Enable Analytics** in Netlify (free tier available)
4. **Use Netlify Forms** for contact form (if needed)

---

**Ready? Let's deploy!** 🚀

