# Listen, You Are Loved

Customize their tone, who they speak as, the words they use, and the sound of the voice itself, then let them read your personalized affirmations aloud with gentle care.

With each listen, you will feel a little more centered, a little more supported, and a little more connected to the comfort you deserve.

## 🚀 Quick Start

### No Installation Required!

This app works entirely in your browser - just open `index.html`!

### Setup (One-Time)

1. **Clone or download the repository:**
   ```bash
   git clone https://github.com/candicesxc/listen-you-are-loved.git
   cd listen-you-are-loved
   ```

2. **Add your OpenAI API key** (choose one method):
   
   **Option A: Create `config.js` file** (recommended for personal use):
   ```bash
   cp config.js.example config.js
   ```
   Then edit `config.js` and add your API key:
   ```javascript
   window.OPENAI_CONFIG = {
     API_KEY: 'sk-proj-your-api-key-here'
   };
   ```
   ⚠️ **Important**: `config.js` is in `.gitignore` and will never be committed to GitHub.
   
**Option B: Enter API key in the UI** (works without config.js):
- Just open `index.html` and enter your API key in the form at the top of the page
- It will be saved locally in your browser (localStorage) and never committed

3. **Open `index.html` in your browser:**
   - Simply double-click `index.html`, or
   - Right-click → Open With → Your Browser

That's it! No server, no installation, no dependencies needed.

## 📁 Project Structure

```
/
├── index.html          # Main HTML file - just open this!
├── config.js           # Your API key (create from config.js.example, not in git)
├── config.js.example   # Template for config.js
├── /music/             # Background music files
└── /src/
    └── App.js          # React frontend (all client-side)
```

**Note**: The `/api/` and `server.js` files are legacy and not needed for the client-side version.

## ✨ Features

- 🎭 **Personalized Scripts** - AI-generated affirmations based on persona and tone
- 🎨 **Multiple Tones** - Cheerful, lullaby, calm, or motivational
- 🎤 **Voice Selection** - Choose from 6 OpenAI TTS voices
- 🎵 **Background Music** - Mix with ambient tracks using Web Audio API
- 📥 **Download Audio** - Save your personalized affirmations
- 🔒 **Privacy First** - API key stored locally, never shared

## 🌐 Deployment Options

Since this is a client-side app, you can host it anywhere that serves static files:

### Option 1: GitHub Pages (Free & Easy)

1. Push your code to GitHub
2. Go to Settings → Pages
3. Select your branch and `/` (root) folder
4. Your app will be live at `https://yourusername.github.io/listen-you-are-loved`

**Note**: Users will need to add their own `config.js` or enter API key in the UI.

### Option 2: Netlify/Vercel (Free)

1. Push your code to GitHub
2. Connect to [Netlify](https://netlify.com) or [Vercel](https://vercel.com)
3. Deploy - it's just static files!

### Option 3: Any Web Host

Just upload the files to any web hosting service. No server needed!

## 🔧 How It Works

- **Fully Client-Side**: All processing happens in your browser
- **Direct API Calls**: Calls OpenAI API directly from the browser
- **Web Audio API**: Mixes audio in the browser (no FFmpeg needed)
- **Local Storage**: API key can be saved in browser localStorage
- **No Backend**: Zero server dependencies

## 📝 API Key Setup

Your API key can be provided in two ways:

1. **config.js file** (recommended):
   - Copy `config.js.example` to `config.js`
   - Add your API key
   - File is gitignored, stays private

2. **UI Input**:
   - Enter API key in the form
   - Saved in browser localStorage
   - Never leaves your browser

## 🛠️ Troubleshooting

**OpenAI API errors:**
- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure the key has TTS and Chat API permissions
- Check browser console for detailed error messages

**Audio mixing not working:**
- Ensure your browser supports Web Audio API (all modern browsers do)
- Try a different browser if issues persist

**Music files not loading:**
- Ensure the `/music/` folder is in the same directory as `index.html`
- Check browser console for 404 errors

## 📄 License

ISC

## 🙏 Contributing

Feel free to open issues or submit pull requests!

