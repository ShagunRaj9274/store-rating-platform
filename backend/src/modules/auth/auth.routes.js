import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../../validators/schemas.js';
import * as ctrl from './auth.controller.js';

const router = Router();

// Slow down brute-force attempts on credential endpoints.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

router.post('/register', credentialLimiter, validate({ body: registerSchema }), asyncHandler(ctrl.register));
router.post('/login', credentialLimiter, validate({ body: loginSchema }), asyncHandler(ctrl.login));
router.get('/me', authenticate, ctrl.me);
router.patch('/password', authenticate, validate({ body: changePasswordSchema }), asyncHandler(ctrl.changePassword));

export default router;
