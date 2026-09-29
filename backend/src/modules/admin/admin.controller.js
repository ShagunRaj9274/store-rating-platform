import * as adminService from './admin.service.js';

export const dashboard = async (_req, res) => res.json(await adminService.getDashboard());

export const listUsers = async (req, res) => res.json(await adminService.listUsers(req.validatedQuery));
export const getUser = async (req, res) => res.json(await adminService.getUserById(req.params.id));
export const createUser = async (req, res) => res.status(201).json(await adminService.createUser(req.body));
export const availableOwners = async (_req, res) => res.json(await adminService.listAvailableOwners());

export const listStores = async (req, res) => res.json(await adminService.listStores(req.validatedQuery));
export const createStore = async (req, res) => res.status(201).json(await adminService.createStore(req.body));
