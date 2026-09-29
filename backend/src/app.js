import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { query } from './db/pool.js';
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import storeRoutes from './modules/stores/stores.routes.js';
import ownerRoutes from './modules/owner/owner.routes.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.set('trust proxy', 1); // correct client IPs behind Render/Railway proxies (for rate limiting)
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header) and whitelisted frontends.
      if (!origin || env.clientUrls.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  }),
);
app.use(express.json({ limit: '10kb' }));
if (!env.isProd) app.use(morgan('dev'));

app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'up' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'down' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/owner', ownerRoutes);

app.use(notFound);
app.use(errorHandler);
