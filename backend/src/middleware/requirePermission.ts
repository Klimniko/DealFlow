import type { RequestHandler } from 'express';
import { HttpError } from '../utils/errors.js';

function hasPermission(permissions: string[] | undefined, permission: string) {
  return permissions?.includes('*') || permissions?.includes(permission);
}

export function requirePermission(permission: string): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Unauthorized'));
    }
    if (hasPermission(req.permissions, permission)) {
      return next();
    }
    return next(new HttpError(403, 'Forbidden'));
  };
}

export function requireAnyPermission(permissions: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Unauthorized'));
    }
    if (req.permissions?.includes('*')) {
      return next();
    }
    if (permissions.some((permission) => req.permissions?.includes(permission))) {
      return next();
    }
    return next(new HttpError(403, 'Forbidden'));
  };
}
