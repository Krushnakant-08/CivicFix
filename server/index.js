import dotenv from 'dotenv';

// Load environment variables immediately (before other imports evaluate)
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import swaggerUi from 'swagger-ui-express';

import connectDB from './config/db.js';
import { initializeSocket } from './socket.js';
import { swaggerSpec } from './config/swagger.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import auditRoutes from './routes/audit.js';


const app = express();
const httpServer = createServer(app);

// ─── Initialize Socket.io ────────────────────────────────
initializeSocket(httpServer);

// ─── Phase 8.4: Security — Helmet ────────────────────────
app.use(
  helmet({
    // Allow Swagger UI to load its own scripts
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
        imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── Phase 8.4: CORS (tightened) ─────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173' // vite preview
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Swagger UI)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Phase 8.4: Rate Limiting ─────────────────────────────
// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// Strict auth limiter — prevent brute-force on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again in 15 minutes.' },
});

// Report submission limiter
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reports submitted, please wait before submitting again.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// ─── Phase 8.4: Input Sanitization ───────────────────────
// Prevent MongoDB operator injection ($where, $gt, etc.)
app.use(mongoSanitize());
// Prevent XSS attacks (strips HTML/JS from request body)
app.use(xssClean());

// ─── Body Parsers ─────────────────────────────────────────
// 10MB limit allows base64-encoded images in report submissions
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Phase 8.5: Swagger API Docs ─────────────────────────
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Server health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 *                 message: { type: string }
 *                 timestamp: { type: string, format: date-time }
 *                 uptime: { type: number }
 */
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'CivicFix API Docs',
    customCss: `
      .swagger-ui .topbar { background: linear-gradient(135deg, #1e40af, #7c3aed); }
      .swagger-ui .topbar-wrapper .link span { display: none; }
      .swagger-ui .topbar-wrapper::before { content: 'CivicFix API'; color: white; font-weight: 700; font-size: 1.2rem; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
    },
  })
);

// Serve raw OpenAPI JSON
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportLimiter, reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);

// ─── Health Check (enhanced) ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CivicFix API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    features: {
      pwa: true,
      auditTrail: true,
      rateLimiting: true,
      swagger: '/api/docs',
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  // Don't log CORS errors as server errors
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ message: err.message });
  }
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Server Error:', err.stack);
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── Start Server ────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB BEFORE starting the server
    await connectDB();

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 CivicFix Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   API Base:    http://localhost:${PORT}/api`);
      console.log(`   API Docs:    http://localhost:${PORT}/api/docs`);
      console.log(`   WebSocket:   ws://localhost:${PORT}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
