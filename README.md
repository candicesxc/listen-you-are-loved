# Listen, You Are Loved

Server-backed web app for generating personalized affirmation scripts, turning them into speech, and optionally mixing them with background music.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure the OpenAI API key (server-side only)**
   Create a `.env` file in the project root:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   The key is read only by the backend. It is never sent to the browser and the UI never asks for it.

3. **Run the server**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`.

## 📁 Project Structure
```
/                     # Express server + static frontend
├── api/              # Backend API routes (uses server-side OpenAI key)
├── music/            # Background music files
├── src/App.js        # React UI (loads via script tag)
├── index.html        # Entry point served by Express
├── server.js         # Express server
└── .env              # Contains OPENAI_API_KEY (not committed)
```

## 🔒 Security
- All OpenAI requests are made from the server using `process.env.OPENAI_API_KEY`.
- The frontend never prompts for or stores API keys.
- No API credentials are embedded in any public or client-side files.

## ✨ Features
- AI-generated affirmation scripts tailored by persona, tone, and duration
- Optional background music with adjustable volume
- Multiple OpenAI voices for text-to-speech
- Downloadable mixed audio output

## 🛠️ Development Notes
- Static assets are served from `index.html` with React loaded via CDN.
- Backend routes:
  - `POST /api/generate-script`
  - `POST /api/tts`
  - `POST /api/mix`
  - `GET /api/music-files`
- Ensure `ffmpeg` is available on the host for audio mixing.

## 📄 License
ISC
