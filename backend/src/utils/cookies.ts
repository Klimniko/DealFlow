import type { Request, Response } from 'express';
import { config } from '../config.js';

const ACCESS_COOKIE_NAME = 'dealflow_access';
const REFRESH_COOKIE_NAME = 'dealflow_refresh';

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
  refreshExpiresAt: Date,
  accessTokenMaxAgeMs: number,
) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.COOKIE_SECURE,
    domain: config.COOKIE_DOMAIN,
    path: '/',
    maxAge: accessTokenMaxAgeMs,
  });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.COOKIE_SECURE,
    domain: config.COOKIE_DOMAIN,
    path: '/auth/refresh',
    expires: refreshExpiresAt,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.COOKIE_SECURE,
    domain: config.COOKIE_DOMAIN,
    path: '/',
  });
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.COOKIE_SECURE,
    domain: config.COOKIE_DOMAIN,
    path: '/auth/refresh',
  });
}

export function getAccessTokenCookie(req: Request) {
  return (req.cookies?.[ACCESS_COOKIE_NAME] as string | undefined) ?? undefined;
}

export function getRefreshTokenCookie(req: Request) {
  return (req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? undefined;
}
