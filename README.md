# Listen, You Are Loved

Customize their tone, who they speak as, the words they use, and the sound of the voice itself, then let them read your personalized affirmations aloud with gentle care.

With each listen, you will feel a little more centered, a little more supported, and a little more connected to the comfort you deserve.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/candicesxc/listen-you-are-loved.git
   cd listen-you-are-loved
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   ```
   
   ⚠️ **Important**: The `.env` file is in `.gitignore` and will never be committed to GitHub. Never share your API key publicly.

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open the app:**
   
   Navigate to `http://localhost:3000` in your browser.

That's it! The app is now running with your server-side API key.

## 📁 Project Structure

```
/
├── index.html              # Landing page for the GitHub Pages project site
├── server.js               # Express server
├── .env.example            # Environment variable template
├── package.json            # Dependencies
├── /api/                   # Backend API endpoints
│   ├── generate-script.js  # Script generation endpoint
│   ├── tts.js              # Text-to-speech endpoint
│   └── mix.js              # Audio mixing endpoint (optional)
└── /docs/                  # Frontend app served to GitHub Pages
    ├── index.html          # React entry point
    ├── /image/             # Static images
    ├── /music/             # Background music files
    └── /src/               # Frontend source
        └── App.js          # React frontend
```

## 🔒 Security

**All OpenAI API calls happen server-side only.** 

- The API key is stored in the `.env` file on the server
- The frontend never sees or handles API keys
- No user input is required for API keys
- The API key is never sent to the client or logged

## ✨ Features

- 🎭 **Personalized Scripts** - AI-generated affirmations based on persona and tone
- 🎨 **Multiple Tones** - Cheerful, lullaby, calm, or motivational
- 🎤 **Voice Selection** - Choose from 6 OpenAI TTS voices
- 🎵 **Background Music** - Mix with ambient tracks using Web Audio API
- 📥 **Download Audio** - Save your personalized affirmations
- 🔒 **Privacy First** - API key stored server-side, never exposed to clients

## 🌐 Deployment

### Environment Variables

Make sure to set the `OPENAI_API_KEY` environment variable in your deployment platform:

- **Heroku**: Set in Config Vars
- **Railway**: Set in Environment Variables
- **Render**: Set in Environment Variables
- **Vercel/Netlify**: Set in Environment Variables

### Example Deployment

1. Push your code to GitHub
2. Connect to your deployment platform (Heroku, Railway, Render, etc.)
3. Set `OPENAI_API_KEY` environment variable in the platform
4. Deploy!

**Note**: The app requires a Node.js backend to run, so static hosting (GitHub Pages, plain Vercel/Netlify) won't work. Use a platform that supports Node.js servers.

### GitHub Pages preview

- The frontend lives in `/docs`, so you can point GitHub Pages at the `docs/` folder on the `main` branch.
- GitHub Pages can serve the frontend directly from the `docs/` folder on the `main` branch as a normal project page at `https://<username>.github.io/listen-you-are-loved/`.
- You do **not** need a `CNAME` file or custom-domain setting in this repository—GitHub will automatically map the project page to `https://candiceshen.com/listen-you-are-loved/` if `candiceshen.com` is configured on your user/organization site.

## 🔧 How It Works

- **Backend API**: Express server handles all OpenAI API calls
- **Frontend**: React app collects user inputs and calls backend endpoints
- **Text-to-Speech**: OpenAI TTS API generates speech from scripts
- **Audio Mixing**: Web Audio API mixes TTS with background music in the browser
- **Security**: API key never leaves the server

## 📝 API Endpoints

- `POST /api/generate-script` - Generate affirmation script
- `POST /api/tts` - Generate text-to-speech audio
- `POST /api/mix` - Mix TTS audio with background music (server-side, optional)
- `GET /api/music-files` - List available background music files
- `GET /` - Serve the main application

## 🛠️ Troubleshooting

**Server won't start:**
- Ensure Node.js is installed (`node --version`)
- Check that dependencies are installed (`npm install`)
- Verify `.env` file exists with `OPENAI_API_KEY` set

**OpenAI API errors:**
- Verify your API key is correct in `.env`
- Check your OpenAI account has credits
- Ensure the key has TTS and Chat API permissions
- Check server console for detailed error messages

**Audio mixing not working:**
- Ensure your browser supports Web Audio API (all modern browsers do)
- Try a different browser if issues persist

**Music files not loading:**
- Ensure the `/music/` folder contains MP3 files
- Check browser console for 404 errors
- Verify the server is serving static files correctly

## 📄 License

ISC

## 🙏 Contributing

Feel free to open issues or submit pull requests!
