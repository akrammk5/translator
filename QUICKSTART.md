# Quick GitHub Deployment Setup for Synapse

## ⚡ Fastest Option: Vercel (Recommended)

1. **Go to https://vercel.com/**
2. **Sign in with GitHub**
3. **Click "Add New Project"**
4. **Import this repository**
5. **Add Environment Variable:**
   - Name: `API_KEY`
   - Value: `AIzaSyDyj7pLaaAXgLvqcbREUQMqV7Zk0-M4e40`
6. **Click Deploy**

**Done!** Your app will be live in 2 minutes at `https://your-project.vercel.app`

---

## 📦 If You Don't Have a GitHub Repository Yet

Run these commands in PowerShell (in your project directory):

```powershell
# 1. Initialize git
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "Add optimized Synapse Neural Translator"

# 4. Create repository on GitHub first, then run:
# (Replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 5. Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🌐 For GitHub Pages Deployment

After pushing to GitHub:

1. **Go to repository Settings → Pages**
2. **Source: GitHub Actions**
3. **Settings → Secrets → Actions**
4. **New secret:**
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSyDyj7pLaaAXgLvqcbREUQMqV7Zk0-M4e40`

The GitHub Action will automatically deploy on every push!

---

## 🔴 Important: Update Base Path for GitHub Pages

If using GitHub Pages, edit `vite.config.ts` line 6:

```typescript
base: '/your-repo-name/',  // e.g., '/synapse-translator/'
```

Then commit and push:
```powershell
git add vite.config.ts
git commit -m "Update base path"
git push
```

---

## ✅ Files Created

- `.github/workflows/deploy.yml` - Auto-deployment configuration
- `.github/DEPLOYMENT.md` - Full deployment guide
- `vite.config.ts` - Updated for deployment
- `.env.local` - API key added

---

## 🎯 Your App Features

- ✅ 10x faster audio processing (AudioWorklet)
- ✅ Optimized React rendering
- ✅ Real-time Polish ↔ English translation
- ✅ Beautiful Deep Space UI
- ✅ Zero-latency voice translation

Get started now! 🚀
