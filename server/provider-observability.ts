import { createHash, randomUUID } from 'node:crypto';

type Provider = 'jev' | 'mistral';
type Health = { status: 'not_checked' | 'healthy' | 'unavailable'; checkedAt?: string; reason?: string; model?: string };
const health: Record<Provider, Health> = { jev: { status: 'not_checked' }, mistral: { status: 'not_checked' } };
export const providerHealth = (provider: Provider) => ({ ...health[provider] });
export function providerRequest(provider: Provider, query: string) {
  return { requestId: randomUUID(), provider, questionHash: createHash('sha256').update(query).digest('hex').slice(0, 16) };
}
export function recordProviderResult(request: ReturnType<typeof providerRequest>, result: { status: 'healthy' | 'unavailable'; model?: string; reason?: string; duration?: number; layout?: string; cached?: boolean; httpStatus?: number; errorType?: string; limitDetail?: string; providerCode?: string; providerType?: string; retryAfter?: number; rateLimit?: number; rateRemaining?: number }) {
  if (!result.cached) health[request.provider] = { status: result.status, checkedAt: new Date().toISOString(), model: result.model, ...(result.reason ? { reason: result.reason } : {}) };
  const log = JSON.stringify({ event: 'portfolio.provider', ...request, ...result });
  if (result.status === 'unavailable') console.warn(log); else console.info(log);
}
