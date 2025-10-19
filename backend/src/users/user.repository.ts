import { pool } from '../db.js';
import type { AuthUser, Permission } from './user.types.js';

const permissionQuery = `
  SELECT rp.permission
  FROM role_permissions rp
  WHERE rp.role_id = ?
`;

export async function findUserByEmail(email: string): Promise<(AuthUser & { password_hash: string }) | null> {
  const [rows] = await pool.query<
    Array<{
      id: number;
      email: string;
      name: string;
      role: string;
      role_id: number;
      password_hash: string;
      active: number;
      org_id: number | null;
    }>
  >(
    `SELECT u.id, u.email, u.name, u.password_hash, u.active, u.org_id, r.name AS role, r.id AS role_id
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.email = ? AND u.deleted_at IS NULL
     LIMIT 1`,
    [email],
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  if (!user.active) {
    return null;
  }

  const [permissionRows] = await pool.query<Array<{ permission: Permission }>>(permissionQuery, [user.role_id]);
  const permissions = permissionRows.map((row) => row.permission);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    permissions,
    organizationId: user.org_id,
    password_hash: user.password_hash,
  };
}

export async function findUserById(id: number): Promise<AuthUser | null> {
  const [rows] = await pool.query<
    Array<{
      id: number;
      email: string;
      name: string;
      role: string;
      role_id: number;
      active: number;
      org_id: number | null;
    }>
  >(
    `SELECT u.id, u.email, u.name, u.active, u.org_id, r.name AS role, r.id AS role_id
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = ? AND u.deleted_at IS NULL
     LIMIT 1`,
    [id],
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  if (!user.active) {
    return null;
  }

  const [permissionRows] = await pool.query<Array<{ permission: Permission }>>(permissionQuery, [user.role_id]);
  const permissions = permissionRows.map((row) => row.permission);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AuthUser['role'],
    permissions,
    organizationId: user.org_id,
  };
}
