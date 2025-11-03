import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import tripRoutes from './routes/trips';
import userRoutes from './routes/users';

// Middleware
import { authenticateToken, verifyToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Try to import optional security packages
let helmet: any;
let rateLimit: any;

try {
  helmet = require('helmet');
  rateLimit = require('express-rate-limit');
} catch (error) {
  console.warn('⚠️  Security packages not installed. Run: npm install helmet express-rate-limit');
}

dotenv.config();

const app = express();
const server = createServer(app);

// Security middleware (if installed)
if (helmet) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    }
  }));
} else {
  console.warn('⚠️  Helmet not available - running without security headers');
}

// Rate limiting configuration (if installed)
let limiter: express.RequestHandler, authLimiter: express.RequestHandler, loginLimiter: express.RequestHandler;
if (rateLimit) {
  // General API rate limiting
  limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Increased from 100 to 200 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again in 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: express.Request) => {
      // Skip rate limiting for health checks and certain endpoints
      return req.url === '/api/health' || req.url === '/api/status';
    }
  });

  // Gentle rate limiting for general auth endpoints
  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Increased from 5 to 20 requests per windowMs
    message: {
      error: 'Too many authentication attempts, please try again in 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
  });

  // Stricter rate limiting specifically for login attempts
  loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 8, // Increased from 5 to 8 login attempts per windowMs
    message: {
      error: 'Too many login attempts. Please wait 15 minutes before trying again.',
      retryAfter: 15 * 60,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: express.Request) => {
      // Use IP + username for more accurate rate limiting
      const username = (req.body?.username || req.body?.email || 'unknown') as string;
      return `${req.ip}-${username}`;
    },
    handler: (req: express.Request, res: express.Response) => {
      // Custom handler to log rate limit events
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Endpoint: ${req.url}`);
      res.status(429).json({
        error: 'Too many login attempts',
        message: 'Please wait 15 minutes before trying again.',
        retryAfter: 15 * 60,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  });

} else {
  // Mock middlewares if rate limiting is not available
  limiter = (req: express.Request, res: express.Response, next: express.NextFunction) => next();
  authLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => next();
  loginLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => next();
  console.warn('⚠️  Rate limiting not available - running without rate limits');
}

// CORS configuration - Allow multiple origins for development
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://localhost:5175',
      'http://127.0.0.1:5175'
    ];
    
    // Add FRONTEND_URL from environment if it exists
    if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Socket.io CORS configuration
const socketCorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174', 
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://localhost:5175',
      'http://127.0.0.1:5175'
    ];
    
    // Add FRONTEND_URL from environment if it exists
    if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`Socket.io CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply request logger (make sure this middleware exists)
try {
  app.use(requestLogger);
} catch (error) {
  console.warn('⚠️  Request logger not available');
}

// Apply rate limiting with specific rules
app.use('/api/', limiter);
app.use('/api/auth', authLimiter);
// Apply stricter limiting specifically to login endpoint
app.use('/api/auth/login', loginLimiter);

// Create and export io instance
export const io = new Server(server, {
  cors: socketCorsOptions,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  }
});

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = verifyToken(token);
    socket.data.user = decoded;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Rate limit reset endpoint for legitimate users
app.post('/api/auth/reset-limit', (req: express.Request, res: express.Response) => {
  // This is a basic implementation - you might want to add additional security
  const { email, reason } = req.body;
  
  if (!email) {
    return res.status(400).json({
      error: 'Email is required to reset rate limits'
    });
  }

  // In a real implementation, you would:
  // 1. Verify the user exists
  // 2. Log the reset request
  // 3. Actually reset the rate limit counter for that user/IP
  // 4. Possibly send an email notification
  
  console.log(`Rate limit reset requested for: ${email}, Reason: ${reason}`);
  
  res.json({
    message: 'Rate limit reset request received. If you are a legitimate user, try logging in again in 2-3 minutes.',
    success: true
  });
});

// Enhanced health check with rate limit status
app.get('/api/health', (req: express.Request, res: express.Response) => {
  const healthCheck = {
    status: 'OK',
    message: 'VoyageSync API is running smoothly!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    features: {
      security: !!helmet,
      rateLimiting: !!rateLimit,
      rateLimitSettings: {
        general: '200 requests/15min',
        auth: '20 requests/15min', 
        login: '8 attempts/15min'
      }
    }
  };
  
  res.json(healthCheck);
});

// API status endpoint
app.get('/api/status', authenticateToken, (req: express.Request, res: express.Response) => {
  res.json({
    status: 'operational',
    services: {
      database: 'connected',
      authentication: 'active',
      realtime: 'enabled',
      security: !!helmet,
      rateLimiting: !!rateLimit
    },
    serverTime: new Date().toISOString(),
    rateLimitInfo: {
      message: 'Rate limiting is active to protect your account',
      loginAttempts: '8 attempts per 15 minutes',
      tips: [
        'Wait 15 minutes if you exceed login attempts',
        'Use the reset endpoint if legitimately locked out',
        'Contact support if issues persist'
      ]
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', authenticateToken, tripRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Socket.io for real-time features
io.on('connection', (socket) => {
  const userId = socket.data.user?.userId;
  console.log(`User ${userId} connected with socket ID: ${socket.id}`);

  // Join user to their personal room for notifications
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('join-trip', (tripId: string) => {
    if (!tripId) {
      socket.emit('error', { message: 'Trip ID is required' });
      return;
    }

    socket.join(`trip:${tripId}`);
    console.log(`User ${userId} joined trip ${tripId}`);
    
    socket.emit('joined-trip', { tripId, success: true });
  });

  socket.on('leave-trip', (tripId: string) => {
    socket.leave(`trip:${tripId}`);
    console.log(`User ${userId} left trip ${tripId}`);
  });

  socket.on('trip-update', (data: { tripId: string, update: any }) => {
    if (!data.tripId || !data.update) {
      socket.emit('error', { message: 'Invalid trip update data' });
      return;
    }

    socket.to(`trip:${data.tripId}`).emit('trip-updated', {
      ...data.update,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('activity-added', (data: { tripId: string, activity: any }) => {
    if (!data.tripId || !data.activity) {
      socket.emit('error', { message: 'Invalid activity data' });
      return;
    }

    socket.to(`trip:${data.tripId}`).emit('new-activity', {
      ...data.activity,
      addedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('activity-updated', (data: { tripId: string, activity: any }) => {
    socket.to(`trip:${data.tripId}`).emit('activity-updated', {
      ...data.activity,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('activity-deleted', (data: { tripId: string, activityId: string }) => {
    socket.to(`trip:${data.tripId}`).emit('activity-removed', {
      activityId: data.activityId,
      removedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('expense-added', (data: { tripId: string, expense: any }) => {
    if (!data.tripId || !data.expense) {
      socket.emit('error', { message: 'Invalid expense data' });
      return;
    }

    socket.to(`trip:${data.tripId}`).emit('new-expense', {
      ...data.expense,
      addedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('expense-updated', (data: { tripId: string, expense: any }) => {
    socket.to(`trip:${data.tripId}`).emit('expense-updated', {
      ...data.expense,
      updatedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('expense-deleted', (data: { tripId: string, expenseId: string }) => {
    socket.to(`trip:${data.tripId}`).emit('expense-removed', {
      expenseId: data.expenseId,
      removedBy: userId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('member-joined', (data: { tripId: string, member: any }) => {
    socket.to(`trip:${data.tripId}`).emit('member-added', {
      ...data.member,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('member-left', (data: { tripId: string, memberId: string }) => {
    socket.to(`trip:${data.tripId}`).emit('member-removed', {
      memberId: data.memberId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`User ${userId} disconnected: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.error(`Connection error for user ${userId}:`, error);
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, starting graceful shutdown');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, starting graceful shutdown');
  server.close(() => {
    console.log('Process terminated');
  });
});

// Global error handler
if (typeof errorHandler === 'function') {
  app.use(errorHandler);
} else {
  console.warn('⚠️  Custom error handler not available, using default');
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ 
      error: 'Something went wrong!',
      ...(process.env.NODE_ENV === 'development' && { message: err.message, stack: err.stack })
    });
  });
}

// 404 handler - must be last
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    suggestion: 'Check the API documentation for available endpoints'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  console.log(`
🚀 VoyageSync Server Started!
📊 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
📡 WebSocket: Enabled
🛡️ Security: ${helmet ? 'Enhanced' : 'Basic'}
⏰ Rate Limits: ${rateLimit ? 'Active' : 'Disabled'}
   ├── General: 200 requests/15min
   ├── Auth: 20 requests/15min  
   └── Login: 8 attempts/15min
⏰ Started at: ${new Date().toISOString()}
  `);
});

export default app;