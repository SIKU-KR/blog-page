import { SWRConfiguration } from 'swr';

const startsWithIgnoreCase = (value: string, prefix: string): boolean => {
  return value.toLowerCase().startsWith(prefix.toLowerCase());
};

const getErrorStatus = (error: unknown): number | null => {
  if (!error || typeof error !== 'object' || !('status' in error)) {
    return null;
  }

  const { status } = error as { status?: unknown };

  return typeof status === 'number' ? status : null;
};

const getRequestPathFromKey = (key: unknown): string | null => {
  if (typeof key === 'string') {
    return key;
  }

  if (Array.isArray(key) && typeof key[0] === 'string') {
    return key[0];
  }

  return null;
};

const isAdminRequestKey = (key: unknown): boolean => {
  const requestPath = getRequestPathFromKey(key);

  return requestPath ? startsWithIgnoreCase(requestPath, '/api/admin') : false;
};

const isAdminPath = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const pathname = window.location?.pathname;

  return typeof pathname === 'string' ? startsWithIgnoreCase(pathname, '/admin') : false;
};

/**
 * Global SWR configuration
 * Provides consistent data fetching behavior across the application
 */
export const swrConfig: SWRConfiguration = {
  // Disable automatic revalidation on window focus for better UX
  revalidateOnFocus: false,

  // Revalidate when network reconnects
  revalidateOnReconnect: true,

  // Retry on error with exponential backoff
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,

  // Deduplicate requests within 2 seconds
  dedupingInterval: 2000,

  // Keep previous data while revalidating (better UX for lists)
  keepPreviousData: true,

  // Global error handler
  onError: (error, key) => {
    console.error('SWR Error:', key, error);

    const status = getErrorStatus(error);
    if (status !== 401) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (isAdminRequestKey(key) || isAdminPath()) {
      window.location.href = '/login';
    }
  },

  // Custom retry logic with exponential backoff
  onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
    const status = getErrorStatus(error);

    // Never retry on 404
    if (status === 404) return;

    // Never retry on 401 (unauthorized)
    if (status === 401) return;

    // Max 5 retries
    if (retryCount >= 5) return;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    setTimeout(() => revalidate({ retryCount }), Math.pow(2, retryCount) * 1000);
  },
};
