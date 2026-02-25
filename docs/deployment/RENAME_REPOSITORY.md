# 🔄 Rename Repository to "PVB-NEW-WEB"

## 🎯 Renaming Your GitHub Repository

GitHub doesn't allow spaces in repository names, so we'll use: **`PVB-NEW-WEB`**

---

## 📋 Steps to Rename

### Step 1: Rename on GitHub (In GitHub Web UI)

1. Go to your GitHub repository (if you've created it already)
2. Click **Settings** (top right of repository page)
3. Scroll down to **Repository name** section
4. Change the name to: `PVB-NEW-WEB`
5. Click **Rename** button
6. GitHub will automatically update the repository URL

### Step 2: Update Local Git Remote

After renaming on GitHub, update your local repository:

```bash
# If you already have a remote, update it:
git remote set-url origin https://github.com/YOUR_USERNAME/PVB-NEW-WEB.git

# Or if using SSH:
git remote set-url origin git@github.com:YOUR_USERNAME/PVB-NEW-WEB.git

# Verify it worked:
git remote -v
```

### Step 3: Update Netlify Site Name (Optional but Recommended)

1. Go to Netlify dashboard
2. Click your site
3. Go to **Site settings** → **General** → **Site details**
4. Click **Change site name**
5. Rename to: `pvb-new-web` or `pvb-estudio-web`
6. Save

---

## 🆕 If You Haven't Created the Repository Yet

### Create New Repository on GitHub

1. Go to GitHub.com
2. Click **+** (top right) → **New repository**
3. Repository name: `PVB-NEW-WEB`
4. Description: `PVB Estudio Creativo - New Website`
5. Choose Public or Private
6. **DON'T** initialize with README (you already have files)
7. Click **Create repository**

### Connect Your Local Folder

```bash
cd /Users/franciscovialbrown/Documents/GitHub/Shotlist

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - PVB Estudio Creativo website"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/PVB-NEW-WEB.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/PVB-NEW-WEB.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## ✅ After Renaming

Your repository will be:
- **GitHub URL:** `https://github.com/YOUR_USERNAME/PVB-NEW-WEB`
- **Easy to identify:** "PVB NEW WEB" in your GitHub repositories list
- **Still works with Netlify:** Update the connection if needed

---

## 📝 Alternative Names (If You Want)

If you want a different format:
- `PVB-NEW-WEB` (current choice - clear and descriptive)
- `pvb-new-web` (lowercase - more URL-friendly)
- `PVB-Estudio-Web` (includes studio name)
- `pvb-estudio-web` (lowercase version)

**Recommendation:** `PVB-NEW-WEB` - Clear, easy to find, identifies as new website!

---

## 🔗 Update Netlify Connection

If you've already connected Netlify:

1. Go to Netlify dashboard → Your site → **Site settings**
2. Go to **Build & deploy** → **Continuous Deployment**
3. Click **Edit settings**
4. Update repository if needed (should auto-update)
5. Save

---

## ✨ Done!

Once renamed, you'll see **"PVB-NEW-WEB"** in your GitHub repositories, making it easy to identify as your new website!

**Ready to rename? Follow the steps above!** 🚀

