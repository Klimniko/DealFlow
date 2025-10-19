import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAnyPermission, requirePermission } from '../middleware/requirePermission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listOrganizations,
  createOrganization,
  getOrganizationById,
  updateOrganization,
  softDeleteOrganization,
  type OrganizationPayload,
} from '../organizations/organization.repository.js';

const router = Router();

const listSchema = z.object({
  type: z.enum(['client', 'vendor']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const payloadSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['client', 'vendor']),
  website: z.string().url().optional().nullable(),
  country_code: z.string().length(2).optional().nullable(),
  timezone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

router.get(
  '/',
  authenticate,
  requireAnyPermission(['rfx.create', 'rfx.view_own', 'rfx.view_all']),
  asyncHandler(async (req, res) => {
    const params = listSchema.parse(req.query);
    const result = await listOrganizations({
      type: params.type,
      page: params.page ?? 1,
      limit: params.limit ?? 50,
    });
    res.json(result);
  }),
);

router.post(
  '/',
  authenticate,
  requirePermission('rfx.create'),
  asyncHandler(async (req, res) => {
    const payload = payloadSchema.parse(req.body);
    const created = await createOrganization(payload as OrganizationPayload);
    res.status(201).json(created);
  }),
);

router.get(
  '/:id',
  authenticate,
  requireAnyPermission(['rfx.create', 'rfx.view_own', 'rfx.view_all']),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const organization = await getOrganizationById(id);
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(organization);
  }),
);

router.put(
  '/:id',
  authenticate,
  requirePermission('rfx.create'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = payloadSchema.parse(req.body);
    const updated = await updateOrganization(id, payload as OrganizationPayload);
    if (!updated) {
      return res.status(404).json({ message: 'Organization not found' });
    }
    res.json(updated);
  }),
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('rfx.create'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await softDeleteOrganization(id);
    res.status(204).end();
  }),
);

export default router;
