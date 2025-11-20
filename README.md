# Listen, You Are Loved

Customize their tone, who they speak as, the words they use, and the sound of the voice itself, then let them read your personalized affirmations aloud with gentle care.

With each listen, you will feel a little more centered, a little more supported, and a little more connected to the comfort you deserve.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **FFmpeg** - Required for audio mixing
  - **macOS**: `brew install ffmpeg`
  - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html)
  - **Linux**: `sudo apt-get install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)
- **OpenAI API Key** - Get one at [platform.openai.com](https://platform.openai.com/api-keys)

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/candicesxc/listen-you-are-loved.git
   cd listen-you-are-loved
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```
   ⚠️ **Important**: Never commit your `.env` file! It's already in `.gitignore`.

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
/
├── index.html          # Main HTML file (must be in root)
├── server.js           # Express server
├── package.json
├── .env                # Environment variables (create this, not in git)
├── /api/
│   ├── generate-script.js  # LLM script generation
│   ├── tts.js              # OpenAI TTS endpoint
│   └── mix.js              # FFmpeg audio mixing
├── /music/             # Background music files
├── /src/
│   └── App.js          # React frontend
└── /public/            # Static assets
```

## ✨ Features

- 🎭 **Personalized Scripts** - AI-generated affirmations based on persona and tone
- 🎨 **Multiple Tones** - Cheerful, lullaby, calm, or motivational
- 🎤 **Voice Selection** - Choose from 6 OpenAI TTS voices
- 🎵 **Background Music** - Mix with ambient tracks
- 📥 **Download MP3** - Save your personalized affirmations

## 🌐 Deployment Options

### Option 1: Railway (Recommended)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create a new project from GitHub
4. Add environment variable: `OPENAI_API_KEY`
5. Railway will auto-detect Node.js and deploy

**Note**: Railway supports FFmpeg, but you may need to add a buildpack or use a Dockerfile.

### Option 2: Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Create a new Web Service
4. Connect your GitHub repository
5. Add environment variable: `OPENAI_API_KEY`
6. Build command: `npm install`
7. Start command: `npm start`

**Note**: Render may require a Dockerfile for FFmpeg support.

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

Split the app:
- Deploy frontend to Vercel
- Deploy backend API to Railway/Render
- Update `API_BASE` in `src/App.js` to point to your backend URL

### Option 4: Heroku

1. Install Heroku CLI
2. Create `Procfile`: `web: node server.js`
3. Push to Heroku: `git push heroku main`
4. Set environment variable: `heroku config:set OPENAI_API_KEY=your_key`

## 🔧 Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `PORT` | Server port (default: 3000) | No |

## 🛠️ Troubleshooting

**FFmpeg not found:**
- Ensure FFmpeg is installed and in your PATH
- Test with: `ffmpeg -version`

**OpenAI API errors:**
- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure the key has TTS permissions

**Port already in use:**
- Change `PORT` in `.env` file
- Or kill the process using port 3000

## 📄 License

ISC

## 🙏 Contributing

Feel free to open issues or submit pull requests!

