import jwt from 'jsonwebtoken';
import type { Permission } from '../../frontend/src/types/user';

type AuthContext = {
  user_id: number;
  role: string;
  permissions: Permission[];
  email: string;
};

type RequestItem = {
  json: Record<string, unknown> & { headers?: Record<string, string>; $auth?: AuthContext };
};

export function authMiddleware(items: RequestItem[]): RequestItem[] {
  return items.map((item) => {
    const cookieHeader = item.json.headers?.cookie ?? item.json.headers?.Cookie;
    if (!cookieHeader) {
      throw new Error('Missing authentication token');
    }

    const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
    if (!tokenMatch) {
      throw new Error('Missing access token');
    }

    const token = decodeURIComponent(tokenMatch[1]);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      sub: number;
      role: string;
      permissions: Permission[];
      email: string;
    };

    const auth: AuthContext = {
      user_id: payload.sub,
      role: payload.role,
      permissions: payload.permissions,
      email: payload.email,
    };

    item.json.$auth = auth;
    return item;
  });
}
