import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/authenticate.js';
import { requireAnyPermission } from '../middleware/requirePermission.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { config } from '../config.js';

const router = Router();

const payloadSchema = z.object({
  summary: z.string().min(10),
  requirements: z.array(z.string()).nonempty(),
  clientId: z.number().int().positive(),
  estimateId: z.number().int().positive().optional(),
});

router.post(
  '/proposal',
  authenticate,
  requireAnyPermission(['rfx.create', 'rfx.view_all', 'estimate.create']),
  asyncHandler(async (req, res) => {
    if (!config.N8N_PROPOSAL_WEBHOOK_URL) {
      return res.status(503).json({ message: 'AI provider unavailable' });
    }
    const payload = payloadSchema.parse(req.body);
    const response = await fetch(config.N8N_PROPOSAL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        user: {
          id: req.user?.id,
          email: req.user?.email,
          name: req.user?.name,
          role: req.user?.role,
        },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ message: 'Failed to generate proposal', details: text });
    }
    const data = await response.json().catch(() => ({ message: 'Proposal generated' }));
    res.json(data);
  }),
);

export default router;
