const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/security-guard-db')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined admin-room');
  });

  socket.on('location-update', (data) => {
    socket.to('admin-room').emit('worker-location', data);
  });

  socket.on('send-message', (data) => {
    io.to(data.receiverId).emit('new-message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.set('io', io);

// ✅ FIX: All routes with correct file names (case-sensitive)
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));
app.use('/api/jobs',       require('./routes/jobRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/locations',  require('./routes/locationRoutes'));
app.use('/api/chat',       require('./routes/Chatroutes'));       // ✅ Fixed case
app.use('/api/dashboard',  require('./routes/Dashboardroutes')); // ✅ Fixed case
app.use('/api/admin',      require('./routes/admin'));            // ✅ Added missing route

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});