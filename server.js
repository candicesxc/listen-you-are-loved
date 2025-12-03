require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const generateScript = require('./api/generate-script');
const tts = require('./api/tts');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_DIR = path.join(__dirname, 'docs');
const APP_BASE_PATH = '/listen-you-are-loved';

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Enhanced CORS configuration for Render deployment
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API ROUTES - MUST BE DEFINED BEFORE STATIC
// ============================================

// Middleware to ensure all API responses are JSON
app.use('/api', (req, res, next) => {
  // Set JSON content type for all API responses
  res.set('Content-Type', 'application/json');
  next();
});

// Handle preflight OPTIONS requests for all API routes
app.options('/api/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Script generation endpoint
app.post('/api/generate-script', (req, res, next) => {
  console.log('POST /api/generate-script called');
  next();
}, generateScript);

// TTS endpoint  
app.post('/api/tts', (req, res, next) => {
  console.log('POST /api/tts called');
  next();
}, tts);

// List music files endpoint
app.get('/api/music-files', (req, res) => {
  console.log('GET /api/music-files called');
  const fs = require('fs');
  const musicDir = path.join(APP_DIR, 'music');
  try {
    const files = fs.readdirSync(musicDir)
      .filter(file => file.endsWith('.mp3'))
      .sort();
    res.json({ files });
  } catch (error) {
    console.error('Error reading music directory:', error);
    res.status(500).json({ error: 'Failed to read music directory' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY 
  });
});

// ============================================
// STATIC FILE SERVING - AFTER API ROUTES
// ============================================

// Serve static frontend from both the base path and root so it works
// when hosted as a project page (GitHub Pages) or directly on Render
app.use(APP_BASE_PATH, express.static(APP_DIR));
app.use(express.static(APP_DIR));

// Serve app entry
app.get([APP_BASE_PATH, `${APP_BASE_PATH}/`, '/'], (req, res) => {
  res.sendFile(path.join(APP_DIR, 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be last
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  
  // Always return JSON for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }
  
  // For other routes, return 404 HTML
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
  console.log(`=================================`);
  console.log(`API Routes:`);
  console.log(`  POST /api/generate-script`);
  console.log(`  POST /api/tts`);
  console.log(`  GET  /api/music-files`);
  console.log(`  GET  /api/health`);
  console.log(`=================================`);
});
