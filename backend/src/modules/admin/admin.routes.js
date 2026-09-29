import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import {
  createUserSchema, createStoreSchema, changeRoleSchema, idParam, userListQuery, adminStoreListQuery,
} from '../../validators/schemas.js';
import * as ctrl from './admin.controller.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', asyncHandler(ctrl.dashboard));

router.get('/users', validate({ query: userListQuery }), asyncHandler(ctrl.listUsers));
router.post('/users', validate({ body: createUserSchema }), asyncHandler(ctrl.createUser));
router.get('/users/:id', validate({ params: idParam }), asyncHandler(ctrl.getUser));
router.patch('/users/:id/role', validate({ params: idParam, body: changeRoleSchema }), asyncHandler(ctrl.changeRole));
router.get('/owners/available', asyncHandler(ctrl.availableOwners));

router.get('/stores', validate({ query: adminStoreListQuery }), asyncHandler(ctrl.listStores));
router.post('/stores', validate({ body: createStoreSchema }), asyncHandler(ctrl.createStore));

export default router;
