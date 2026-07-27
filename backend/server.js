require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const resultRoutes = require('./routes/resultRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// --- CORS: only allow the configured frontend origins ---
const allowedOrigins = (process.env.CLIENT_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (e.g. mobile apps, curl, Postman)
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true
}));

app.use(express.json());

// Basic rate limiting to slow down brute-force attempts on auth routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 50 });
app.use('/api/auth', authLimiter);

// --- Socket.io setup for live notifications ---
const io = new Server(server, {
  cors: { origin: allowedOrigins.length ? allowedOrigins : '*' }
});

io.on('connection', (socket) => {
  // Client joins a room named after their own user id right after login
  socket.on('join', (userId) => {
    if (userId) socket.join(userId);
  });
});

// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

// --- Routes ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Heritage CRPS API running on port ${PORT}`);
  });
});
