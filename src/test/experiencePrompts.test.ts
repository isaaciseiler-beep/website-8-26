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
  it('offers bounded, unique starting points for empty input',()=>{
    for(const query of ['', 'tell me about yourself']){
      const items=suggestExperiencePrompts(query);
      expect(items.length).toBeGreaterThan(0);expect(items.length).toBeLessThanOrEqual(4);
      expect(new Set(items.map(i=>i.id)).size).toBe(items.length);
    }
  });
  it('leaves unrelated and photography requests to the freeform path',()=>{
    for(const query of ['xyzzy','weather in Seattle','Japan photos','Taiwan album'])expect(suggestExperiencePrompts(query)).toEqual([]);
  });
  it.each(experiencePrompts)('routes $id to valid portfolio content',({text})=>{
    const plan=resolveCanvasPlan(text,initialPlan(),1);
    expect(plan.layout).not.toBe('empty');
    const spec=composeLocal(text,plan);
    expect(validateComposition(spec)).not.toBeNull();
    expect(spec.blocks.every(b=>b.kind!=='workshop'&&b.kind!=='photos')).toBe(true);
  });
});


describe('suggestion relevance and useful next questions',()=>{
  it.each([
    ['what did he learn in taiwan','taiwan-lessons'],
    ['taiwan lessons','taiwan-lessons'],
    ['public service','service'],
    ['leadership','leadership'],
    ['strongest skills','strengths'],
    ['What is Isaac best at?','strengths'],
    ['What would Isaac bring to a team?','strengths'],
    ['current job','current'],
    ['study mode feedback','study-mode'],
    ['pulse','pulse'],
    ['atlas browser','atlas'],
    ['group chats','group-chats'],
    ['100 day report','report'],
    ['100 chats book','100-chats'],
    ['openai feedback','openai'],
    ['boehringer results','rebrand-outcomes'],
    ['journalism findings','journalism-findings'],
    ['taiwan evaluation','taiwan-measurement'],
    ['ti awan','taiwan'],
    ['tawian','taiwan'],
  ])('puts a relevant question first for %s',(query,id)=>{
    expect(suggestExperiencePrompts(query)[0]?.id).toBe(id);
  });
  it('uses the current subject when the draft asks an aspect-only follow-up',()=>{
    const context={projectIds:['fulbright-focus-group-sponsored-by-openai'],kind:'story',focus:'process'};
    expect(suggestExperiencePrompts('what did he learn?',4,context)[0].id).toBe('taiwan-lessons');
    expect(suggestExperiencePrompts('',4,context).every(item=>item.topics.includes('taiwan'))).toBe(true);
    expect(suggestExperiencePrompts('Pulse',4,context)[0].id).toBe('pulse');
  });
  it('compares the visible subjects rather than injecting a default pair',()=>{
    expect(suggestExperiencePrompts('compare these',4,{projectIds:['congressional-office-setup-100-day-report','boehringer-cares-foundation-rebrand-strategy-shift']})[0].id).toBe('compare-comms');
  });
  it('does not mix other projects into a named product query',()=>{
    expect(suggestExperiencePrompts('pulse feedback').every(item=>item.topics.includes('openai'))).toBe(true);
  });
  it('bounds work and result counts for long or repeated drafts',()=>{
    expect(suggestExperiencePrompts('taiwan '.repeat(1000),999)).toHaveLength(4);
    expect(suggestExperiencePrompts('taiwan',0)).toEqual([]);
  });
});

it('introduces ChatGPT product testing before asking about an unfamiliar feature',()=>{
  const specialized=new Set(['study-mode','pulse','atlas','group-chats','100-chats','back-to-school']);
  for(const query of ['', 'AI', 'OpenAI', 'ChatGPT', 'product testing']){
    expect(suggestExperiencePrompts(query).some(item=>specialized.has(item.id))).toBe(false);
  }
  expect(suggestExperiencePrompts('Study Mode')[0].id).toBe('study-mode');
  expect(suggestExperiencePrompts('',4,{projectIds:['openai-product-testing-and-feedback'],kind:'story',section:0}).some(item=>specialized.has(item.id))).toBe(false);
});

it('makes a broad AI draft an introduction to the work instead of assuming a known study',()=>{
  const suggestions=suggestExperiencePrompts('AI');
  expect(suggestions[0].id).toBe('policy');
  expect(suggestions.map(item=>item.id)).toContain('openai');
  expect(suggestions.map(item=>item.id)).toContain('taiwan');
  expect(suggestions.every(item=>item.aspect!=='comparison')).toBe(true);
});

it.each([
  ['pul','pulse'],['pluse','pulse'],['atl','atlas'],['atls','atlas'],
  ['study mo','study-mode'],['stduy mode','study-mode'],['studymode','study-mode'],
  ['group chat','group-chats'],['groupchats','group-chats'],
  ['100chats','100-chats'],['back to school','back-to-school'],['backtoschool','back-to-school'],
])('recognizes an explicitly named feature without requiring perfect spelling: %s',(query,id)=>{
  expect(suggestExperiencePrompts(query)[0]?.id).toBe(id);
});
