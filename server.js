require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const generateScript = require('./api/generate-script');
const tts = require('./api/tts');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Handle preflight OPTIONS requests for API routes
app.options('/api/*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// API route middleware - log and validate methods
app.use('/api', (req, res, next) => {
  // Log API requests
  console.log(`API Request: ${req.method} ${req.path}`);
  
  // Only allow specific methods on /api routes
  const allowedMethods = ['GET', 'POST', 'OPTIONS'];
  if (!allowedMethods.includes(req.method)) {
    console.log(`405 - Method ${req.method} not allowed for ${req.path}`);
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
      allowedMethods: allowedMethods,
      path: req.path
    });
  }
  
  next();
});

// Script generation endpoint
app.post('/api/generate-script', generateScript);

// TTS endpoint  
app.post('/api/tts', tts);

// List music files endpoint
app.get('/api/music-files', (req, res) => {
  console.log('GET /api/music-files called');
  const fs = require('fs');
  const musicDir = path.join(__dirname, 'music');
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

// Serve music files
app.use('/music', express.static(path.join(__dirname, 'music')));

// Serve src folder
app.use('/src', express.static(path.join(__dirname, 'src')));

// Serve root files (only specific files, not catch-all)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must be last
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  
  // If it's an API route, return JSON
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  }
  
  // For other routes, return 404
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
