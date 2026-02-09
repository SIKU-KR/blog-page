/**
 * Authentication module exports
 */
export { signJWT, verifyJWT, extractToken, type JWTPayload } from './jwt';
export { hashPassword, verifyPassword, verifyAdminCredentials } from './password';
