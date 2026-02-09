/**
 * Auth Service
 * Authentication business logic
 */
import { signJWT, verifyJWT, type JWTPayload } from '@/lib/auth';
import { verifyAdminCredentials } from '@/lib/auth/password';
import { ValidationError, UnauthorizedError } from '@/lib/utils/validation';

export interface LoginResponse {
  token: string;
  expiresIn: number;
}

export interface SessionResponse {
  valid: boolean;
  userId?: number;
  exp?: number;
}

export class AuthService {
  /**
   * Authenticate user and return JWT token
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    const isValid = await verifyAdminCredentials(username, password);

    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT token
    const token = await signJWT({ userId: 1 }); // Single admin user with ID 1

    return {
      token,
      expiresIn: 7200, // 2 hours in seconds
    };
  }

  /**
   * Verify session token
   */
  async verifySession(token: string): Promise<SessionResponse> {
    const payload = await verifyJWT(token);

    if (!payload) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.userId,
      exp: payload.exp,
    };
  }
}

export const authService = new AuthService();
