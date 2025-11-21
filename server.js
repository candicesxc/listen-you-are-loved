require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const generateScript = require('./api/generate-script');
const tts = require('./api/tts');
const mix = require('./api/mix');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes - MUST come before static file serving
app.post('/api/generate-script', generateScript);
app.post('/api/tts', tts);
app.post('/api/mix', mix);

// List music files
app.get('/api/music-files', (req, res) => {
  const fs = require('fs');
  const musicDir = path.join(__dirname, 'music');
  try {
    const files = fs.readdirSync(musicDir)
      .filter(file => file.endsWith('.mp3'))
      .sort();
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read music directory' });
  }
});

// Static serving of music folder
app.use('/music', express.static(path.join(__dirname, 'music')));

// Static file serving for src folder
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve index.html for root route (before catch-all static)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Catch-all static file serving (must be last)
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

