import { providerCallLimit } from './composition-policy.js';

// Synchronous admission is atomic inside this process. This is an instance
// safeguard, not a shared quota or a guarantee of upstream cancellation.
const active = new Map<string, number>();
export function reserveProviderCapacity(provider: string, configuredLimit: string | undefined, fallback = 4): (() => void) | null {
  const limit = providerCallLimit(configuredLimit, fallback);
  const count = active.get(provider) ?? 0;
  if (count >= limit) return null;
  active.set(provider, count + 1);
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const remaining = (active.get(provider) ?? 1) - 1;
    if (remaining > 0) active.set(provider, remaining);
    else active.delete(provider);
  };
}
