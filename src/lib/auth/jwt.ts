/**
 * JWT Authentication using jose library
 * Server-side JWT signing and verification
 */
import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';

export interface JWTPayload extends JoseJWTPayload {
  userId: number;
}

const EXPIRY_HOURS = 2;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT token with user ID
 */
export async function signJWT(payload: { userId: number }): Promise<string> {
  const secret = getSecret();

  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY_HOURS}h`)
    .sign(secret);
}

/**
 * Verify a JWT token and return the payload
 * Returns null if token is invalid or expired
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}
