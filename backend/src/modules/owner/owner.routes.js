import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { ownerRatersQuery } from '../../validators/schemas.js';
import { getOwnerDashboard } from './owner.service.js';

const router = Router();
router.use(authenticate, authorize('OWNER'));

router.get(
  '/dashboard',
  validate({ query: ownerRatersQuery }),
  asyncHandler(async (req, res) => res.json(await getOwnerDashboard(req.user.id, req.validatedQuery))),
);

export default router;
