import { sign, verify, type JwtPayload as JwtPayloadBase } from 'jsonwebtoken';
import { config } from '../config.js';

export type JwtPayload = JwtPayloadBase & {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  org_id?: number | null;
};

function assertJwtPayload(decoded: string | JwtPayloadBase | JwtPayload): asserts decoded is JwtPayload {
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }
  if (typeof decoded.sub !== 'string') {
    throw new Error('Invalid token subject');
  }
  if (!Array.isArray((decoded as JwtPayload).permissions)) {
    throw new Error('Invalid token permissions');
  }
}

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
  assertJwtPayload(decoded);
  return decoded;
}

export function verifyRefreshToken(token: string): JwtPayload & { exp: number; iat: number } {
  const decoded = verify(token, config.JWT_REFRESH_SECRET);
  assertJwtPayload(decoded);
  if (typeof decoded.exp !== 'number' || typeof decoded.iat !== 'number') {
    throw new Error('Invalid refresh token payload');
  }
  return decoded as JwtPayload & { exp: number; iat: number };
}
