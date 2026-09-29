import * as adminService from './admin.service.js';
import { ok } from '../../utils/respond.js';

export const dashboard = async (_req, res) =>
  ok(res, await adminService.getDashboard());

export const listUsers = async (req, res) => {
  const { data, meta } = await adminService.listUsers(req.validatedQuery);
  ok(res, data, { meta });
};

export const getUser = async (req, res) =>
  ok(res, await adminService.getUserById(req.params.id));

export const createUser = async (req, res) =>
  ok(res, await adminService.createUser(req.body), { status: 201 });

export const availableOwners = async (_req, res) =>
  ok(res, await adminService.listAvailableOwners());

export const listStores = async (req, res) => {
  const { data, meta } = await adminService.listStores(req.validatedQuery);
  ok(res, data, { meta });
};

export const createStore = async (req, res) =>
  ok(res, await adminService.createStore(req.body), { status: 201 });

export const changeRole = async (req, res) =>
  ok(
    res,
    await adminService.changeUserRole(req.user.id, req.params.id, req.body.role),
    { message: 'Role updated' },
  );
