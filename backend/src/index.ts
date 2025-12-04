import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import addressRoutes from './routes/address';
import walletRoutes from './routes/wallet';
import orderRoutes from './routes/order';
import photoRoutes from './routes/photo';
import partnerRoutes from './routes/partner';
import centerRoutes from './routes/center';
import adminRoutes from './routes/admin';
import tripRoutes from './routes/trip';
import publicRoutes from './routes/public';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://ironing-service.vercel.app',
  'http://localhost:5173'
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Ironing Service API',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      orders: '/api/orders/*'
    }
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/orders', photoRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/center', centerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/trips', tripRoutes);
app.use('/api', publicRoutes); // Public routes for services, centers, timeslots

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.message);
  console.error('Stack:', err.stack);

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Default error response
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server (only in non-serverless environments)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`);
    console.log(`📁 Serving uploads from: ${path.join(__dirname, '../../uploads')}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
} else {
  console.log('🚀 Running in serverless mode (Vercel)');
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log('CORS Origins:', allowedOrigins);
}

// Export for Vercel serverless
export default app;
