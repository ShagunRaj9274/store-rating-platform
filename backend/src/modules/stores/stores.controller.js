import * as storesService from './stores.service.js';

export const list = async (req, res) => {
  res.json(await storesService.listStoresForUser(req.user.id, req.validatedQuery));
};

export const rate = async (req, res) => {
  const result = await storesService.upsertRating(req.user.id, req.params.id, req.body.rating);
  res.status(result.created ? 201 : 200).json(result);
};
