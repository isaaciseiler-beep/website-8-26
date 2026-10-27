import { describe, expect, it } from 'vitest';
import cases from '../../evals/portfolio-cases.json';
import { initialPlan } from '@/lib/canvas';
import { blankBlock, composeLocal, explorationGuidance, resolveCanvasPlan, validateComposition, TAIWAN_ID, POLICY_ID } from '@/lib/genui';

describe('visitor questions and state continuity',()=>{
  it.each(cases)('answers the subject and task of $id',test=>{
    const plan=resolveCanvasPlan(test.question,initialPlan(),1);
    if(test.guidance){expect(explorationGuidance(test.question,plan)).toBe(test.guidance);return;}
    const composition=composeLocal(test.question,plan);
    expect(validateComposition(composition)).not.toBeNull();
    const block=composition.blocks[0];
    expect(block.kind).toBe(test.kind);
    if(test.project)expect(block.projectIds).toContain(test.project);
    if(test.projects)expect(block.projectIds).toEqual(test.projects);
    if(test.states)expect(block.states).toEqual(test.states);
    if(test.focus)expect(block.focus).toBe(test.focus);
    if(test.roleId)expect(block.roleId).toBe(test.roleId);
  });
  it('retains a chosen section and query on a project follow-up',()=>{
    const previous={blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID],focus:'process' as const,layout:'project-process' as const,section:1,search:'community',expanded:true}]};
    const plan=resolveCanvasPlan('tell me more',initialPlan(),2,previous);
    expect(composeLocal('tell me more',plan,previous).blocks[0]).toMatchObject({projectIds:[TAIWAN_ID],focus:'process',section:1,search:'community',expanded:true});
  });
  it('retains comparison focus and named subjects on a follow-up',()=>{
    const previous={blocks:[{...blankBlock('comparison'),projectIds:[POLICY_ID,TAIWAN_ID],focus:'outcomes' as const}]};
    expect(composeLocal('compare these',initialPlan(),previous).blocks[0]).toMatchObject({projectIds:[POLICY_ID,TAIWAN_ID],focus:'outcomes'});
  });
  it('does not seed an unrequested government from a review preset',()=>{
    expect(validateComposition({blocks:[{...blankBlock('benchmark'),layout:'benchmark-compare'}]})).toBeNull();
  });
});
