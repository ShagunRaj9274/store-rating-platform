import * as storesService from './stores.service.js';
import { ok } from '../../utils/respond.js';

export const list = async (req, res) => {
  const { data, meta } = await storesService.listStoresForUser(req.user.id, req.validatedQuery);
  ok(res, data, { meta });
};

export const rate = async (req, res) => {
  const result = await storesService.upsertRating(req.user.id, req.params.id, req.body.rating);
  ok(res, result, { status: result.created ? 201 : 200 });
};
