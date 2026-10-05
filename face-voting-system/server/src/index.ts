import 'dotenv/config';
import express, { Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { adminAuthMiddleware } from './middleware/adminAuth.js';
import authRoutes from './routes/auth.js';
import partyRoutes from './routes/parties.js';
import voteRoutes from './routes/votes.js';
import adminAuthRoutes from './routes/adminAuth.js';
import adminRoutes from './routes/admin.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", 'blob:'],
      frameSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  frameguard: { action: 'deny' },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const voteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: 'Too many vote attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/parties', partyRoutes);
app.use('/api/v1/votes', authMiddleware, voteLimiter, voteRoutes);

// Admin auth routes (public)
app.use('/api/v1/admin/auth', adminAuthRoutes);

// Protected admin routes
const adminRouter = Router();
adminRouter.use(adminAuthMiddleware);
adminRouter.use('/', adminRoutes);
app.use('/api/v1/admin', adminRouter);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});