const jwt = require('jsonwebtoken');

/**
 * @typedef {Object} AuthContext
 * @property {number} user_id
 * @property {string} role
 * @property {string[]} permissions
 * @property {string} email
 */

/**
 * Attaches the decoded JWT payload to each incoming item to enforce RBAC rules downstream.
 * @param {{ json: { headers?: Record<string, string>, $auth?: AuthContext } }[]} items
 */
function authMiddleware(items) {
  return items.map((item) => {
    const headers = item.json.headers || {};
    const cookieHeader = headers.cookie || headers.Cookie;

    if (!cookieHeader) {
      throw new Error('Missing authentication token');
    }

    const tokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
    if (!tokenMatch) {
      throw new Error('Missing access token');
    }

    const token = decodeURIComponent(tokenMatch[1]);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    item.json.$auth = {
      user_id: payload.sub,
      role: payload.role,
      permissions: payload.permissions || [],
      email: payload.email,
    };

    return item;
  });
}

module.exports = { authMiddleware };
