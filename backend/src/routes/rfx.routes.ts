import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAnyPermission, requirePermission } from '../middleware/requirePermission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { Permission } from '../users/user.types.js';
import {
  listRfx,
  getRfxById,
  createRfxRecord,
  updateRfxRecord,
  updateRfxAttachments,
} from '../rfx/rfx.repository.js';

const router = Router();

const rfxViewPermissions: readonly Permission[] = ['rfx.view_all', 'rfx.view_own', 'rfx.create'];
const rfxManagePermissions: readonly Permission[] = ['rfx.create', 'rfx.view_all'];

const listSchema = z.object({
  status: z.enum(['draft', 'open', 'submitted', 'won', 'lost', 'cancelled', 'archived']).optional(),
  owner_id: z.string().optional(),
  org_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

const payloadSchema = z.object({
  org_id: z.number().int().positive(),
  type: z.enum(['rfi', 'rfp', 'rfq']),
  title: z.string().min(2),
  status: z.enum(['draft', 'open', 'submitted', 'won', 'lost', 'cancelled', 'archived']).optional(),
  due_at: z.string().min(4).optional().nullable(),
  owner_user_id: z.number().int().positive().optional(),
  notes: z.string().optional().nullable(),
  attachments_url: z.array(z.string()).optional().nullable(),
});

router.get(
  '/',
  authenticate,
  requireAnyPermission(rfxViewPermissions),
  asyncHandler(async (req, res) => {
    const params = listSchema.parse(req.query);
    let ownerId: number | undefined;
    if (params.owner_id === 'me') {
      ownerId = req.user?.id;
    } else if (params.owner_id) {
      ownerId = Number(params.owner_id);
    }
    if (ownerId && req.permissions && !req.permissions.includes('rfx.view_all') && ownerId !== req.user?.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const result = await listRfx({
      status: params.status,
      ownerId: req.permissions?.includes('rfx.view_all') ? ownerId : req.user?.id,
      orgId: params.org_id,
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
    const created = await createRfxRecord({
      ...payload,
      attachments: payload.attachments_url ?? null,
      owner_user_id: payload.owner_user_id ?? req.user?.id ?? undefined,
    });
    res.status(201).json(created);
  }),
);

router.get(
  '/:id',
  authenticate,
  requireAnyPermission(rfxViewPermissions),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const record = await getRfxById(id);
    if (!record) {
      return res.status(404).json({ message: 'RFx not found' });
    }
    if (
      record.owner_user_id !== req.user?.id &&
      !req.permissions?.includes('rfx.view_all') &&
      !req.permissions?.includes('rfx.create')
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(record);
  }),
);

router.put(
  '/:id',
  authenticate,
  requireAnyPermission(rfxManagePermissions),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const payload = payloadSchema.parse(req.body);
    const record = await getRfxById(id);
    if (!record) {
      return res.status(404).json({ message: 'RFx not found' });
    }
    if (
      record.owner_user_id !== req.user?.id &&
      !req.permissions?.includes('rfx.view_all') &&
      !req.permissions?.includes('rfx.create')
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await updateRfxRecord(id, {
      ...payload,
      owner_user_id: payload.owner_user_id ?? record.owner_user_id,
      attachments: payload.attachments_url ?? record.attachments_url ?? null,
    });
    res.json(updated);
  }),
);

router.post(
  '/:id/attachments',
  authenticate,
  requireAnyPermission(rfxManagePermissions),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const schema = z.object({ attachments: z.array(z.string()) });
    const { attachments } = schema.parse(req.body);
    const record = await getRfxById(id);
    if (!record) {
      return res.status(404).json({ message: 'RFx not found' });
    }
    if (
      record.owner_user_id !== req.user?.id &&
      !req.permissions?.includes('rfx.view_all') &&
      !req.permissions?.includes('rfx.create')
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const updated = await updateRfxAttachments(id, attachments);
    res.json(updated);
  }),
);

export default router;
