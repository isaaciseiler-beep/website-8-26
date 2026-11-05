import { describe, expect, it } from 'vitest';
import { EXPLORE_MS, phaseMark, skeletonKind } from '@/lib/exploreProgress';

describe('explore progress', () => {
  it('marks only the real step as current', () => {
    expect(phaseMark('finding', 'reading')).toBe('done');
    expect(phaseMark('finding', 'finding')).toBe('current');
    expect(phaseMark('finding', 'layout')).toBe('upcoming');
    expect(phaseMark('stopped', 'finding')).toBe('upcoming');
  });

  it('picks a skeleton from the layout that will arrive', () => {
    expect(skeletonKind('comparison')).toBe('split');
    expect(skeletonKind('timeline')).toBe('list');
    expect(skeletonKind('work')).toBe('rows');
    expect(skeletonKind('empty')).toBe('lines');
    expect(skeletonKind('detail')).toBe('story');
  });

  it('keeps answer motion inside the short ease-out range', () => {
    expect(EXPLORE_MS.answer).toBeGreaterThanOrEqual(150);
    expect(EXPLORE_MS.answer).toBeLessThanOrEqual(250);
    expect(EXPLORE_MS.stagger).toBeLessThan(EXPLORE_MS.answer);
  });
});