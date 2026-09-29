import * as authService from './auth.service.js';

export const register = async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
};

export const login = async (req, res) => {
  res.json(await authService.login(req.body));
};

export const me = (req, res) => {
  res.json({ user: req.user });
};

export const changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.json({ message: 'Password updated' });
};
