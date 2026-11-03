import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProjectStory } from '@/components/canvas/PortfolioViews';
import { initialPlan } from '@/lib/canvas';
import { blankBlock, composeLocal, POLICY_ID, reconcileComposition, resolveCanvasPlan, type Composition } from '@/lib/genui';

afterEach(cleanup);
const compose=(question:string,previous?:Composition)=>composeLocal(question,resolveCanvasPlan(question,initialPlan(),1,previous),previous);
const broadQuestions=[
  'AI in government',
  'Explore AI policy',
  'Tell me about the government index',
  'Tell me about Isaac’s AI policy work',
  'What did he discover about AI adoption?',
  'Explain the AI adoption project',
];
function expectContextualAnswer(result:Composition){
  expect(result.blocks).toHaveLength(1);
  expect(result.blocks[0]).toMatchObject({kind:'story',projectIds:[POLICY_ID],section:0,states:[]});
  render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
  // The first visible answer identifies the work and Isaac's responsibility,
  // then its deliverables and historical scope. No disclosure is needed.
  if(result.blocks[0].focus==='outcomes'){
    expect(screen.getByText(/I built a public-information benchmark that scores all states and territories/)).toBeVisible();
    expect(screen.getByText(/most states scored below 50\/100/)).toBeVisible();
    expect(screen.getByText('August 2025 snapshot')).toBeVisible();
  }else{
    expect(screen.getByText(/Isaac built a public-information benchmark of AI adoption across U.S. states and territories/)).toBeVisible();
    expect(screen.getByText(/15-criteria framework, state-by-state rankings, and recommendations/)).toBeVisible();
    expect(screen.getByText(/published benchmark is an August 2025 snapshot/)).toBeVisible();
  }
  expect(screen.queryByText('17.8')).not.toBeInTheDocument();
}

describe('government project context before dataset detail',()=>{
  it.each(broadQuestions)('introduces the actual project: %s',question=>expectContextualAnswer(compose(question)));
  it.each(broadQuestions)('starts a new project overview after a Michigan scorecard: %s',question=>{
    expectContextualAnswer(compose(question,compose('Show Michigan AI score')));
  });
  it.each(['benchmark','raw-finding'] as const)('rejects a valid but contextless provider %s for a broad project question',kind=>{
    const question='Tell me about Isaac’s AI policy work';
    const baseline=compose(question,compose('Michigan'));
    const proposal=kind==='benchmark'?compose('Michigan'):{blocks:[{...blankBlock('story'),projectIds:[POLICY_ID],section:0,focus:'outcomes' as const,layout:'project-outcomes' as const,paragraphIndices:[2]}]};
    const result=reconcileComposition(question,proposal,baseline,compose('Michigan'));
    expect(result).not.toBeNull();
    expectContextualAnswer(result!);
  });
  it.each([
    ['Show Michigan AI score','benchmark-scorecard',['Michigan']],
    ['Compare Michigan and California','benchmark-compare',['Michigan','California']],
    ['Show AI rankings','benchmark-ranking',[]],
    ['Show the AI score distribution','benchmark-distribution',[]],
  ])('retains explicit dataset requests: %s',(question,layout,states)=>{
    expect(compose(question as string).blocks[0]).toMatchObject({kind:'benchmark',layout,states});
  });
  it('keeps intentional metric and region controls in the existing comparison',()=>{
    const previous=compose('Compare Michigan and California');
    const metric=compose('use preparedness',previous);
    expect(metric.blocks[0]).toMatchObject({kind:'benchmark',states:['Michigan','California'],metric:'preparednessScore'});
    expect(compose('only Midwest',metric).blocks[0]).toMatchObject({kind:'benchmark',states:['Michigan'],region:'Midwest',metric:'preparednessScore'});
  });
  it('retains a specific published finding rather than flattening every policy question',()=>{
    const result=compose('Why did Isaac describe state government adoption of generative AI as early and uneven?');
    render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/most states scored below 50\/100/i)).toBeVisible();
  });
});
