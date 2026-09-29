import { api } from './client';

const unwrap = (p) => p.then((r) => r.data.data);
const unwrapList = (p) => p.then((r) => ({ data: r.data.data, meta: r.data.meta }));

/** Drops empty filter values so the URL stays clean. */
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export const authApi = {
  login: (body) => unwrap(api.post('/auth/login', body)),
  register: (body) => unwrap(api.post('/auth/register', body)),
  me: () => unwrap(api.get('/auth/me')),
  changePassword: (body) => unwrap(api.patch('/auth/password', body)),
};

export const adminApi = {
  dashboard: () => unwrap(api.get('/admin/dashboard')),
  listUsers: (params) => unwrapList(api.get('/admin/users', { params: clean(params) })),
  getUser: (id) => unwrap(api.get(`/admin/users/${id}`)),
  changeRole: (id, role) => unwrap(api.patch("/admin/users/" + id + "/role", { role })),
  createUser: (body) => unwrap(api.post('/admin/users', body)),
  availableOwners: () => unwrap(api.get('/admin/owners/available')),
  listStores: (params) => unwrapList(api.get('/admin/stores', { params: clean(params) })),
  createStore: (body) => unwrap(api.post('/admin/stores', body)),
};

export const storeApi = {
  list: (params) => unwrapList(api.get('/stores', { params: clean(params) })),
  rate: (storeId, rating) => unwrap(api.put(`/stores/${storeId}/rating`, { rating })),
};

export const ownerApi = {
  dashboard: (params) => unwrap(api.get('/owner/dashboard', { params: clean(params) })),
};
