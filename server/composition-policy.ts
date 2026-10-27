import { createHash } from 'node:crypto';
import { type Composition } from '../src/lib/genui.js';
import { CONTENT_VERSION } from '../src/lib/canvas.js';

// Small, bounded process-local cache. No raw visitor queries or credentials retained.
const cache=new Map<string,{expires:number;composition:Composition}>();
export function compositionCacheKey(draft:string,current:Composition,proposed:Composition,model:string){
  return createHash('sha256').update(JSON.stringify({draft:draft.trim().replace(/\s+/g,' '),current,proposed,model,version:CONTENT_VERSION})).digest('hex');
}
export function cachedComposition(key:string){const hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.composition;cache.delete(key);return null;}
export function cacheComposition(key:string,composition:Composition){
  if(cache.size>=128)cache.delete(cache.keys().next().value!);
  cache.set(key,{expires:Date.now()+10*60*1000,composition});
}
export function clearCompositionCache(){cache.clear();}
export function providerFailure(error:unknown):string {
  const status=(error as {statusCode?:number})?.statusCode;
  const message=error instanceof Error?error.message:'';
  return /credits|insufficient.quota|billing/i.test(message)?'credits':status===401||status===403?'authentication':status===402?'credits':status===429?'rate_limit':status===400?'invalid_request':status===404?'model_unavailable':error instanceof Error&&/timeout|abort/i.test(error.name)?'timeout':/invalid.*composition|schema|validation/i.test(message)?'invalid_output':'provider_unavailable';
}

/** Log only recognized diagnostic categories, never provider bodies or visitor text. */
export function providerLimitDetail(error: unknown): string | undefined {
  const message = error instanceof Error ? error.message : '';
  return /capacity|service.tier/i.test(message) ? 'capacity'
    : /token/i.test(message) ? 'tokens'
    : /request.*(?:rate|limit)|(?:rate|limit).*request/i.test(message) ? 'requests'
    : /spend|budget|credit|balance|billing/i.test(message) ? 'budget'
    : /limit|quota/i.test(message) ? 'unspecified_limit' : undefined;
}
