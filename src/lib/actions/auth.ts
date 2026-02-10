'use server';

import { cookies } from 'next/headers';
import { verifyJWT, type JWTPayload } from '@/lib/auth';

export async function getAuthenticatedUser(): Promise<JWTPayload> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifyJWT(token);

  if (!payload) {
    throw new Error('Unauthorized');
  }

  return payload;
}
