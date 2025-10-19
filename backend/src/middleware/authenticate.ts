import type { RequestHandler } from 'express';
import { getAccessTokenCookie } from '../utils/cookies.js';
import { getUserFromAccessToken } from '../auth/auth.service.js';
import { HttpError } from '../utils/errors.js';

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const token = getAccessTokenCookie(req);
    if (!token) {
      throw new HttpError(401, 'Unauthorized');
    }
    const user = await getUserFromAccessToken(token);
    req.user = user;
    req.permissions = user.permissions;
    next();
  } catch (error) {
    next(error);
  }
};
