import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProjectStory } from '@/components/canvas/PortfolioViews';
import { initialPlan } from '@/lib/canvas';
import { composeLocal, reconcileComposition, resolveCanvasPlan, type Composition } from '@/lib/genui';

afterEach(cleanup);
const lab='openai-product-testing-and-feedback';
const compose=(question:string,previous?:Composition)=>composeLocal(question,resolveCanvasPlan(question,initialPlan(),1,previous),previous);
const questions=['Tell me about the ChatGPT Lab','Explore Isaac’s ChatGPT Lab work','What is the ChatGPT Lab?'];

describe('the Lab overview introduces the work before its retrospective',()=>{
  it.each(questions)('gives first-visit context, including after a specific product: %s',question=>{
    const previous=compose('What feedback did Isaac give about Pulse?');
    for(const result of [compose(question),compose(question,previous)]){
      expect(result.blocks[0]).toMatchObject({kind:'story',projectIds:[lab],section:0,focus:'role',layout:'project-brief'});
      const view=render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
      expect(screen.getByText(/In OpenAI’s first ChatGPT Lab cohort, Isaac tested products before release/)).toBeVisible();
      expect(screen.getByText(/Isaac’s contributions included real workflows for the 100 Chats book/)).toBeVisible();
      expect(screen.queryByRole('heading',{name:'Lessons from the Lab'})).not.toBeInTheDocument();
      view.unmount();
    }
  });
  it('prevents the provider from replacing an introduction with the retrospective',()=>{
    const question=questions[0],baseline=compose(question);
    const retrospective=compose('What did Isaac learn from the ChatGPT Lab?');
    const result=reconcileComposition(question,retrospective,baseline)!;
    render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/In OpenAI’s first ChatGPT Lab cohort, Isaac tested products before release/)).toBeVisible();
    expect(result.blocks[0]).toMatchObject({section:0,focus:'role'});
  });
  it.each([
    ['What did Isaac learn from the ChatGPT Lab?',7,'reflection'],
    ['What feedback did Isaac give about Study Mode?',2,undefined],
    ['What feedback did Isaac give about Pulse?',4,undefined],
  ])('keeps the requested lesson or product evidence: %s',(question,section,angle)=>{
    const baseline=compose(question as string);
    expect(baseline.blocks[0]).toMatchObject({kind:'story',projectIds:[lab],section,angle});
    const proposal={blocks:[{...baseline.blocks[0],section:0,paragraphIndices:undefined,answerPlan:undefined}]};
    expect(reconcileComposition(question as string,proposal,baseline)?.blocks[0]).toMatchObject({section,angle});
  });
});
