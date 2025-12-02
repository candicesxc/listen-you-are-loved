# Troubleshooting Guide

## 405 Not Allowed Error (HTML Response)

If you're seeing HTML 405 errors instead of JSON responses, this usually means:

1. **The request isn't reaching your Express app** - Check Render logs to see if requests are being logged
2. **Render's reverse proxy is intercepting** - This can happen if the app isn't running or binding correctly
3. **Path mismatch** - Ensure you're using the correct URL

### Steps to Debug:

1. **Check Render Logs**:
   - Go to your Render service dashboard
   - Click on "Logs" tab
   - Look for:
     - Server startup messages (should see "Server running on port...")
     - Request logs (should see `[timestamp] POST /api/generate-script`)
     - Any error messages

2. **Test the Health Endpoint**:
   - Visit: `https://your-app.onrender.com/api/health`
   - Should return JSON: `{"status":"ok",...}`
   - If this works, your app is running correctly

3. **Check Environment Variables**:
   - In Render dashboard → Environment
   - Ensure `OPENAI_API_KEY` is set
   - Ensure `NODE_ENV` is set to `production`

4. **Verify the App is Running**:
   - Check Render dashboard → Metrics
   - Should show CPU/Memory usage if app is running
   - If metrics are flat, the app might not be starting

5. **Check Build Logs**:
   - In Render dashboard → Events
   - Look for build errors
   - Ensure `npm install` completed successfully

## Common Issues

### Issue: HTML 405 Response

**Symptoms**: Getting HTML 405 errors instead of JSON

**Possible Causes**:
- App not running (check logs)
- Wrong URL/path
- Render proxy issue

**Solution**:
1. Check Render logs for startup errors
2. Verify the app is actually running
3. Test `/api/health` endpoint first
4. Ensure you're using POST method for `/api/generate-script` and `/api/tts`

### Issue: 404 for /api/music-files

**Symptoms**: Getting 404 when trying to load music files

**Possible Causes**:
- Music directory doesn't exist on Render
- Files not committed to git
- Path issue

**Solution**:
1. Ensure `music/` folder is in your repository
2. Check that `.gitignore` isn't excluding the music folder
3. Verify files are committed: `git ls-files music/`

### Issue: CORS Errors

**Symptoms**: Browser console shows CORS errors

**Solution**:
- CORS is already configured in `server.js`
- If still seeing errors, check that the request is going to the correct domain
- Ensure you're not mixing HTTP/HTTPS

### Issue: OpenAI API Errors

**Symptoms**: "OPENAI_API_KEY not set" or API errors

**Solution**:
1. Check Render environment variables
2. Ensure the key is correct (starts with `sk-`)
3. Verify your OpenAI account has credits
4. Check server logs for detailed error messages

## Testing Locally

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Set environment variable
export OPENAI_API_KEY=your-key-here

# Start server
npm start

# Test endpoints
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/generate-script \
  -H "Content-Type: application/json" \
  -d '{"persona":"test","tone":"calm","durationSeconds":60}'
```

## Render-Specific Issues

### App Spins Down (Free Tier)

Render's free tier spins down after 15 minutes of inactivity. The first request after spin-down takes 30-60 seconds.

**Solution**: 
- Upgrade to paid plan, or
- Use a service like UptimeRobot to ping your app every 5 minutes

### Port Binding

Render automatically sets the `PORT` environment variable. Your `server.js` uses `process.env.PORT || 3000`, which is correct.

### Static Files

Ensure all static files (music, src, index.html) are committed to git and not in `.gitignore`.

## Getting Help

If issues persist:

1. **Check Render Logs** - Most issues show up here
2. **Test Health Endpoint** - Verifies app is running
3. **Check Browser Console** - For client-side errors
4. **Verify Environment Variables** - In Render dashboard
5. **Test Locally First** - Ensure it works on your machine

## Quick Health Check

Run these checks in order:

1. ✅ App is running (check Render metrics)
2. ✅ Health endpoint works: `GET /api/health`
3. ✅ Music files endpoint works: `GET /api/music-files`
4. ✅ Script generation works: `POST /api/generate-script`
5. ✅ TTS works: `POST /api/tts`

If any step fails, check the logs for that specific endpoint.

