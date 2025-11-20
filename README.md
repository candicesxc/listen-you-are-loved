# Listen, You Are Loved

Customize their tone, who they speak as, the words they use, and the sound of the voice itself, then let them read your personalized affirmations aloud with gentle care.

With each listen, you will feel a little more centered, a little more supported, and a little more connected to the comfort you deserve.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the server:
```bash
npm start
```

4. Open `index.html` in your browser or navigate to `http://localhost:3000`

## Project Structure

```
/
├── index.html          # Main HTML file (must be in root)
├── server.js           # Express server
├── package.json
├── /api/
│   ├── generate-script.js
│   ├── tts.js
│   └── mix.js
├── /music/             # Background music files (existing)
├── /src/               # Frontend React components
└── /public/            # Static assets
```

## Features

- Personalized affirmation script generation
- Multiple tone options (cheerful, lullaby, calm, motivational)
- OpenAI TTS voice selection
- Background music mixing
- Audio download capability

## Requirements

- Node.js 18+
- FFmpeg installed on your system
- OpenAI API key

