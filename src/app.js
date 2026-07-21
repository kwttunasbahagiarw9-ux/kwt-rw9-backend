import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import plantLogRoutes from './routes/plantLogRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
const defaultClientUrl = 'http://localhost:5173';
const configuredClientOrigins = (process.env.CLIENT_URL || defaultClientUrl)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isLocalNetworkOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    const isHttp = protocol === 'http:' || protocol === 'https:';
    const isLoopback = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
    const isPrivateIpv4 =
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);

    return isHttp && (isLoopback || isPrivateIpv4);
  } catch {
    return false;
  }
};
const allowLocalNetworkOrigins =
  process.env.NODE_ENV !== 'production' || configuredClientOrigins.some(isLocalNetworkOrigin);

const isDevelopmentOrigin = (origin) => allowLocalNetworkOrigins && isLocalNetworkOrigin(origin);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredClientOrigins.includes(origin) || isDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS.`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  })
);

import mongoose from 'mongoose';

app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    status: 'ok',
    service: 'kwt-rw9-api',
    database: dbStatus[dbState] || 'unknown'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/plants', plantLogRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
