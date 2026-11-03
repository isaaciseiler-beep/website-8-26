import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { ProjectComparison } from '@/components/canvas/PortfolioViews';
import { initialPlan, localPlan } from '@/lib/canvas';
import { composeLocal, POLICY_ID, TAIWAN_ID, reconcileComposition, resolveCanvasPlan, type Composition } from '@/lib/genui';
import { analyzePortfolioRequest } from '@/lib/portfolioRequestAnalysis';
import { suggestExperiencePrompts } from '@/lib/experiencePrompts';

afterEach(cleanup);
const compose=(question:string,previous?:Composition)=>composeLocal(question,resolveCanvasPlan(question,initialPlan(),1,previous),previous);
const comparisons=[
  {question:'Compare teaching in Taiwan with the AI research',ids:[TAIWAN_ID,POLICY_ID]},
  {question:'Contrast the AI study with teaching in Taiwan.',ids:[POLICY_ID,TAIWAN_ID]},
  {question:'Compare Isaac’s research on AI with the Taiwan program.',ids:[POLICY_ID,TAIWAN_ID]},
];

describe('comparison subjects survive natural wording and benchmark history',()=>{
  it.each(comparisons)('answers both bodies of work: $question',({question,ids})=>{
    const fresh=compose(question);
    const history=compose('Show Michigan AI score');
    const next=compose(question,history);
    expect(fresh.blocks).toHaveLength(1);
    expect(next.blocks).toHaveLength(1);
    expect(fresh.blocks[0]).toMatchObject({kind:'comparison',projectIds:ids});
    expect(next.blocks[0]).toMatchObject({kind:'comparison',projectIds:ids});
    // A provider reusing the prior scorecard cannot drop the requested subjects.
    const result=reconcileComposition(question,history,next,history)!;
    expect(result.blocks[0]).toMatchObject({kind:'comparison',projectIds:ids});
    render(<ProjectComparison block={result.blocks[0]} onChange={()=>{}}/>);
    const table=screen.getByRole('table',{name:'Published project comparison'});
    expect(within(table).getByText(/Isaac pitched and led a six-session AI literacy program for educators in Taiwan/)).toBeVisible();
    expect(within(table).getByText(/Isaac built a public-information benchmark of AI adoption across U.S. states and territories/)).toBeVisible();
  });

  it.each([
    ['Compare teaching in Taiwan with AI research in Australia',[TAIWAN_ID,'senior-thesis-local-journalism']],
    ['Compare teaching in Taiwan and OpenAI product testing',[TAIWAN_ID,'openai-product-testing-and-feedback']],
    ['Compare AI research with journalism research',[POLICY_ID,'senior-thesis-local-journalism']],
  ])('retains independently qualified research/product subjects: %s',(question,ids)=>{
    expect(compose(question as string).blocks[0]).toMatchObject({kind:'comparison',projectIds:ids});
  });

  it('keeps an unqualified standalone research request ambiguous',()=>{
    expect(analyzePortfolioRequest('Show his research').kind).toBe('ambiguous');
  });

  it('rejects a provider replay of the old scorecard for an unrelated new question',()=>{
    const history=compose('Show Michigan AI score');
    const question='What should I cook for dinner?';
    const baseline=compose(question,history);
    expect(resolveCanvasPlan(question,initialPlan(),2,history).layout).toBe('empty');
    expect(reconcileComposition(question,history,baseline,history)).toBeNull();
  });

  it.each([
    ['Show the Taiwan program','story',[TAIWAN_ID]],
    ['Tell me about Isaac’s AI policy work','story',[POLICY_ID]],
    ['What is Isaac doing now?','timeline',[]],
    ['How can I contact Isaac?','contact',[]],
  ])('does not reuse a benchmark for a new recognized request: %s',(question,kind,projectIds)=>{
    const history=compose('Show Michigan AI score');
    const baseline=compose(question as string,history);
    const result=reconcileComposition(question as string,history,baseline,history)!;
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({kind,projectIds});
    expect(result.blocks.some(block=>block.kind==='benchmark')).toBe(false);
  });
});

describe('unspecified comparisons choose a subject before composing an answer',()=>{
  it('clarifies generic experience comparisons without inventing a pair',()=>{
    for(const question of ['Compare experiences','Comparing experiences','Compare his projects']){
      const previous=compose('Show Michigan AI score');
      const analysis=analyzePortfolioRequest(question);
      expect(analysis.kind).toBe('ambiguous');
      expect(analysis.projectIds).toEqual([]);
      expect(analysis.choices.map(choice=>choice.projectId)).toContain(TAIWAN_ID);
      expect(analysis.choices.map(choice=>choice.projectId)).toContain(POLICY_ID);
      expect(resolveCanvasPlan(question,initialPlan(),1,previous).layout).toBe('empty');
      expect(localPlan(question,initialPlan(),[],1).projectIds).toEqual([]);
      expect(reconcileComposition(question,compose('Compare Taiwan teaching and AI policy'),compose(question,previous),previous)).toBeNull();
    }
  });
  it('keeps a clear current comparison and its actual subjects',()=>{
    const previous=compose('Compare Isaac’s Congress and Boehringer work');
    expect(compose('Compare experiences',previous).blocks[0]).toMatchObject({kind:'comparison',projectIds:previous.blocks[0].projectIds});
    expect(analyzePortfolioRequest('Compare experiences',{projectIds:previous.blocks[0].projectIds,task:'comparison'}).kind).toBe('recognized');
  });
  it('suggests subject-first questions until two comparison subjects are established',()=>{
    for(const question of ['compare','compare experiences','compare Taiwan']){
      const suggestions=suggestExperiencePrompts(question);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.every(item=>item.aspect!=='comparison')).toBe(true);
    }
    const explicit=suggestExperiencePrompts('compare Congress and Boehringer');
    expect(explicit[0]).toMatchObject({id:'compare-comms',topics:['congress','rebrand']});
    expect(explicit[0].text).toMatch(/communications/);
  });
});
