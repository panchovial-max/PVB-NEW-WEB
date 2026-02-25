# 🚀 GitHub Actions + Netlify Auto-Deploy Setup

## ✅ Two Ways to Auto-Deploy to Netlify

### Option 1: Netlify GitHub Integration (Easiest - Recommended!) ⭐

**This is the simplest way - no GitHub Actions needed!**

1. **In Netlify Dashboard:**
   - Go to your site in Netlify
   - Go to **Site settings** → **Build & deploy** → **Continuous Deployment**
   - Click **Link to Git provider**
   - Choose **GitHub**
   - Authorize Netlify to access your GitHub
   - Select your repository: `Shotlist`
   - Configure:
     - **Branch to deploy:** `main` (or `master`)
     - **Build command:** (leave empty - no build needed)
     - **Publish directory:** `.` (root folder)
   - Click **Deploy site**

2. **That's it!** Now every time you push to GitHub, Netlify auto-deploys!

---

### Option 2: GitHub Actions (More Control)

**Use this if you want more control or CI/CD features.**

#### Step 1: Get Netlify Token

1. Go to Netlify dashboard
2. Click your profile (top right)
3. Go to **User settings** → **Applications** → **Personal access tokens**
4. Click **New access token**
5. Name it: `GitHub Actions Deploy`
6. Copy the token (you'll need it!)

#### Step 2: Get Netlify Site ID

1. In Netlify dashboard, click your site
2. Go to **Site settings** → **General** → **Site information**
3. Copy the **Site ID** (looks like: `abc123-def456-ghi789`)

#### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

   **Secret 1:**
   - Name: `NETLIFY_AUTH_TOKEN`
   - Value: (paste your Netlify token from Step 1)

   **Secret 2:**
   - Name: `NETLIFY_SITE_ID`
   - Value: (paste your Site ID from Step 2)

5. Click **Add secret** for each

#### Step 4: Push to GitHub

The workflow file is already created! Just:

```bash
# If you haven't initialized git yet
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist
git init
git add .
git commit -m "Initial commit - Ready for Netlify auto-deploy"

# If you already have a repo
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

#### Step 5: Watch It Deploy!

1. Go to GitHub → Your repository → **Actions** tab
2. You'll see the workflow running
3. Wait 1-2 minutes
4. ✓ Deployment complete!
5. Check Netlify dashboard to see your site deployed

---

## 🔄 How It Works

### With Netlify GitHub Integration (Option 1):
- Push to GitHub → Netlify automatically detects → Deploys
- No GitHub Actions needed
- Simpler setup

### With GitHub Actions (Option 2):
- Push to GitHub → GitHub Actions runs → Deploys to Netlify
- More control and CI/CD features
- Can add tests, builds, etc.

---

## 📋 What Gets Deployed

The workflow deploys these files:
- ✅ `index.html`
- ✅ `styles.css`
- ✅ `script.js`
- ✅ `pvb-logo.svg`
- ✅ `_netlify.toml` (config file)

---

## 🎯 Recommended: Option 1 (Netlify Integration)

**Why?**
- ✅ Easier setup (no secrets to manage)
- ✅ Built into Netlify
- ✅ Works automatically
- ✅ Preview deployments for PRs

**Just connect GitHub in Netlify dashboard!**

---

## 🆘 Troubleshooting

### Deployment fails?
- Check GitHub Actions logs (if using Option 2)
- Check Netlify deploy logs
- Verify secrets are set correctly (if using Option 2)
- Make sure files are in root folder

### Changes not deploying?
- Push to `main` or `master` branch
- Check Netlify build logs
- Verify GitHub connection in Netlify (Option 1)

---

## ✨ Next Steps

1. **Choose Option 1** (easiest) or Option 2 (more control)
2. **Set up the connection**
3. **Push to GitHub**
4. **Watch it auto-deploy!**

**Every time you push code → Site updates automatically!** 🚀

---

## 📝 Files Created

- ✅ `.github/workflows/deploy-to-netlify.yml` - GitHub Actions workflow
- ✅ `_netlify.toml` - Netlify configuration (already created)
- ✅ This guide!

**Ready to auto-deploy!** 🎉

