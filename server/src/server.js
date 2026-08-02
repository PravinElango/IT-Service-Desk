require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./config/db');
const seedDatabase = require('./config/seed');
const notificationService = require('./services/notificationService');

const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const masterRoutes = require('./routes/masterRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
  }
});

notificationService.setSocketIO(io);

io.on('connection', (socket) => {
  // Join user-specific room
  socket.on('join_user', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Join role-specific room
  socket.on('join_role', (role) => {
    if (role) {
      socket.join(`role_${role}`);
    }
  });

  // Join ticket room for real-time live comments
  socket.on('join_ticket', (ticketId) => {
    if (ticketId) {
      socket.join(`ticket_${ticketId}`);
    }
  });

  socket.on('leave_ticket', (ticketId) => {
    if (ticketId) {
      socket.leave(`ticket_${ticketId}`);
    }
  });
});

const path = require('path');

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'IT Support Ticketing API'
  });
});

// Auto seed on boot
try {
  seedDatabase();
} catch (err) {
  console.error('Error during auto seed:', err);
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error: ' + err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=============================================`);
  console.log(`  IT Support Ticketing API Server Running    `);
  console.log(`  URL: http://localhost:${PORT}               `);
  console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=============================================`);
});
