require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const generateScript = require('./api/generate-script');
const tts = require('./api/tts');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CRITICAL: Request logging FIRST
// ============================================
app.use((req, res, next) => {
  console.log(`\n=================================`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`Original URL: ${req.originalUrl}`);
  console.log(`Base URL: ${req.baseUrl}`);
  console.log(`=================================\n`);
  next();
});

// ============================================
// CORS - Must be early
// ============================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Handle OPTIONS preflight requests
app.options('*', (req, res) => {
  console.log('OPTIONS preflight request:', req.path);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// API ROUTES - DEFINED EXPLICITLY FIRST
// ============================================

// Health check - simplest route to test
app.get('/api/health', (req, res) => {
  console.log('✓ Health check endpoint hit');
  res.json({ 
    status: 'ok',
    server: 'express',
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY,
    port: PORT,
    path: req.path
  });
});

// Music files endpoint
app.get('/api/music-files', (req, res) => {
  console.log('✓ GET /api/music-files called');
  const fs = require('fs');
  const musicDir = path.join(__dirname, 'music');
  try {
    const files = fs.readdirSync(musicDir)
      .filter(file => file.endsWith('.mp3'))
      .sort();
    res.json({ files });
  } catch (error) {
    console.error('✗ Error reading music directory:', error);
    res.status(500).json({ error: 'Failed to read music directory', details: error.message });
  }
});

// Script generation endpoint
app.post('/api/generate-script', generateScript);

// TTS endpoint
app.post('/api/tts', tts);

// Catch-all for /api/* routes that don't match - return JSON error
app.all('/api/*', (req, res) => {
  console.log(`✗ API route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    availableRoutes: [
      'GET /api/health',
      'GET /api/music-files',
      'POST /api/generate-script',
      'POST /api/tts'
    ]
  });
});

// ============================================
// STATIC FILE SERVING - ONLY AFTER API ROUTES
// ============================================

// Explicitly skip /api paths in static middleware
app.use((req, res, next) => {
  // NEVER serve /api/* as static files
  if (req.path.startsWith('/api')) {
    return next();
  }
  // For all other paths, continue to static middleware
  next();
});

// Serve music files
app.use('/music', express.static(path.join(__dirname, 'music'), {
  index: false, // Don't serve index files
  fallthrough: false // Don't fall through to next middleware
}));

// Serve src folder
app.use('/src', express.static(path.join(__dirname, 'src'), {
  index: false,
  fallthrough: false
}));

// Serve index.html for root
app.get('/', (req, res) => {
  console.log('✓ Serving index.html');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// 404 HANDLER - Must be last
// ============================================
app.use((req, res) => {
  console.log(`✗ 404 - Route not found: ${req.method} ${req.path}`);
  
  // If it's an API route, return JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      availableRoutes: [
        'GET /api/health',
        'GET /api/music-files',
        'POST /api/generate-script',
        'POST /api/tts'
      ]
    });
  }
  
  // For other routes
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('✗ Server error:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n\n=================================`);
  console.log(`🚀 SERVER STARTED`);
  console.log(`=================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ NOT SET'}`);
  console.log(`=================================`);
  console.log(`📋 REGISTERED API ROUTES:`);
  console.log(`  GET  /api/health`);
  console.log(`  GET  /api/music-files`);
  console.log(`  POST /api/generate-script`);
  console.log(`  POST /api/tts`);
  console.log(`=================================`);
  console.log(`✅ Server is ready to accept requests\n\n`);
});
