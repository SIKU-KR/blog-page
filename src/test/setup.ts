import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';

const createNetworkError = (method: string, url: string): Error => {
  return new Error(
    `[test-network] Unexpected network request in tests: ${method.toUpperCase()} ${url}. Mock this call explicitly.`
  );
};

const readRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const blockedFetch: typeof fetch = async (input, init) => {
  const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
  throw createNetworkError(method, readRequestUrl(input));
};

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(blockedFetch));

  vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation((method, url) => {
    throw createNetworkError(String(method ?? 'GET'), String(url ?? 'unknown'));
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
