import { z } from 'zod';

/**
 * Login request schema
 */
export const LoginRequestSchema = z.object({
  username: z.string().min(1, '사용자 이름은 필수입니다.'),
  password: z.string().min(1, '비밀번호는 필수입니다.'),
});

/**
 * Login response schema
 */
export const LoginResponseSchema = z.object({
  token: z.string(),
  expiresIn: z.number(),
});

/**
 * Session response schema
 */
export const SessionResponseSchema = z.object({
  valid: z.boolean(),
  userId: z.number().optional(),
  exp: z.number().optional(),
});

// Type exports
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

/**
 * Validate login request
 */
export function validateLoginRequest(data: unknown): LoginRequest | null {
  const result = LoginRequestSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate login response
 */
export function validateLoginResponse(data: unknown): LoginResponse | null {
  const result = LoginResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Validate session response
 */
export function validateSessionResponse(data: unknown): SessionResponse | null {
  const result = SessionResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}
