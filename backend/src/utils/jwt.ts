import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type JwtPayload = {
  sub: number;
  email: string;
  role: string;
  permissions: string[];
  org_id?: number | null;
};

export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL,
  });
}

export function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload & { exp: number; iat: number } {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload & { exp: number; iat: number };
}
