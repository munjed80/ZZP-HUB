import type { KVKProvider } from './interface';
import { MockKVKProvider } from './mock-provider';

/**
 * Get the KVK provider based on environment configuration
 * For now, always returns the mock provider
 * In the future, this can switch to a real provider based on env vars
 */
export function getKVKProvider(): KVKProvider {
  const useRealAPI = process.env.KVK_API_KEY && process.env.USE_REAL_KVK_API === 'true';

  if (useRealAPI) {
    // TODO: Implement real KVK provider when API key is available
    // return new RealKVKProvider(process.env.KVK_API_KEY!);
    console.log('Real KVK API not yet implemented, using mock');
  }

  return new MockKVKProvider();
}
