import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CareerExplorer, ProjectStory } from '@/components/canvas/PortfolioViews';
import { composeLocal, presetComposition, validateComposition } from '@/lib/genui';
import { initialPlan } from '@/lib/canvas';
import { suggestExperiencePrompts } from '@/lib/experiencePrompts';
const compose=(question:string)=>composeLocal(question,initialPlan());
afterEach(cleanup);
describe('visitor answer quality regressions',()=>{
  it.each(['What is Isaac best at?','Why should I hire Isaac?','What would Isaac bring to a team?'])('answers %s with a supported synthesis',question=>{
    const block=compose(question).blocks[0];
    render(<CareerExplorer block={block} onChange={()=>{}}/>);
    expect(screen.getByRole('heading',{name:'Strengths across the work'})).toBeVisible();
    expect(screen.getByText(/clearest strengths.*research synthesis.*explaining complex ideas/)).toBeVisible();
    expect(screen.getByRole('button',{name:'Professional role'})).toHaveAccessibleDescription('Research & policy');
  });
  it('connects multiple bodies of work before offering examples',()=>{
    render(<CareerExplorer block={compose('What connects all this work?').blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/make a complicated system understandable enough/)).toBeVisible();
    for(const title of ['AI in state government','AI literacy in Taiwan','Building a congressional office']) expect(screen.getByRole('heading',{name:title})).toBeVisible();
  });
  it('opens the Outcomes preset on outcomes rather than the proposal',()=>{
    render(<ProjectStory block={presetComposition('project-outcomes').blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByRole('button',{name:'Outcomes'})).toHaveAttribute('aria-pressed','true');
    expect(screen.queryByText('From the Idea to the Lab')).not.toBeInTheDocument();
    expect(screen.getByText(/turned them into nine practical ChatGPT use cases/)).toBeVisible();
  });
  it('states the evidence gap for an undocumented retrospective',()=>{
    render(<ProjectStory block={compose('What would Isaac do differently in Taiwan?').blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/does not specify what Isaac would do differently/)).toBeVisible();
  });
  it('gives an explicit timeline request actual dated roles',()=>{
    render(<CareerExplorer block={compose('Show Isaac’s career timeline').blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByRole('region',{name:'Career timeline'})).toBeVisible();
    expect(screen.getByText('2026-Present')).toBeVisible();
    expect(screen.queryByRole('navigation',{name:'Professional roles'})).not.toBeInTheDocument();
  });
  it('keeps career semantics out of project schemas',()=>{
    const result=presetComposition('project-brief');result.blocks[0].answerId='strengths';
    expect(validateComposition(result)).toBeNull();
  });
  it('offers a new government question after methodology',()=>{
    const next=suggestExperiencePrompts('',4,{kind:'story',projectIds:['artificial-intelligence-in-state-government-index'],focus:'process'});
    expect(next.length).toBeGreaterThan(0);
    expect(next.some(item=>item.id==='policy')).toBe(false);
    expect(next.some(item=>item.id==='policy-role'||item.id==='policy-outcomes')).toBe(true);
  });
  it('does not repeat completed lessons or equivalent strengths questions',()=>{
    expect(suggestExperiencePrompts('',4,{kind:'story',projectIds:['fulbright-focus-group-sponsored-by-openai'],section:4,focus:'outcomes'}).some(item=>item.id==='taiwan-lessons')).toBe(false);
    expect(suggestExperiencePrompts('',4,{kind:'timeline',projectIds:[],answerId:'strengths',question:'What is Isaac best at?'}).some(item=>item.id==='strengths')).toBe(false);
  });
});
