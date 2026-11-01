import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { blankBlock } from '@/lib/genui';
import { cacheComposition, cachedComposition, clearCompositionCache, compositionCacheKey, providerCallLimit } from '../../server/composition-policy';

const composition={blocks:[blankBlock('benchmark')]};
describe('bounded composition safeguards',()=>{
  beforeEach(()=>clearCompositionCache());
  afterEach(()=>vi.useRealTimers());
  it.each([undefined,'','garbled','Infinity','-2','2.5'])('retains the configured default for an invalid call budget: %s',value=>{
    expect(providerCallLimit(value,250)).toBe(250);
  });
  it('allows an explicit zero budget to disable provider calls',()=>{
    expect(providerCallLimit('0',250)).toBe(0);
    expect(providerCallLimit(' 40 ',250)).toBe(40);
  });
  it('evicts old entries instead of growing beyond 128 cached compositions',()=>{
    for(let i=0;i<129;i++)cacheComposition(String(i),composition);
    expect(cachedComposition('0')).toBeNull();
    expect(cachedComposition('128')).toEqual(composition);
  });
  it('expires a cached composition after ten minutes',()=>{
    vi.useFakeTimers();
    cacheComposition('example',composition);
    vi.advanceTimersByTime(10*60*1000);
    expect(cachedComposition('example')).toBeNull();
  });
  it('hashes visitor text and distinguishes the current selected controls',()=>{
    const key=compositionCacheKey('A private visitor question',composition,composition,'model');
    expect(key).toMatch(/^[a-f0-9]{64}$/);
    const edited={blocks:[{...composition.blocks[0],region:'Midwest' as const}]};
    expect(compositionCacheKey('A private visitor question',edited,composition,'model')).not.toBe(key);
  });
});
