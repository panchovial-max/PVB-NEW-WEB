# ✅ Deployment Checklist - www.panchovial.com

## 📋 Pre-Deployment Checklist

### Files Ready ✅
- [x] `index.html` - Main homepage
- [x] `styles.css` - All styles
- [x] `script.js` - All JavaScript
- [x] `pvb-logo.svg` - Logo
- [x] `_netlify.toml` - Netlify config (created)
- [ ] `favicon.ico` - Site icon (optional)

### Domain Ready ✅
- [x] Domain: `panchovial.com` (owned at GoDaddy)
- [ ] DNS access: GoDaddy account access

---

## 🚀 Deployment Steps

### Step 1: Deploy to Netlify (5 minutes)

#### Option A: Drag & Drop (Easiest)
1. [ ] Open https://www.netlify.com
2. [ ] Sign up (free) - use GitHub, Google, or Email
3. [ ] After login, you'll see deploy zone
4. [ ] Drag your **Shotlist folder** into the deploy zone
5. [ ] Wait 30 seconds
6. [ ] ✓ Site is live at `random-name-123.netlify.app`
7. [ ] Test the URL - your site should work!

#### Option B: Via Netlify CLI
```bash
# Install Netlify CLI (one time)
npm install -g netlify-cli

# Navigate to project
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

### Step 2: Add Custom Domain (2 minutes)

1. [ ] In Netlify dashboard, click your site
2. [ ] Go to **Domain settings** (left sidebar)
3. [ ] Click **Add custom domain**
4. [ ] Enter: `panchovial.com`
5. [ ] Click **Verify**
6. [ ] Also add: `www.panchovial.com`
7. [ ] Netlify will show DNS records you need

---

### Step 3: Update DNS at GoDaddy (5 minutes)

**Netlify will give you DNS records like:**
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME  
Name: www
Value: your-site-name.netlify.app
```

**In GoDaddy:**
1. [ ] Log into GoDaddy
2. [ ] Go to **My Products**
3. [ ] Click **DNS** next to panchovial.com
4. [ ] In **DNS Records** section:
   - [ ] Add **A Record**: `@` → `75.2.60.5` (from Netlify)
   - [ ] Add **CNAME**: `www` → `your-site.netlify.app` (from Netlify)
5. [ ] Save changes

---

### Step 4: Wait & Test (1-2 hours)

1. [ ] Wait 1-2 hours for DNS propagation
2. [ ] Test: Visit `https://www.panchovial.com`
3. [ ] Test: Visit `https://panchovial.com` (should redirect to www)
4. [ ] ✓ Site is LIVE!

---

## 🔍 Verification

### After Deployment, Check:
- [ ] Site loads at Netlify URL
- [ ] HTTPS works (https://)
- [ ] Logo displays correctly
- [ ] All pages load
- [ ] Mobile responsive
- [ ] WhatsApp widget works
- [ ] Contact form works (if using)

### After DNS Update, Check:
- [ ] www.panchovial.com loads
- [ ] panchovial.com redirects to www
- [ ] HTTPS certificate is active
- [ ] No mixed content warnings

---

## 🆘 Troubleshooting

### Site not loading?
- Check Netlify dashboard for build errors
- Verify all files are in root folder
- Check browser console for errors

### DNS not working?
- Wait 2-4 hours (DNS can take time)
- Use https://dnschecker.org to check propagation
- Verify DNS records match Netlify exactly

### SSL not working?
- Wait up to 24 hours for Let's Encrypt certificate
- Check Netlify SSL settings
- Verify domain is properly added

---

## 📞 Need Help?

If you get stuck:
1. Check Netlify dashboard for errors
2. Verify DNS records are correct
3. Wait a bit longer (DNS can be slow)
4. Let me know and I'll help troubleshoot!

---

## ✨ You're Ready!

Your files are ready to deploy. Just follow the steps above and you'll have your site live at www.panchovial.com in about 10 minutes (plus DNS wait time).

**Good luck! 🚀**

