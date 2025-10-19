declare namespace Express {
  interface Request {
    user?: import('../users/user.types.js').AuthUser;
    permissions?: import('../users/user.types.js').Permission[];
  }
}
