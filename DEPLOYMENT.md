# Render Deployment Guide

This guide will walk you through deploying the "Listen, You Are Loved" application on Render.

## Prerequisites

1. A GitHub account
2. A Render account (sign up at [render.com](https://render.com))
3. An OpenAI API key ([get one here](https://platform.openai.com/api-keys))

## Step-by-Step Deployment Instructions

### Step 1: Push Your Code to GitHub

1. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for Render deployment"
   ```

2. **Create a new repository on GitHub**:
   - Go to [github.com](https://github.com) and create a new repository
   - Name it `listen-you-are-loved` (or any name you prefer)
   - **Do NOT** initialize with README, .gitignore, or license

3. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/listen-you-are-loved.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Deploy on Render

1. **Log in to Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Sign in or create a free account

2. **Create a New Web Service**:
   - Click the **"New +"** button in the top right
   - Select **"Web Service"**

3. **Connect Your Repository**:
   - Click **"Connect account"** if you haven't connected GitHub yet
   - Authorize Render to access your GitHub repositories
   - Select your `listen-you-are-loved` repository
   - Click **"Connect"**

4. **Configure Your Service**:
   - **Name**: `listen-you-are-loved` (or any name you prefer)
   - **Region**: Choose the closest region to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (defaults to repository root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (should auto-populate)
   - **Start Command**: `npm start` (should auto-populate)
   - **Plan**: Select **Free** (or upgrade if needed)

5. **Set Environment Variables**:
   - Scroll down to the **"Environment Variables"** section
   - Click **"Add Environment Variable"**
   - Add the following:
     - **Key**: `NODE_ENV`
     - **Value**: `production`
   - Click **"Add Environment Variable"** again:
     - **Key**: `OPENAI_API_KEY`
     - **Value**: Your OpenAI API key (starts with `sk-`)
     - ⚠️ **Important**: Keep this secret! Never share it publicly.

6. **Deploy**:
   - Click **"Create Web Service"** at the bottom
   - Render will start building and deploying your application
   - This process typically takes 2-5 minutes

### Step 3: Verify Deployment

1. **Monitor the Build**:
   - Watch the build logs in the Render dashboard
   - Wait for the build to complete (you'll see "Your service is live")

2. **Test Your Application**:
   - Once deployed, Render will provide a URL like: `https://listen-you-are-loved.onrender.com`
   - Open this URL in your browser
   - Test the application:
     - Enter a persona (e.g., "A gentle grandmother")
     - Click "Generate Script"
     - Generate audio and verify it works

3. **Check Logs**:
   - If something doesn't work, check the **"Logs"** tab in Render dashboard
   - Look for any error messages

### Step 4: Update Frontend API Base URL (if needed)

The application is configured to use relative paths (`/api`), which means it will automatically work with your Render URL. No changes needed!

However, if you're running the frontend separately, you would need to update `src/App.js`:
```javascript
const API_BASE = 'https://your-app.onrender.com/api';
```

## Troubleshooting

### Build Fails

**Error: "npm install failed"**
- Check that `package.json` is in the repository root
- Verify all dependencies are listed in `package.json`
- Check build logs for specific error messages

**Error: "Module not found"**
- Ensure all dependencies are in `dependencies` (not just `devDependencies`)
- Run `npm install` locally to verify dependencies install correctly

### Application Won't Start

**Error: "Port already in use" or "Cannot bind to port"**
- Render automatically sets the `PORT` environment variable
- Your `server.js` should use `process.env.PORT || 3000` (already configured)

**Error: "OPENAI_API_KEY not set"**
- Verify the environment variable is set in Render dashboard
- Check that the variable name is exactly `OPENAI_API_KEY` (case-sensitive)
- Re-deploy after adding the environment variable

### 405 Not Allowed Error

**If you see "405 Not Allowed" errors:**
- The server has been updated to properly handle all HTTP methods
- Ensure you're using the latest code from the repository
- Check that CORS is properly configured (already done in `server.js`)
- Verify the request is going to the correct endpoint (`/api/generate-script` or `/api/tts`)

### API Calls Fail

**Error: "Server error (405)"**
- Check Render logs for detailed error messages
- Verify the endpoint URL is correct
- Ensure you're using POST method for `/api/generate-script` and `/api/tts`
- Check that the request body is properly formatted JSON

**Error: "OpenAI API error"**
- Verify your OpenAI API key is correct
- Check your OpenAI account has credits
- Ensure the API key has permissions for Chat and TTS APIs

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `OPENAI_API_KEY` | Yes | Your OpenAI API key | `sk-proj-...` |
| `PORT` | No | Server port (auto-set by Render) | `10000` |

## Custom Domain (Optional)

1. In your Render service dashboard, go to **"Settings"**
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Follow the instructions to configure your domain

## Updating Your Deployment

Whenever you push changes to your GitHub repository:

1. Render will automatically detect the changes
2. It will trigger a new build and deployment
3. Your service will be updated with the latest code

You can also manually trigger a deploy:
- Go to your service dashboard
- Click **"Manual Deploy"** → **"Deploy latest commit"**

## Free Tier Limitations

Render's free tier includes:
- ✅ 750 hours/month of runtime
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ⚠️ Services spin down after 15 minutes of inactivity
- ⚠️ First request after spin-down may take 30-60 seconds

To avoid spin-down:
- Upgrade to a paid plan
- Use a service like [UptimeRobot](https://uptimerobot.com) to ping your service every 5 minutes

## Support

If you encounter issues:
1. Check the Render logs first
2. Verify all environment variables are set correctly
3. Test the application locally to ensure it works
4. Check the [Render documentation](https://render.com/docs)
5. Review the application logs in the Render dashboard

## Security Notes

- ✅ Never commit `.env` files to GitHub
- ✅ Never share your OpenAI API key publicly
- ✅ Use environment variables for all secrets
- ✅ The `.gitignore` file is configured to exclude `.env` files

---

**Your application should now be live on Render!** 🎉

Visit your Render URL to start using the application.

