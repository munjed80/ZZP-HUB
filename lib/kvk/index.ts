import type { KVKProvider } from './interface';
import { MockKVKProvider } from './mock-provider';
import { RealKVKProvider } from './real-provider';

/**
 * Get the KVK provider based on environment configuration
 * For now, always returns the mock provider
 * In the future, this can switch to a real provider based on env vars
 */
export function getKVKProvider(): KVKProvider {
  const useRealAPI = process.env.KVK_API_KEY && process.env.USE_REAL_KVK_API === 'true';

  if (useRealAPI) {
    return new RealKVKProvider(process.env.KVK_API_KEY!);
  }

  return new MockKVKProvider();
}
