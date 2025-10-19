import { pool } from '../db.js';

export type OrganizationRecord = {
  id: number;
  name: string;
  type: 'client' | 'vendor';
  website: string | null;
  country_code: string | null;
  timezone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export async function listOrganizations({
  type,
  page = 1,
  limit = 50,
}: {
  type?: 'client' | 'vendor';
  page?: number;
  limit?: number;
}) {
  const offset = (page - 1) * limit;
  const params: Array<string | number> = [];
  let where = 'WHERE deleted_at IS NULL';
  if (type) {
    where += ' AND type = ?';
    params.push(type);
  }
  const [rows] = await pool.query<OrganizationRecord[]>(
    `SELECT id, name, type, website, country_code, timezone, notes, created_at, updated_at
     FROM organizations
     ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query<Array<{ total: number }>>(
    `SELECT COUNT(*) as total FROM organizations ${where}`,
    params,
  );
  return {
    data: rows,
    total: countRows[0]?.total ?? 0,
    page,
    limit,
  };
}

export async function getOrganizationById(id: number) {
  const [rows] = await pool.query<OrganizationRecord[]>(
    `SELECT id, name, type, website, country_code, timezone, notes, created_at, updated_at
     FROM organizations
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  );
  return rows[0] ?? null;
}

export type OrganizationPayload = {
  name: string;
  type: 'client' | 'vendor';
  website?: string | null;
  country_code?: string | null;
  timezone?: string | null;
  notes?: string | null;
};

export async function createOrganization(payload: OrganizationPayload) {
  const [result] = await pool.query<{ insertId: number }>(
    `INSERT INTO organizations (name, type, website, country_code, timezone, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [payload.name, payload.type, payload.website ?? null, payload.country_code ?? null, payload.timezone ?? null, payload.notes ?? null],
  );
  return getOrganizationById(result.insertId);
}

export async function updateOrganization(id: number, payload: OrganizationPayload) {
  await pool.query(
    `UPDATE organizations
     SET name = ?, type = ?, website = ?, country_code = ?, timezone = ?, notes = ?, updated_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [
      payload.name,
      payload.type,
      payload.website ?? null,
      payload.country_code ?? null,
      payload.timezone ?? null,
      payload.notes ?? null,
      id,
    ],
  );
  return getOrganizationById(id);
}

export async function softDeleteOrganization(id: number) {
  await pool.query(`UPDATE organizations SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`, [id]);
}
