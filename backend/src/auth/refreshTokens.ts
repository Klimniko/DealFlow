import crypto from 'node:crypto';
import { pool } from '../db.js';

type RefreshTokenRow = {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  rotated_at: Date | null;
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId: number, token: string, expiresAt: Date) {
  const tokenHash = hashToken(token);
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt],
  );
}

export async function rotateRefreshToken(currentToken: string, newToken: string, expiresAt: Date) {
  const currentHash = hashToken(currentToken);
  const newHash = hashToken(newToken);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query<RefreshTokenRow[]>(
      `SELECT id, user_id, token_hash, expires_at, rotated_at FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW() FOR UPDATE`,
      [currentHash],
    );
    if (rows.length === 0) {
      await conn.rollback();
      return false;
    }
    const current = rows[0];
    const [result] = await conn.query<{ insertId: number }>(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [current.user_id, newHash, expiresAt],
    );
    await conn.query(
      `UPDATE refresh_tokens SET rotated_at = NOW(), replaced_by = ? WHERE id = ?`,
      [result.insertId, current.id],
    );
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export async function revokeRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  await pool.query(`DELETE FROM refresh_tokens WHERE token_hash = ?`, [tokenHash]);
}

export async function findRefreshToken(token: string): Promise<RefreshTokenRow | null> {
  const tokenHash = hashToken(token);
  const [rows] = await pool.query<RefreshTokenRow[]>(
    `SELECT id, user_id, token_hash, expires_at, rotated_at FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()`,
    [tokenHash],
  );
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}
