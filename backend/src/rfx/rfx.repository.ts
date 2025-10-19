import { pool } from '../db.js';

export type RfxRecord = {
  id: number;
  org_id: number;
  type: 'rfi' | 'rfp' | 'rfq';
  title: string;
  status: 'draft' | 'open' | 'submitted' | 'won' | 'lost' | 'cancelled' | 'archived';
  due_at: string | null;
  owner_user_id: number;
  notes: string | null;
  attachments_url: string[] | null;
  created_at: string;
  updated_at: string;
};

export type RfxPayload = {
  org_id: number;
  type: 'rfi' | 'rfp' | 'rfq';
  title: string;
  status?: RfxRecord['status'];
  due_at?: string | null;
  owner_user_id?: number;
  notes?: string | null;
  attachments?: string[] | null;
};

function mapRow(row: any): RfxRecord {
  return {
    ...row,
    attachments_url: row.attachments_url ? JSON.parse(row.attachments_url) : null,
  };
}

export async function listRfx({
  status,
  ownerId,
  orgId,
  page = 1,
  limit = 50,
}: {
  status?: RfxRecord['status'];
  ownerId?: number;
  orgId?: number;
  page?: number;
  limit?: number;
}) {
  const offset = (page - 1) * limit;
  const whereClauses = ['deleted_at IS NULL'];
  const params: Array<string | number> = [];
  if (status) {
    whereClauses.push('status = ?');
    params.push(status);
  }
  if (ownerId) {
    whereClauses.push('owner_user_id = ?');
    params.push(ownerId);
  }
  if (orgId) {
    whereClauses.push('org_id = ?');
    params.push(orgId);
  }
  const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const [rows] = await pool.query<any[]>(
    `SELECT id, org_id, type, title, status, due_at, owner_user_id, notes, attachments_url, created_at, updated_at
     FROM rfx
     ${where}
     ORDER BY updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );
  const [countRows] = await pool.query<Array<{ total: number }>>(
    `SELECT COUNT(*) as total FROM rfx ${where}`,
    params,
  );
  return {
    data: rows.map(mapRow),
    total: countRows[0]?.total ?? 0,
    page,
    limit,
  };
}

export async function getRfxById(id: number) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, org_id, type, title, status, due_at, owner_user_id, notes, attachments_url, created_at, updated_at
     FROM rfx
     WHERE id = ? AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  );
  if (rows.length === 0) {
    return null;
  }
  return mapRow(rows[0]);
}

export async function createRfxRecord(payload: RfxPayload) {
  const [result] = await pool.query<{ insertId: number }>(
    `INSERT INTO rfx (org_id, type, title, status, due_at, owner_user_id, notes, attachments_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      payload.org_id,
      payload.type,
      payload.title,
      payload.status ?? 'draft',
      payload.due_at ?? null,
      payload.owner_user_id ?? null,
      payload.notes ?? null,
      payload.attachments ? JSON.stringify(payload.attachments) : null,
    ],
  );
  return getRfxById(result.insertId);
}

export async function updateRfxRecord(id: number, payload: RfxPayload) {
  await pool.query(
    `UPDATE rfx
     SET org_id = ?, type = ?, title = ?, status = ?, due_at = ?, owner_user_id = ?, notes = ?, attachments_url = ?, updated_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [
      payload.org_id,
      payload.type,
      payload.title,
      payload.status ?? 'draft',
      payload.due_at ?? null,
      payload.owner_user_id ?? null,
      payload.notes ?? null,
      payload.attachments ? JSON.stringify(payload.attachments) : null,
      id,
    ],
  );
  return getRfxById(id);
}

export async function updateRfxAttachments(id: number, attachments: string[]) {
  await pool.query(
    `UPDATE rfx
     SET attachments_url = ?, updated_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [JSON.stringify(attachments), id],
  );
  return getRfxById(id);
}
