import { describe, expect, it } from 'vitest';
import { blankBlock, composeLocal, resolveCanvasPlan, validateComposition, POLICY_ID, TAIWAN_ID } from '@/lib/genui';
import { AI_LAYOUTS } from '@/lib/layouts';
import { initialPlan } from '@/lib/canvas';
const compose=(text:string)=>composeLocal(text,resolveCanvasPlan(text,initialPlan(),1));
describe('interactive composition contracts',()=>{
  it.each([
    ['How are state governments using AI?', 'benchmark-ranking'],
    ['Explore your AI literacy project in Taiwan', 'project-brief'],
    ['Explore your career', 'experience-timeline'],
  ])('introduces published content through %s', (prompt, layout)=>{
    const result=compose(prompt);
    expect(validateComposition(result)).not.toBeNull();
    expect(result.blocks[0].layout).toBe(layout);
  });
  it.each(AI_LAYOUTS)('routes the $id example into its intended interface',({id,prompt})=>{
    const composition=compose(prompt);
    expect(validateComposition(composition)).not.toBeNull();
    expect(composition.blocks).toHaveLength(1);
    expect(composition.blocks[0].layout).toBe(id);
  });
  it.each(['Taiwan teaching','Help me plan a Taiwan teaching lesson','Build a teaching feedback workflow','What did you do in Taiwan?'])('explains Isaac’s work instead of offering a classroom utility: %s',prompt=>{
    const result=compose(prompt);
    expect(result.blocks[0]).toMatchObject({kind:'story',projectIds:[TAIWAN_ID]});
    expect(validateComposition(result)).not.toBeNull();
  });
  it('rejects teaching utilities from provider output',()=>{
    expect(validateComposition({blocks:[{...blankBlock('workshop'),projectIds:[TAIWAN_ID]}]})).toBeNull();
  });
  it('honors named comparison subjects rather than unrelated high-scoring articles',()=>{
    expect(compose('Compare AI policy and Taiwan teaching').blocks[0]).toMatchObject({kind:'comparison',projectIds:[POLICY_ID,TAIWAN_ID]});
  });
  it.each(['What were the results?','What was the impact?','What did he learn?','Show me the outcomes'])('keeps a natural follow-up grounded in the current project: %s',prompt=>{
    const previous=compose('What did Isaac build in Taiwan?');
    const plan=resolveCanvasPlan(prompt,initialPlan(),2,previous);
    expect(plan.layout).toBe('detail');
    expect(composeLocal(prompt,plan,previous).blocks[0]).toMatchObject({kind:'story',projectIds:[TAIWAN_ID],focus:'outcomes'});
  });
  it('compares outcomes without losing either subject, but can still open the second project',()=>{
    const previous=compose('Compare AI policy and Taiwan teaching');
    expect(composeLocal('What were the results?',initialPlan(),previous).blocks[0]).toMatchObject({kind:'comparison',projectIds:[POLICY_ID,TAIWAN_ID],focus:'outcomes'});
    expect(composeLocal('Tell me more about the second',initialPlan(),previous).blocks[0]).toMatchObject({kind:'story',projectIds:[TAIWAN_ID]});
    expect(resolveCanvasPlan('What were the election results?',initialPlan(),2,previous).layout).toBe('empty');
  });
  it('opens a state comparison in requested order and retains it for a measure refinement',()=>{
    const previous=compose('Compare Michigan and California');
    expect(previous.blocks[0]).toMatchObject({kind:'benchmark',states:['Michigan','California']});
    expect(composeLocal('use preparedness',initialPlan(),previous).blocks[0]).toMatchObject({states:['Michigan','California'],metric:'preparednessScore'});
  });
  it('preserves the current government selections when narrowing a region',()=>{
    const previous=compose('Compare Michigan and California');
    expect(composeLocal('only Midwest',initialPlan(),previous).blocks[0]).toMatchObject({kind:'benchmark',region:'Midwest',states:['Michigan']});
  });
  it.each(['Tell me about yourself','Why should I hire Isaac?','What is Isaac working on now?'])('offers factual experience for a first-time visitor: %s',prompt=>{
    expect(compose(prompt).blocks[0]).toMatchObject({kind:'timeline',roleId:'summation-ai'});
  });
  it('returns from a state comparison to the requested overview without resetting the measure',()=>{
    const previous={blocks:[{...compose('Compare Michigan and California').blocks[0],metric:'preparednessScore' as const,region:'Midwest' as const}]};
    for(const prompt of ['Show all governments','Show all states','Show the rankings']) {
      const plan=resolveCanvasPlan(prompt,initialPlan(),2,previous);
      expect(plan.layout).toBe('work');
      expect(composeLocal(prompt,plan,previous).blocks[0]).toMatchObject({kind:'benchmark',layout:'benchmark-ranking',states:[],metric:'preparednessScore'});
    }
    expect(composeLocal('Show all governments',initialPlan(),previous).blocks[0].region).toBe('All');
  });
  it('excludes photo modules even from mixed requests and provider output',()=>{
    expect(validateComposition({blocks:[{...blankBlock('photos'),albumIds:['Japan']}]})).toBeNull();
    expect(validateComposition({blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID],albumIds:['Taiwan']}]})).toBeNull();
    for(const prompt of ['Japan photos','Taiwan photos and teaching','Explore Taiwan']) {
      const result=compose(prompt);
      expect(result.blocks.every(b=>b.kind!=='photos'&&b.albumIds.length===0)).toBe(true);
    }
    expect(AI_LAYOUTS.every(layout=>layout.kind!=='photos'&&layout.kind!=='workshop')).toBe(true);
  });
  it('rejects invented content, broken comparisons and invalid section references',()=>{
    expect(validateComposition({blocks:[{...blankBlock('story'),projectIds:['invented']}]})).toBeNull();
    expect(validateComposition({blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID],section:199}]})).toBeNull();
    expect(validateComposition({blocks:[{...blankBlock('comparison'),projectIds:[TAIWAN_ID]}]})).toBeNull();
    expect(validateComposition({blocks:[{...blankBlock('benchmark'),states:['Atlantis']}]})).toBeNull();
  });
});
