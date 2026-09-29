import { api } from './client';

const data = (p) => p.then((r) => r.data);

/** Drops empty filter values so the URL stays clean. */
const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null));

export const authApi = {
  login: (body) => data(api.post('/auth/login', body)),
  register: (body) => data(api.post('/auth/register', body)),
  me: () => data(api.get('/auth/me')),
  changePassword: (body) => data(api.patch('/auth/password', body)),
};

export const adminApi = {
  dashboard: () => data(api.get('/admin/dashboard')),
  listUsers: (params) => data(api.get('/admin/users', { params: clean(params) })),
  getUser: (id) => data(api.get(`/admin/users/${id}`)),
  createUser: (body) => data(api.post('/admin/users', body)),
  availableOwners: () => data(api.get('/admin/owners/available')),
  listStores: (params) => data(api.get('/admin/stores', { params: clean(params) })),
  createStore: (body) => data(api.post('/admin/stores', body)),
};

export const storeApi = {
  list: (params) => data(api.get('/stores', { params: clean(params) })),
  rate: (storeId, rating) => data(api.put(`/stores/${storeId}/rating`, { rating })),
};

export const ownerApi = {
  dashboard: (params) => data(api.get('/owner/dashboard', { params: clean(params) })),
};
