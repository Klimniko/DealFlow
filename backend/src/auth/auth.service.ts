import { add } from 'date-fns';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { findUserByEmail, findUserById } from '../users/user.repository.js';
import { verifyPassword } from '../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtPayload,
} from '../utils/jwt.js';
import { storeRefreshToken, findRefreshToken, rotateRefreshToken, revokeRefreshToken } from './refreshTokens.js';
import { config } from '../config.js';
import { HttpError } from '../utils/errors.js';
import { parseDuration } from '../utils/duration.js';

function computeRefreshExpiry() {
  const duration = parseDuration(config.REFRESH_TOKEN_TTL);
  return add(new Date(), duration);
}

function handleJwtError(error: unknown): never {
  if (error instanceof TokenExpiredError) {
    throw new HttpError(401, 'Token expired', 'TOKEN_EXPIRED');
  }
  if (error instanceof JsonWebTokenError) {
    throw new HttpError(401, 'Invalid token', 'TOKEN_INVALID');
  }
  throw error;
}

function toAuthPayload(user: { id: number; email: string; role: string; permissions: string[]; organizationId: number | null }) {
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    org_id: user.organizationId ?? undefined,
  } satisfies JwtPayload;
}

export function getAccessTokenMaxAgeMs() {
  const duration = parseDuration(config.ACCESS_TOKEN_TTL);
  return add(new Date(0), duration).getTime();
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new HttpError(401, 'Invalid credentials');
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new HttpError(401, 'Invalid credentials');
  }

  const payload = toAuthPayload(user);
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshExpiresAt = computeRefreshExpiry();
  await storeRefreshToken(user.id, refreshToken, refreshExpiresAt);

  return {
    user,
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
}

export async function getUserFromAccessToken(token: string) {
  try {
    const payload = verifyAccessToken(token);
    const user = await findUserById(payload.sub);
    if (!user) {
      throw new HttpError(401, 'Invalid token');
    }
    return user;
  } catch (error) {
    handleJwtError(error);
    throw new HttpError(401, 'Invalid token');
  }
}

export async function refreshTokens(currentToken: string) {
  const stored = await findRefreshToken(currentToken);
  if (!stored) {
    throw new HttpError(401, 'Refresh token invalid');
  }

  if (stored.expires_at <= new Date()) {
    await revokeRefreshToken(currentToken);
    throw new HttpError(401, 'Refresh token expired', 'TOKEN_EXPIRED');
  }

  const payload: ReturnType<typeof verifyRefreshToken> = (() => {
    try {
      return verifyRefreshToken(currentToken);
    } catch (error) {
      handleJwtError(error);
      throw new HttpError(401, 'Invalid token');
    }
  })();
  if (stored.rotated_at) {
    throw new HttpError(401, 'Refresh token already used');
  }
  const user = await findUserById(payload.sub);
  if (!user) {
    throw new HttpError(401, 'User not found');
  }

  const authPayload = toAuthPayload(user);
  const accessToken = signAccessToken(authPayload);
  const newRefreshToken = signRefreshToken(authPayload);
  const refreshExpiresAt = computeRefreshExpiry();
  const rotated = await rotateRefreshToken(currentToken, newRefreshToken, refreshExpiresAt);
  if (!rotated) {
    throw new HttpError(401, 'Refresh token expired');
  }

  return { accessToken, refreshToken: newRefreshToken, refreshExpiresAt, user };
}

export async function logoutWithToken(token: string) {
  if (!token) {
    return;
  }
  await revokeRefreshToken(token);
}
