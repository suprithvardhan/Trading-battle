const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const dashboardRoutes = require('./routes/dashboard');
const matchesRoutes = require('./routes/matches');
const leaderboardRoutes = require('./routes/leaderboard');
const assetsRoutes = require('./routes/assets');
const matchmakingRoutes = require('./routes/matchmaking');
const ordersRoutes = require('./routes/orders');
const positionsRoutes = require('./routes/positions');

// Services
const marketDataService = require('./services/marketData');
const leaderboardService = require('./services/leaderboardService');
const matchmakingService = require('./services/matchmaking');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Check for required environment variables
if (!process.env.MONGODB_URL) {
  console.error('❌ MONGODB_URL is required. Please create a .env file with your MongoDB connection string.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is required. Please create a .env file with a JWT secret key.');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => { // 30 second timeout
    res.status(408).json({ 
      success: false, 
      message: 'Request timeout' 
    });
  });
  next();
});

// Database connection check middleware
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database not ready. Please try again in a moment.'
    });
  }
  next();
});

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Connect to MongoDB with optimized settings
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: true, // Enable buffering for better performance
    });
    console.log('✅ Connected to MongoDB');
    
    // Initialize services asynchronously without blocking server startup
    setImmediate(async () => {
      try {
        console.log('🔄 Initializing services in background...');
        await marketDataService.initialize();
        await leaderboardService.initialize();
        console.log('✅ All services initialized');
      } catch (error) {
        console.error('❌ Error initializing services:', error);
      }
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

// Connect to database before starting server
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/positions', positionsRoutes);

console.log('✅ Routes mounted successfully');
console.log('✅ Orders route: /api/orders');
console.log('✅ Positions route: /api/positions');

// Health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    message: 'TradeBattle API is running',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Quick health check for load balancers
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Orders endpoint: http://localhost:${PORT}/api/orders`);
  console.log(`📊 Positions endpoint: http://localhost:${PORT}/api/positions`);
  console.log(`⚡ Ready to handle requests!`);
});

// Optimize server settings
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});
