import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ErrorResponse, APIResponse } from '../../types';
import { getToken, clearToken } from './auth';
import { logger } from '@/lib/utils/logger';

// API 도메인 타입
export type APIDomain = 'admin' | 'public';

// API 엔드포인트 상수
export const API_ENDPOINTS = {
  POSTS: '/posts',
  ADMIN_POSTS: '/admin/posts',
  TAGS: '/tags',
  COMMENTS: '/comments',
  ADMIN_COMMENTS: '/admin/comments',
  ADMIN_IMAGES: '/admin/images',
  AI_SUMMARY: '/admin/ai/summary',
  AI_SLUG: '/admin/ai/slug',
  LOGIN: '/login',
} as const;

// 확장된 AxiosRequestConfig (도메인 선택 옵션 추가)
export interface APIRequestConfig extends AxiosRequestConfig {
  domain?: APIDomain;
}

// API 클라이언트 설정
export class APIClient {
  private adminClient: AxiosInstance;
  private publicClient: AxiosInstance;
  private static instance: APIClient;

  private constructor() {
    // 통합 백엔드 API URL (Cloudflare Workers)
    const API_URL = 'https://blog-server.peter012677.workers.dev';

    this.adminClient = axios.create({
      baseURL: API_URL,
      withCredentials: false, // JWT auth doesn't need cookies
      headers: {
        'Accept': 'application/json',
      },
      timeout: 60000,
    });

    this.publicClient = axios.create({
      baseURL: API_URL,
      withCredentials: false, // Public API는 쿠키 불필요
      headers: {
        'Accept': 'application/json',
      },
      timeout: 30000, // 더 짧은 타임아웃 (CDN 엣지)
    });

    this.setupInterceptors();
  }

  public static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  private setupInterceptors(): void {
    // Admin 클라이언트 인터셉터 (인증 필요)
    this.adminClient.interceptors.request.use(
      config => {
        const token = getToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        logger.debug('Admin API 요청', {
          url: config.url,
          method: config.method,
          params: config.params,
        });
        return config;
      },
      error => {
        logger.error('Admin API 요청 오류', error);
        return Promise.reject(error);
      }
    );

    this.adminClient.interceptors.response.use(
      response => {
        logger.debug('Admin API 응답 성공', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      error => {
        logger.error('Admin API 응답 오류', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
        });
        if (error?.response?.status === 401) {
          clearToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Public 클라이언트 인터셉터 (인증 불필요)
    this.publicClient.interceptors.request.use(
      config => {
        logger.debug('Public API 요청', {
          url: config.url,
          method: config.method,
          params: config.params,
        });
        return config;
      },
      error => {
        logger.error('Public API 요청 오류', error);
        return Promise.reject(error);
      }
    );

    this.publicClient.interceptors.response.use(
      response => {
        logger.debug('Public API 응답 성공', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      error => {
        logger.error('Public API 응답 오류', {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  // 도메인에 따라 적절한 클라이언트 선택
  private getClient(domain: APIDomain = 'admin'): AxiosInstance {
    return domain === 'public' ? this.publicClient : this.adminClient;
  }

  // 공통 API 호출 함수
  public async request<T>(config: APIRequestConfig): Promise<T> {
    try {
      const response = await this.retryRequest<APIResponse<T>>(config);
      const payload = response?.data;

      // 타입 가드로 APIResponse 구조 검증
      if (this.isAPIResponse<T>(payload)) {
        return payload.data;
      }

      // Plain response (string, number 등 직접 반환)
      return payload as T;
    } catch (error) {
      return this.handleError(error as AxiosError<ErrorResponse>);
    }
  }

  /**
   * Type guard for APIResponse structure
   * Ensures type safety by checking response shape at runtime
   */
  private isAPIResponse<T>(response: unknown): response is APIResponse<T> {
    return (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      'success' in response
    );
  }

  // 재시도 로직을 포함한 요청 함수
  private async retryRequest<T>(
    config: APIRequestConfig,
    maxRetries: number = 3
  ): Promise<AxiosResponse<T>> {
    let lastError: Error | AxiosError = new Error();
    const client = this.getClient(config.domain);

    // domain 속성은 Axios 요청에 포함되지 않도록 제거
    const { domain, ...axiosConfig } = config;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await client.request<T>(axiosConfig);
      } catch (error) {
        logger.warn(`API 호출 실패 (시도 ${attempt + 1}/${maxRetries})`, error);
        lastError = error as Error | AxiosError;

        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // 에러 처리 함수
  private handleError(error: AxiosError<ErrorResponse>): never {
    if (error.response) {
      // New backend returns { error: string } directly
      const errorData = error.response.data;
      const errorMessage =
        typeof errorData.error === 'string'
          ? errorData.error
          : errorData.error?.message || '알 수 없는 오류가 발생했습니다.';
      throw new Error(errorMessage);
    }

    if (error.request) {
      throw new Error('서버로부터 응답을 받지 못했습니다.');
    }

    throw new Error('요청 중 오류가 발생했습니다.');
  }
}

// SWR 호환 fetcher
export const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};
