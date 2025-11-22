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
const corsConfig = {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Handle preflight early to avoid 405s from proxies or upstream servers
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': corsConfig.methods.join(', '),
      'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
    });
    return res.sendStatus(204);
  }
  next();
});

app.use(cors(corsConfig));
app.options('*', cors(corsConfig));
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

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler for unmatched routes (must be last)
app.use((req, res) => {
  // If it's an API route that wasn't matched, return JSON error
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // For other routes, return 404
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

