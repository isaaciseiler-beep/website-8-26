import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProjectStory, CareerExplorer } from '@/components/canvas/PortfolioViews';
import { initialPlan } from '@/lib/canvas';
import { composeLocal, resolveCanvasPlan, validateComposition, reconcileComposition, type Composition } from '@/lib/genui';
import { resolveAnswerPlan } from '@/lib/portfolioEvidenceRegistry';
import { visitorAnswers, visitorFollowups, visitorQualifications } from './fixtures/visitorJourneys';

afterEach(cleanup);
const compose = (question: string, previous?: Composition) => composeLocal(question, resolveCanvasPlan(question, initialPlan(), 1, previous), previous);

describe('answers visible on the main interface', () => {
  it.each([
    'Show the connections between teaching in Taiwan, AI policy research, and congressional communications',
    'What connects Isaac’s Taiwan teaching, AI policy research, and congressional communications?',
  ])('shows the reviewed relationship instead of three disconnected stories: %s',question=>{
    const previous=compose('Show the Taiwan program');
    const result=compose(question,previous);
    expect(result.blocks).toHaveLength(1);
    expect(result.blocks[0]).toMatchObject({kind:'timeline',answerId:'connections',connectionId:'systems'});
    render(<CareerExplorer block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByRole('region',{name:'Connections across the work'})).toBeVisible();
    expect(screen.getByText(/same problem appears at different scales/)).toBeVisible();
    expect(screen.getByText(/Isaac built a public-information benchmark of AI adoption across U.S. states and territories/)).toBeVisible();
    expect(screen.getByText(/Isaac pitched and led a six-session AI literacy program/)).toBeVisible();
    expect(screen.getByText(/Isaac helped build the communications function for a new congressional office/)).toBeVisible();
    expect(screen.queryByRole('region',{name:'Project explorer'})).not.toBeInTheDocument();
  });
  it.each(visitorAnswers)('answers the actual question immediately: $question', ({ question, project, section, text }) => {
    const result = compose(question);
    expect(validateComposition(result)).not.toBeNull();
    expect(result.blocks[0]).toMatchObject({ kind: 'story', projectIds: [project] });
    expect(new Set([result.blocks[0].section,...resolveAnswerPlan(result.blocks[0]).flatMap(facet=>facet.evidence.map(record=>record.sectionIndex))])).toContain(section);
    render(<ProjectStory block={result.blocks[0]} onChange={() => {}} />);
    // No opening Sources, Continue reading, or changing lenses to uncover the answer.
    expect(screen.getByText(text)).toBeVisible();
  });

  it.each(visitorQualifications)('states the evidence limits first: $question', ({ question, text }) => {
    const result = compose(question);
    expect(result.blocks[0].kind).toBe('story');
    render(<ProjectStory block={result.blocks[0]} onChange={() => {}} />);
    expect(screen.getByText(text)).toBeVisible();
  });

  it.each(visitorFollowups)('keeps the requested answer and evidence: $followup', ({ initial, followup, project, section, text, link }) => {
    const previous = compose(initial);
    const result = compose(followup, previous);
    expect(result.blocks[0]).toMatchObject({ kind: 'story', projectIds: [project] });
    expect(new Set([result.blocks[0].section,...resolveAnswerPlan(result.blocks[0]).flatMap(facet=>facet.evidence.map(record=>record.sectionIndex))])).toContain(section);
    render(<ProjectStory block={result.blocks[0]} onChange={() => {}} />);
    if (text) expect(screen.getByText(text)).toBeVisible();
    if (link) expect(screen.getByRole('link', { name: link })).toBeVisible();
  });

  it('keeps the displayed product when a provider tries to swap the sources', () => {
    const previous = compose('What feedback did Isaac give about Pulse?');
    const baseline = compose('Show its sources.', previous);
    const proposed = { blocks: [{ ...baseline.blocks[0], section: 1, focus: 'process' as const, layout: 'project-process' as const }] };
    const result = reconcileComposition('Show its sources.', proposed, baseline, previous)!;
    expect(result.blocks[0]).toMatchObject({ section: 4, focus: 'evidence', layout: 'project-evidence', expanded: true });
  });

  it.each(['What did he eat for breakfast?', 'What were the election results?', 'How much is his apartment?', 'Where is the nearest cinema?', 'What did he learn about black holes?'])('does not retain unrelated context: %s', question => {
    const previous = compose('Show the Taiwan program');
    expect(resolveCanvasPlan(question, initialPlan(), 1, previous).layout).toBe('empty');
  });

  it('shows both requested work areas in a mixed question', () => {
    const result = compose('Explain Taiwan teaching alongside how Isaac built the Boehringer newsletter');
    expect(result.blocks).toHaveLength(2);
    expect(result.blocks.map(block => block.projectIds[0])).toEqual(['fulbright-focus-group-sponsored-by-openai', 'boehringer-cares-foundation-rebrand-strategy-shift']);
    for (const block of result.blocks) render(<ProjectStory block={block} onChange={() => {}} />);
    expect(screen.getByText(/updated internal messaging around volunteering/)).toBeVisible();
  });

  it('opens the actual current-role answer', () => {
    const result = compose('What is he doing now?');
    expect(result.blocks[0]).toMatchObject({ kind: 'timeline', answerId: 'current', roleId: 'summation-ai' });
    render(<CareerExplorer block={result.blocks[0]} onChange={() => {}} />);
    expect(screen.getByRole('heading', { name: /Summation/i })).toBeVisible();
  });
});


describe('independent first-visit holdouts', () => {
  it.each(['Give me a quick introduction', 'What has Isaac done with AI?'])('gives a grounded introduction: %s', question => {
    const result = compose(question);
    expect(result.blocks[0]).toMatchObject({kind:'timeline',answerId:'identity'});
    render(<CareerExplorer block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/government AI benchmark, an educator program in Taiwan/)).toBeVisible();
    expect(screen.getByText(/product feedback through the ChatGPT Lab/)).toBeVisible();
  });

  it('understands a current-role question without exact current/now wording', () => {
    const result=compose('What is he doing these days?');
    expect(result.blocks[0]).toMatchObject({kind:'timeline',answerId:'current',roleId:'summation-ai'});
    render(<CareerExplorer block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/Isaac leads marketing and communications at Summation/)).toBeVisible();
  });

  it('compares fields through their documented methods', () => {
    const result=compose('Can you compare his research and communications experience?');
    expect(result.blocks[0]).toMatchObject({kind:'timeline',answerId:'connections',connectionId:'systems'});
    render(<CareerExplorer block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/methods differ: compare public signals/)).toBeVisible();
    expect(screen.getByRole('button',{name:/AI in state government/})).toBeVisible();
    expect(screen.getByRole('button',{name:/Building a congressional office/})).toBeVisible();
  });

  it('distinguishes published interview themes from unavailable conclusions', () => {
    const result=compose('What did his interviews reveal about local news?');
    render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/labor precarity, newsroom contraction and platform dependence/)).toBeVisible();
    expect(screen.getByText(/does not provide the thesis’s detailed conclusions/)).toBeVisible();
  });

  it('shows the tested product family when the visitor asks which products', () => {
    const previous=compose('Show the ChatGPT Lab');
    const result=compose('Which of those products did he help with?',previous);
    render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
    const products=screen.getByRole('combobox',{name:'Lab work to explore'});
    for(const label of ['Study Mode','Pulse','Atlas','Group Chats','Back to School']) {
      expect(screen.getByRole('option',{name:label})).toBeInTheDocument();
    }
    expect(products).toBeVisible();
  });

  it('qualifies a natural question about whether the education sessions worked', () => {
    const result=compose('What did the local education sessions actually change, and how do we know?');
    render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/does not report pre\/post assessment scores or a measured causal improvement/)).toBeVisible();
  });
});


describe('material access is different from an intellectual result', () => {
  it('opens the actual thesis artifact for a request to see it', () => {
    const result=compose('Can I see the thesis?');
    expect(result.blocks[0]).toMatchObject({kind:'story',focus:'evidence',section:2,expanded:true});
    const proposed={blocks:[{...result.blocks[0],section:0,expanded:false,focus:'process' as const,layout:'project-process' as const}]};
    const reconciled=reconcileComposition('Can I see the thesis?',proposed,result)!;
    expect(reconciled.blocks[0]).toMatchObject({focus:'evidence',section:2,expanded:true});
    render(<ProjectStory block={reconciled.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByRole('link',{name:/thesis/i})).toBeVisible();
  });
  it('keeps findings requests on the published themes and their limits', () => {
    const result=compose('Show the thesis findings');
    expect(result.blocks[0]).toMatchObject({kind:'story',focus:'outcomes',section:1});
    render(<ProjectStory block={result.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/does not provide the thesis’s detailed conclusions/)).toBeVisible();
  });
});
