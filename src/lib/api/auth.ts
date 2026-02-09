import { APIClient, API_ENDPOINTS } from './client';

const TOKEN_KEY = 'admin_token';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  exp?: number; // JWT 만료 시간 (timestamp)
}

export interface SessionResponse {
  valid: boolean;
  userId?: number;
  expiresAt?: string;
}

// Legacy format for backward compatibility
export interface LegacySessionResponse {
  authenticated: boolean;
  user?: User;
}

// Token management utilities
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function parseJwt(token: string): User | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(
      typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString()
    );
    return payload as User;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export class AuthService {
  private client: APIClient;

  constructor(client: APIClient) {
    this.client = client;
  }

  /**
   * 세션 상태 확인 (JWT 기반)
   */
  async checkSession(): Promise<SessionResponse> {
    try {
      const response = await this.client.request<SessionResponse>({
        url: API_ENDPOINTS.SESSION,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return response;
    } catch (error) {
      console.error('세션 확인 오류:', error);
      return { valid: false };
    }
  }

  /**
   * 로그인 (세션 기반)
   */
  async login(username: string, password: string): Promise<void> {
    await this.client.request<void>({
      url: API_ENDPOINTS.LOGIN,
      method: 'POST',
      data: { username, password },
    });
  }

  /**
   * 로그인 (토큰 기반) - 레거시 지원
   */
  loginWithToken(token: string): User | null {
    setToken(token);
    return parseJwt(token);
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      await this.client.request<void>({
        url: '/logout',
        method: 'POST',
      });
    } catch (error) {
      console.error('로그아웃 오류:', error);
      throw error;
    }
  }
}
