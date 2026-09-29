import * as authService from './auth.service.js';
import { ok } from '../../utils/respond.js';

export const register = async (req, res) =>
  ok(res, await authService.register(req.body), { status: 201 });

export const login = async (req, res) =>
  ok(res, await authService.login(req.body));

export const me = (req, res) =>
  ok(res, { user: req.user });

export const changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  ok(res, null, { message: 'Password updated' });
};
