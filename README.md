# Listen, You Are Loved

Create personalized affirmations with your favorite tone, persona, and OpenAI TTS voice, then mix them with calming background music.

**Live site:** https://candiceshen.com/listen-you-are-loved/

## 🚀 Quick Start

### Prerequisites

- Node.js **18+**
- npm (included with Node)
- OpenAI API key ([get one here](https://platform.openai.com/api-keys))

### Setup

1. **Clone and enter the repo**
   ```bash
   git clone https://github.com/candicesxc/listen-you-are-loved.git
   cd listen-you-are-loved
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your environment file**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API key (and optional port):
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-api-key-here
   PORT=3000
   ```

4. **Run the server**
   ```bash
   npm start
   ```
   For auto-reload during development:
   ```bash
   npm run dev
   ```

5. **Open the app**
   Visit `http://localhost:3000/listen-you-are-loved` (or `http://localhost:3000/`) in your browser.

## 📁 Project Structure

```
/
├── index.html              # Landing page for the project site
├── server.js               # Express server and API entry point
├── .env.example            # Environment variable template
├── package.json            # Dependencies and scripts
├── /api/                   # Backend API endpoints
│   ├── generate-script.js  # Script generation endpoint
│   ├── tts.js              # Text-to-speech endpoint
│   └── mix.js              # Audio mixing endpoint (optional)
└── /docs/                  # Frontend served from the /listen-you-are-loved base path
    ├── index.html          # React entry point
    ├── /image/             # Static images
    ├── /music/             # Background music files
    └── /src/               # Frontend source
        └── App.js          # React frontend
```

## 🔒 Security

All OpenAI API calls happen server-side only:

- The API key lives in the server `.env` file (not bundled in the frontend)
- The frontend never receives or logs the API key
- No user action is required to provide keys in the browser

## ✨ Features

- 🎭 **Personalized scripts** generated from your chosen persona and tone
- 🎨 **Tone presets** like cheerful, lullaby, calm, and motivational
- 🎤 **Voice selection** across six OpenAI TTS voices
- 🎵 **Background music** mixed with Web Audio API
- 📥 **Downloadable audio** for your custom affirmations
- 🔒 **Privacy-first** architecture with server-side API access only

## 🌐 Deployment

1. Deploy the Node.js server (Render, Railway, Heroku, etc.) with environment variable `OPENAI_API_KEY` set (and optional `PORT`).
2. Ensure the server serves the static `docs/` directory at the `/listen-you-are-loved` base path (handled by `server.js`).
3. Point your domain to the deployed server. The production app is hosted at https://candiceshen.com/listen-you-are-loved/.

> The static frontend can also be served by GitHub Pages from the `docs/` folder, but a Node.js server is required for the OpenAI API routes.

## 📝 API Endpoints

- `POST /api/generate-script` — Generate an affirmation script
- `POST /api/tts` — Generate text-to-speech audio
- `POST /api/mix` — Mix TTS audio with background music (optional server-side path)
- `GET /api/music-files` — List available background music files
- `GET /api/health` — Health check
- `GET /` or `/listen-you-are-loved` — Serve the frontend

## 🛠️ Troubleshooting

**Server won't start**
- Verify Node.js 18+ is installed (`node --version`)
- Ensure dependencies are installed (`npm install`)
- Confirm `.env` exists with `OPENAI_API_KEY`

**OpenAI API errors**
- Verify your API key in `.env`
- Confirm your OpenAI account has access/credits
- Check server logs for the full error

**Music or audio issues**
- Ensure the `/docs/music/` folder contains MP3 files
- Check the browser console for 404s or audio errors
- Try a different modern browser if mixing fails

## 📄 License

ISC

## 🙏 Contributing

Issues and pull requests are welcome!
