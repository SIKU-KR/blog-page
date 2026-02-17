import { z } from 'zod';

export const AuthSessionContractSchema = z.object({
  valid: z.boolean(),
  userId: z.number().optional(),
  expiresAt: z.string().optional(),
});

export type AuthSessionContract = z.infer<typeof AuthSessionContractSchema>;
