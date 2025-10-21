import type { RequestHandler } from 'express';
import type { Permission } from '../users/user.types.js';
import { HttpError } from '../utils/errors.js';

function hasPermission(permissions: readonly Permission[] | undefined, permission: Permission) {
  return permissions?.includes('*') || permissions?.includes(permission);
}

export function requirePermission(permission: Permission): RequestHandler {
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

export function requireAnyPermission(permissions: readonly Permission[]): RequestHandler {
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
