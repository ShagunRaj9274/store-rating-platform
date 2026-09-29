import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.nodeEnv === 'test' ? 'silent' : 'info',
  redact: ['req.headers.authorization'],
  transport:
    env.isProd || env.nodeEnv === 'test'
      ? undefined
      : { target: 'pino-pretty' },
});
