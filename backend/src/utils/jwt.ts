import { sign, verify, type JwtPayload as JwtPayloadBase } from 'jsonwebtoken';
import { config } from '../config.js';

export type JwtPayload = JwtPayloadBase & {
  sub: number;
  email: string;
  role: string;
  permissions: string[];
  org_id?: number | null;
};

export function signAccessToken(payload: JwtPayload) {
  return sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload: JwtPayload) {
  return sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = verify(token, config.JWT_ACCESS_SECRET);
  if (typeof decoded === 'string' || !decoded) {
    throw new Error('Invalid access token payload');
  }
  return decoded as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload & { exp: number; iat: number } {
  const decoded = verify(token, config.JWT_REFRESH_SECRET);
  if (typeof decoded === 'string' || !decoded || typeof decoded.exp !== 'number' || typeof decoded.iat !== 'number') {
    throw new Error('Invalid refresh token payload');
  }
  return decoded as JwtPayload & { exp: number; iat: number };
}
