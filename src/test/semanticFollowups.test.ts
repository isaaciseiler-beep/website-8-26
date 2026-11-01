import { describe, expect, it } from 'vitest';
import { initialPlan } from '@/lib/canvas';
import { connectionIds, portfolioConnections } from '@/lib/portfolioConnections';
import { composeLocal, explorationGuidance, reconcileComposition, resolveCanvasPlan, validateComposition, POLICY_ID, TAIWAN_ID } from '@/lib/genui';

const compose=(question:string,previous?:ReturnType<typeof composeLocal>)=>composeLocal(question,resolveCanvasPlan(question,initialPlan(),1,previous),previous);
const congress='congressional-office-setup-100-day-report';
const openai='openai-product-testing-and-feedback';
const journalism='senior-thesis-local-journalism';
const rebrand='boehringer-cares-foundation-rebrand-strategy-shift';

describe('connections retain the requested bodies of work',()=>{
  const groups=[
    {id:'systems',subjects:['the policy benchmark','teaching in Taiwan','congressional communications'],projects:[POLICY_ID,TAIWAN_ID,congress]},
    {id:'listening',subjects:['journalism research','the Taiwan program','OpenAI product testing'],projects:[journalism,TAIWAN_ID,openai]},
    {id:'delivery',subjects:['the Taiwan program','congressional communications','the Boehringer rebrand'],projects:[TAIWAN_ID,congress,rebrand]},
  ] as const;
  for(const group of groups)for(const order of [[0,1,2],[2,0,1],[1,2,0]]){
    const question=`What connects ${order.map(index=>group.subjects[index]).join(', ')}?`;
    it(`retains all three subjects: ${question}`,()=>{
      const result=compose(question);
      const block=result.blocks[0];
      expect(validateComposition(result)).not.toBeNull();
      expect(block).toMatchObject({kind:'timeline',answerId:'connections',connectionId:group.id});
      expect(new Set(portfolioConnections[block.connectionId!].projectIds)).toEqual(new Set(group.projects));
      for(const proposedId of connectionIds){
        const reconciled=reconcileComposition(question,{blocks:[{...block,connectionId:proposedId}]},result);
        expect(reconciled?.blocks[0].connectionId).toBe(group.id);
      }
    });
  }
  it.each([
    ['How does Isaac turn complexity into something useful?','systems'],
    ['How do listening and research connect his different roles?','listening'],
  ])('recognizes a natural connection question: %s',(question,id)=>{
    expect(compose(question).blocks[0]).toMatchObject({answerId:'connections',connectionId:id});
  });
});

describe('findings and follow-ups use the published answer',()=>{
  it.each([
    'What were the actual findings of the government AI study?',
    'What did Isaac discover through the government AI research?',
    'Explain the findings from Isaac’s AI policy study.',
  ])('opens research outcomes rather than a ranking: %s',question=>{
    expect(compose(question).blocks[0]).toMatchObject({kind:'story',projectIds:[POLICY_ID],focus:'outcomes'});
  });
  const previous=compose('How did Isaac design the Taiwan program?');
  it.each([
    ['What did he actually learn?','outcomes','reflection'],
    ['What did they really learn?!','outcomes','reflection'],
    ['How did he make that happen?','process',undefined],
    ['What changed as a result?','outcomes',undefined],
    ['What is the evidence for that?','evidence',undefined],
    ['What would he do differently?','process','counterfactual'],
    ['Did it work?','outcomes','measurement'],
    ['Did the program actually work?','outcomes','measurement'],
  ])('retains the Taiwan subject for %s',(question,focus,angle)=>{
    const result=compose(question,previous);
    expect(validateComposition(result)).not.toBeNull();
    expect(result.blocks[0]).toMatchObject({kind:'story',projectIds:[TAIWAN_ID],focus,angle});
    expect(explorationGuidance(question,resolveCanvasPlan(question,initialPlan(),2,previous))).toBeNull();
  });
  it.each(['What did he actually learn?','How did he make that happen?','Did it work?'])('does not invent prior context for %s',question=>{
    expect(resolveCanvasPlan(question,initialPlan(),1).layout).toBe('empty');
  });
  it.each(['What is the weather in Seattle?','How do I make dinner?','What is a good laptop?'])('does not inherit Taiwan for an unrelated request: %s',question=>{
    expect(resolveCanvasPlan(question,initialPlan(),2,previous).layout).toBe('empty');
  });
  const comparison=compose('Compare AI policy and Taiwan teaching');
  it.each([
    ['How do they compare on outcomes?','outcomes'],
    ['How were their methods different?','process'],
    ['How do the two compare in terms of contributions?','role'],
  ])('keeps both displayed projects for %s',(question,focus)=>{
    expect(compose(question,comparison).blocks[0]).toMatchObject({kind:'comparison',projectIds:[POLICY_ID,TAIWAN_ID],focus});
  });
});
