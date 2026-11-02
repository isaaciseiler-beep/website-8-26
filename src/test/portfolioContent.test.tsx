import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ProjectComparison, ProjectStory } from '@/components/canvas/PortfolioViews';
import { ProjectIndex } from '@/components/canvas/LayoutViews';
import { blankBlock, composeLocal, TAIWAN_ID, type CanvasBlock } from '@/lib/genui';
import { experiencePrompts, suggestExperiencePrompts } from '@/lib/experiencePrompts';
import { initialPlan } from '@/lib/canvas';

function Story({ initial }: { initial: CanvasBlock }) {
  const [block, setBlock] = useState(initial);
  return <ProjectStory block={block} onChange={setBlock} />;
}
function Work() {
  const [block, setBlock] = useState(blankBlock('collection'));
  return <ProjectIndex block={block} onChange={setBlock} />;
}
afterEach(cleanup);

describe('published evidence discovery', () => {
  it('shows the matching metric together with its team attribution in the evidence notebook', () => {
    render(<Story initial={{ ...blankBlock('story'), layout: 'project-evidence', focus: 'evidence', projectIds: ['congressional-office-setup-100-day-report'], search: '550' }} />);
    fireEvent.click(screen.getByText('Making the first 100 days measurable'));
    expect(screen.getByText('550')).toBeVisible();
    expect(screen.getByText(/numbers belonged to the full team/)).toBeVisible();
  });
  it('keeps comparison sources collapsed rather than repeating the outcome as evidence', () => {
    render(<ProjectComparison block={{ ...blankBlock('comparison'), focus: 'outcomes', projectIds: ['congressional-office-setup-100-day-report','boehringer-cares-foundation-rebrand-strategy-shift'] }} onChange={() => {}} />);
    expect(screen.queryByRole('heading', { name: 'Evidence' })).not.toBeInTheDocument();
    expect(screen.getAllByText('Sources')).toHaveLength(2);
    expect(screen.getAllByText(/25%/)).toHaveLength(1);
    screen.getAllByText('Sources').forEach(source => expect(source.closest('details')!.open).toBe(false));
  });
  it('makes evidence searchable from the project without a special request', () => {
    render(<Story initial={{ ...blankBlock('story'), projectIds: [TAIWAN_ID] }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Evidence' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find in this project' }), { target: { value: ' QUESTIONS    participants ' } });
    expect(screen.getByText('Delivering What We Learned to a Broader Audience')).toBeVisible();
    expect(screen.queryByText('No matching evidence in this project.')).not.toBeInTheDocument();
  });
  it('keeps original program materials available in a collapsed Sources disclosure', () => {
    render(<Story initial={{ ...blankBlock('story'), layout: 'project-process', focus: 'process', projectIds: [TAIWAN_ID] }} />);
    const sources = screen.getByText('Sources').closest('details')!;
    expect(sources.open).toBe(false);
    fireEvent.click(within(sources).getByText('Sources'));
    expect(sources.open).toBe(true);
    expect(within(sources).getByRole('link', { name: 'View the conference workshop' })).toHaveAttribute('href', expect.stringContaining('Artificial%20Intelligence%20in%20the%20Classroom.pdf'));
  });
  it('collapses Sources when the same story module changes to a new project', () => {
    const block={ ...blankBlock('story'),layout:'project-process' as const,focus:'process' as const,projectIds:[TAIWAN_ID] };
    const {rerender}=render(<ProjectStory block={block} onChange={()=>{}}/>);
    fireEvent.click(screen.getByText('Sources'));
    expect(screen.getByText('Sources').closest('details')!.open).toBe(true);
    rerender(<ProjectStory block={{...block,projectIds:['boehringer-cares-foundation-rebrand-strategy-shift']}} onChange={()=>{}}/>);
    expect(screen.getByText('Sources').closest('details')!.open).toBe(false);
  });
  it('searches the work by published methods as well as titles', () => {
    render(<Work />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Find a project' }), { target: { value: ' interviews qualitative ' } });
    const results = screen.getByRole('region', { name: 'Work explorer' });
    expect(within(results).getAllByRole('button')).toHaveLength(1);
    expect(within(results).getByRole('button')).toHaveTextContent(/journalism/i);
  });
});

describe('contextual content suggestions', () => {
  const context = { projectIds: [TAIWAN_ID], kind: 'story', focus: 'process', question: 'What did Isaac build in Taiwan?', visitedQuestions: ['What did Isaac learn in Taiwan?'] };
  it('treats a broad subject query as an opportunity for a new question', () => {
    const next = suggestExperiencePrompts('Taiwan', 4, context);
    expect(next.map(item => item.id)).not.toContain('taiwan');
    expect(next.map(item => item.id)).not.toContain('taiwan-lessons');
    expect(next.length).toBeGreaterThan(0);
  });
  it('offers contextual next steps for a short continuation', () => {
    for (const query of ['what else', 'tell me more', 'go deeper']) {
      const next = suggestExperiencePrompts(query, 4, context);
      expect(next.length).toBeGreaterThan(0);
      expect(next.every(item => item.topics.includes('taiwan'))).toBe(true);
      expect(next.map(item => item.id)).not.toContain('taiwan-lessons');
    }
  });
  it('keeps OpenAI-supported Taiwan questions focused on the educator program', () => {
    const next=suggestExperiencePrompts('OpenAI program in Taiwan');
    expect(next.length).toBeGreaterThan(0);
    expect(next.every(item=>item.topics.includes('taiwan'))).toBe(true);
    expect(next.some(item=>item.id==='openai')).toBe(false);
  });
  it('recognizes a named product even when the testing account mentions Taiwan', () => {
    const next=suggestExperiencePrompts('Pulse while moving to Taiwan');
    expect(next[0]?.id).toBe('pulse');
    expect(next.every(item=>item.topics.includes('openai'))).toBe(true);
  });
  it('connects benchmark data back to the research when its data module has no project IDs', () => {
    const next=suggestExperiencePrompts('what else',4,{projectIds:[],kind:'benchmark',focus:'overview'});
    expect(next.length).toBeGreaterThan(0);
    expect(next.every(item=>item.topics.includes('policy'))).toBe(true);
  });
  it('keeps a named product reachable after its section has been read', () => {
    expect(suggestExperiencePrompts('Pulse', 4, { projectIds: ['openai-product-testing-and-feedback'], kind: 'story', section: 4 })[0]?.id).toBe('pulse');
  });
  it('allows an explicit request to revisit an answered aspect', () => {
    expect(suggestExperiencePrompts('Taiwan lessons', 4, context)[0]?.id).toBe('taiwan-lessons');
  });
});


describe('curated entry points answer the advertised subject', () => {
  const projectForTopic: Record<string,string> = {
    taiwan: TAIWAN_ID, policy: 'artificial-intelligence-in-state-government-index', congress: 'congressional-office-setup-100-day-report',
    journalism: 'senior-thesis-local-journalism', rebrand: 'boehringer-cares-foundation-rebrand-strategy-shift', openai: 'openai-product-testing-and-feedback',
  };
  it.each(experiencePrompts)('opens the right content for $id', prompt => {
    const block = composeLocal(prompt.text, initialPlan()).blocks[0];
    const projectIds = prompt.topics.flatMap(topic => projectForTopic[topic] ? [projectForTopic[topic]] : []);
    if (projectIds.length&&block.kind!=='benchmark') expect(block.projectIds).toEqual(projectIds);
    if(prompt.id==='policy-benchmark')expect(block.kind).toBe('benchmark');
    if (prompt.topics.includes('career')) expect(block.kind).toBe('timeline');
    if (prompt.topics.includes('contact')) expect(block.kind).toBe('contact');
    if (prompt.topics.includes('work')) expect(block.kind).toBe('collection');
  });
});


describe('evaluation answers stay specific to the published work', () => {
  it.each([
    ['What were the tradeoffs in Isaac’s OpenAI product testing?', /correct answers versus learning.*personalization.*Group Chats/],
    ['What would Isaac change about Pulse?', /In Pulse testing.*clearer sources.*preference controls/],
    ['What would Isaac change about Atlas?', /In Atlas testing.*browsing and chatting.*control over the model/],
    ['What were the tradeoffs in testing Study Mode?', /correct answer.*learning.*useful conclusion/],
    ['What were the tradeoffs in Isaac’s Pulse testing?', /personalization.*trust and control.*clearer sources/],
    ['What were the limitations in Isaac’s Atlas project?', /browsing and chatting.*control over the model/],
    ['What challenges did Isaac identify in Group Chats?', /how much the assistant should participate.*people in control/],
    ['How did Isaac evaluate the Boehringer rebrand project?', /volunteering participation.*newsletter open rate.*caused by Isaac alone/],
    ['How did Isaac evaluate his congressional communications project?', /gathered and checked.*full office.*causal impact/],
    ['What leadership did Isaac demonstrate in the Boehringer rebrand?', /broader team established the original rebrand direction/],
    ['What leadership did Isaac demonstrate in OpenAI product testing?', /does not establish responsibility for leading a product team/],
    ['What were the limitations of Isaac’s journalism thesis?', /published project summary does not report which alternatives Isaac ultimately preferred/],
  ])('uses the relevant evidence for %s', (question, answer) => {
    render(<Story initial={composeLocal(question, initialPlan()).blocks[0]} />);
    expect(screen.getByText(answer,{selector:'.portfolio-deck'})).toBeVisible();
    const passage=screen.queryByText('Read supporting passage');
    if(passage)expect(passage.closest('details')!.open).toBe(false);
    expect(screen.queryByText(/available account does not document specific failures/)).not.toBeInTheDocument();
  });
  it('answers government research outcomes with the finding before background', () => {
    render(<Story initial={composeLocal('What were the outcomes of Isaac’s government AI research?', initialPlan()).blocks[0]} />);
    expect(screen.getByText(/most states scored below 50\/100/)).toBeVisible();
    expect(screen.getByText('August 2025 snapshot')).toBeVisible();
    expect(screen.queryByText(/This work, published with the Council/)).not.toBeInTheDocument();
  });
  it.each([
    ['What were the outcomes of Isaac’s Pulse testing?', /launch story featured my experience using calendar context/],
    ['What were the outcomes of Isaac’s Atlas testing?', /most convincing experiences were not grand/],
    ['What were the outcomes of Isaac’s Study Mode testing?', /OpenAI highlighted my use case in its student storytelling/],
    ['What were the outcomes of Isaac’s Group Chats testing?', /Timing, restraint, and a clear role matter/],
  ])('keeps named product outcomes on their own evidence: %s',(question,answer)=>{
    render(<Story initial={composeLocal(question,initialPlan()).blocks[0]}/>);
    expect(screen.getByText(answer)).toBeVisible();
    expect(screen.queryByText(/Together, the Lab built a collection of 100 real workflows/)).not.toBeInTheDocument();
  });
  it.each([
    ['What did Isaac learn from testing Study Mode?', /answer can be correct and still short-circuit the learning/],
    ['What did Isaac learn from the OpenAI Back to School campaign?', /strong education product and a strong student campaign solve different problems/],
  ])('shows the actual product-specific lesson for %s',(question,answer)=>{
    render(<Story initial={composeLocal(question,initialPlan()).blocks[0]}/>);
    expect(screen.getByText(answer)).toBeVisible();
  });
  it('shows Boehringer metrics once before opening the full passage', () => {
    render(<Story initial={composeLocal('What were the outcomes of Isaac’s Boehringer project?', initialPlan()).blocks[0]} />);
    expect(screen.getAllByText(/25%/)).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Continue reading' }));
    expect(screen.getByText(/During the 2025 rollout.*25%/)).toBeVisible();
  });
});
