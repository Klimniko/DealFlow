import { apiFetch } from './client';
import { z } from 'zod';

const organizationSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: z.enum(['client', 'vendor']),
  website: z.string().url().nullable().optional(),
  country_code: z.string().length(2).nullable().optional(),
  timezone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Organization = z.infer<typeof organizationSchema>;

export type PaginatedOrganizations = {
  data: Organization[];
  total: number;
  page: number;
  limit: number;
};

export type OrganizationPayload = {
  name: string;
  type: 'client' | 'vendor';
  website?: string | null;
  country_code?: string | null;
  timezone?: string | null;
  notes?: string | null;
};

export function listOrganizations(params: { type?: 'client' | 'vendor'; page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.type) query.set('type', params.type);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  const queryString = query.toString();
  const path = queryString ? `/organizations?${queryString}` : '/organizations';
  return apiFetch<PaginatedOrganizations>(path);
}

export function getOrganization(id: number) {
  return apiFetch<Organization>(`/organizations/${id}`);
}

export function createOrganization(payload: OrganizationPayload) {
  return apiFetch<Organization, OrganizationPayload>('/organizations', {
    method: 'POST',
    body: payload,
  });
}

export function updateOrganization(id: number, payload: OrganizationPayload) {
  return apiFetch<Organization, OrganizationPayload>(`/organizations/${id}`, {
    method: 'PUT',
    body: payload,
  });
}

export function deleteOrganization(id: number) {
  return apiFetch<void>(`/organizations/${id}`, { method: 'DELETE' });
}
