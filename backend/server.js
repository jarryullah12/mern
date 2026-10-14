require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

const app = express();

// ---- middleware ----------------------------------------------------
// Allowed frontend origin(s). CORS_ORIGIN / FRONTEND_URL / CLIENT_URL may be a
// single origin or a comma-separated list. If none is set we allow ALL origins,
// so a Vercel frontend calling a Vercel API on another domain works out of the
// box. Set CORS_ORIGIN in production to restrict this to your frontend.
const rawOrigins =
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  process.env.CLIENT_URL ||
  '*';

const origins = rawOrigins
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (origins.includes('*')) {
  console.warn(
    '[cors] CORS_ORIGIN is not set - allowing all origins. Set CORS_ORIGIN to your frontend URL in production.'
  );
}

app.use(
  cors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
  })
);

// Raised limit so the frontend can send base64 image / trailer uploads
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ---- health check --------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ---- routes --------------------------------------------------------
// Make sure a (cached) MongoDB connection exists before data routes run.
// This keeps the API working no matter how it is deployed (Vercel serverless,
// a plain Node server, etc.).
const withDb = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
};

app.use('/api/movies', withDb, require('./routes/movies'));
app.use('/api/auth', withDb, require('./routes/auth'));
app.use('/api/admin', withDb, require('./routes/admin'));
app.use('/api/bookings', withDb, require('./routes/bookings'));
app.use('/api/contact', withDb, require('./routes/contact'));

// Friendly index for the bare /api path
app.get('/api', (req, res) => {
  res.json({
    message: 'Movie Theater API',
    status: 'ok',
    version: '1.3.0',
    cors: origins.includes('*') ? 'all origins' : origins,
    health: '/api/health',
    endpoints: [
      'GET  /api/health',
      'GET  /api/movies',
      'GET  /api/movies/featured',
      'GET  /api/movies/latest',
      'GET  /api/movies/coming-soon',
      'GET  /api/movies/:id',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'POST /api/admin/login',
      'POST /api/bookings',
      'POST /api/contact',
    ],
  });
});

// 404 for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    hint:
      'Check the request method and path. Note: opening an API URL in a browser sends a GET request, ' +
      'so POST-only routes such as /api/auth/login return this.',
  });
});

// ---- error handler -------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate value', keyValue: err.keyValue });
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// ---- start ---------------------------------------------------------
const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = app;
