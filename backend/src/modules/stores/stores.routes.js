import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { idParam, ratingSchema, userStoreListQuery } from '../../validators/schemas.js';
import * as ctrl from './stores.controller.js';

const router = Router();
router.use(authenticate, authorize('USER'));

router.get('/', validate({ query: userStoreListQuery }), asyncHandler(ctrl.list));
// PUT because the operation is idempotent: rating twice leaves one rating.
router.put('/:id/rating', validate({ params: idParam, body: ratingSchema }), asyncHandler(ctrl.rate));

export default router;
