import { apiFetch } from './client';
import { z } from 'zod';

const rfxSchema = z.object({
  id: z.number().int().positive(),
  org_id: z.number().int().positive(),
  type: z.enum(['rfi', 'rfp', 'rfq']),
  title: z.string(),
  status: z.enum(['draft', 'open', 'submitted', 'won', 'lost', 'cancelled', 'archived']),
  due_at: z.string().nullable(),
  owner_user_id: z.number().int().positive(),
  notes: z.string().nullable(),
  attachments_url: z.array(z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Rfx = z.infer<typeof rfxSchema>;

export type PaginatedRfx = {
  data: Rfx[];
  total: number;
  page: number;
  limit: number;
};

export type RfxPayload = {
  org_id: number;
  type: 'rfi' | 'rfp' | 'rfq';
  title: string;
  status?: Rfx['status'];
  due_at?: string | null;
  owner_user_id?: number;
  notes?: string | null;
  attachments_url?: string[] | null;
};

export function listRfx(params: {
  status?: Rfx['status'];
  owner_id?: number | 'me';
  org_id?: number;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.owner_id) query.set('owner_id', params.owner_id.toString());
  if (params.org_id) query.set('org_id', params.org_id.toString());
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  const queryString = query.toString();
  const path = queryString ? `/rfx?${queryString}` : '/rfx';
  return apiFetch<PaginatedRfx>(path);
}

export function getRfx(id: number) {
  return apiFetch<Rfx>(`/rfx/${id}`);
}

export function createRfx(payload: RfxPayload) {
  return apiFetch<Rfx, RfxPayload>('/rfx', {
    method: 'POST',
    body: payload,
  });
}

export function updateRfx(id: number, payload: RfxPayload) {
  return apiFetch<Rfx, RfxPayload>(`/rfx/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function uploadRfxAttachment(id: number, attachments: string[]) {
  return apiFetch<Rfx, { attachments: string[] }>(`/rfx/${id}/attachments`, {
    method: 'POST',
    body: { attachments },
  });
}
