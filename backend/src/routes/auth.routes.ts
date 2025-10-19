import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  authenticateUser,
  getUserFromAccessToken,
  refreshTokens,
  logoutWithToken,
  getAccessTokenMaxAgeMs,
} from '../auth/auth.service.js';
import { clearAuthCookies, getRefreshTokenCookie, setAuthCookies, getAccessTokenCookie } from '../utils/cookies.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken, refreshExpiresAt } = await authenticateUser(
      payload.email,
      payload.password,
    );
    const accessMaxAge = getAccessTokenMaxAgeMs();
    const accessExpiresAt = new Date(Date.now() + accessMaxAge);
    setAuthCookies(res, accessToken, refreshToken, refreshExpiresAt, accessMaxAge);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        organizationId: user.organizationId,
      },
      accessTokenExpiresAt: accessExpiresAt.toISOString(),
    });
  }),
);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const token = getAccessTokenCookie(req);
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await getUserFromAccessToken(token);
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      organizationId: user.organizationId,
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenCookie(req);
    if (!refreshToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { accessToken, refreshToken: newRefreshToken, refreshExpiresAt, user } = await refreshTokens(
      refreshToken,
    );
    const accessMaxAge = getAccessTokenMaxAgeMs();
    const accessExpiresAt = new Date(Date.now() + accessMaxAge);
    setAuthCookies(res, accessToken, newRefreshToken, refreshExpiresAt, accessMaxAge);
    res.json({ accessTokenExpiresAt: accessExpiresAt.toISOString(), user });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenCookie(req);
    if (refreshToken) {
      await logoutWithToken(refreshToken);
    }
    clearAuthCookies(res);
    res.status(204).end();
  }),
);

export default router;
