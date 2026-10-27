import { describe,it,expect } from 'vitest';
import { experiencePrompts,suggestExperiencePrompts } from '@/lib/experiencePrompts';
import { composeLocal,resolveCanvasPlan,validateComposition } from '@/lib/genui';
import { initialPlan } from '@/lib/canvas';
describe('experience autocomplete',()=>{
  it('matches prefixes, aliases and common missing-letter typos',()=>{
    expect(suggestExperiencePrompts('tell me about taiw')[0].id).toBe('taiwan');
    expect(suggestExperiencePrompts('taiwn')[0].id).toBe('taiwan');
    expect(suggestExperiencePrompts('fulbright')[0].id).toBe('taiwan');
    expect(suggestExperiencePrompts('congr')[0].id).toBe('congress');
  });
  it('offers bounded, unique starting points for empty and unrelated input',()=>{
    for(const query of ['', 'tell me about yourself', 'xyzzy']){
      const items=suggestExperiencePrompts(query);
      expect(items.length).toBeGreaterThan(0);expect(items.length).toBeLessThanOrEqual(4);
      expect(new Set(items.map(i=>i.id)).size).toBe(items.length);
    }
  });
  it.each(experiencePrompts)('routes $id to valid portfolio content',({text})=>{
    const plan=resolveCanvasPlan(text,initialPlan(),1);
    expect(plan.layout).not.toBe('empty');
    const spec=composeLocal(text,plan);
    expect(validateComposition(spec)).not.toBeNull();
    expect(spec.blocks.every(b=>b.kind!=='workshop'&&b.kind!=='photos')).toBe(true);
  });
});
