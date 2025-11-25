# 🚀 Deployment Guide for Synapse Neural Translator

## Option 1: Deploy to GitHub Pages (Free)

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com/) and create a new repository
2. Name it `synapse-neural-translator` (or any name you prefer)
3. Do NOT initialize with README (we already have code)

### Step 2: Push Your Code to GitHub

Open PowerShell in your project directory and run:

```powershell
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit with performance optimizations"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/synapse-neural-translator.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**

### Step 4: Add API Key Secret

1. In your repository, go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `GEMINI_API_KEY`
4. Value: `AIzaSyDyj7pLaaAXgLvqcbREUQMqV7Zk0-M4e40`
5. Click **Add secret**

### Step 5: Update Vite Config

In `vite.config.ts`, change the base path:

```typescript
base: '/synapse-neural-translator/', // Use your repo name here
```

Then commit and push:

```powershell
git add vite.config.ts
git commit -m "Update base path for GitHub Pages"
git push
```

### Step 6: Deploy!

The GitHub Action will automatically build and deploy your app.
- Check the **Actions** tab to see the deployment progress
- Once complete, your app will be available at:
  `https://YOUR_USERNAME.github.io/synapse-neural-translator/`

---

## Option 2: Deploy to Vercel (Recommended - Easier!)

### Why Vercel?
- ✅ Easier setup (1-click deploy)
- ✅ Automatic HTTPS
- ✅ Better performance (edge network)
- ✅ Environment variables UI
- ✅ Automatic deployments on git push

### Steps:

1. **Go to [Vercel](https://vercel.com/)**
2. **Sign up with GitHub** (free account)
3. **Click "Add New Project"**
4. **Import your GitHub repository**
5. **Configure**:
   - Framework Preset: Vite
   - Environment Variable: `API_KEY` = `AIzaSyDyj7pLaaAXgLvqcbREUQMqV7Zk0-M4e40`
6. **Click Deploy**

Done! Your app will be live at `https://your-project.vercel.app` in ~2 minutes.

---

## Option 3: Deploy to Netlify

### Steps:

1. **Go to [Netlify](https://www.netlify.com/)**
2. **Sign up with GitHub**
3. **Click "Add new site" → "Import an existing project"**
4. **Select your GitHub repository**
5. **Configure**:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variable: `API_KEY` = `AIzaSyDyj7pLaaAXgLvqcbREUQMqV7Zk0-M4e40`
6. **Click Deploy**

---

## 🔒 Security Note

**Important**: Your API key will be visible in the browser's JavaScript. For production, consider:
- Using a backend proxy to hide the API key
- Implementing API key restrictions in Google Cloud Console
- Setting up usage limits

### To Secure Your API Key:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click on your API key
3. Add restrictions:
   - **HTTP referrers**: Add your deployment URL
   - **API restrictions**: Restrict to Gemini API only

---

## 🎯 Recommended: Vercel

For the easiest deployment with best performance, I recommend **Vercel**. It takes literally 2 minutes and handles everything automatically.

Would you like help with any of these deployment methods?
