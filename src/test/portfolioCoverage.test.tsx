import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { CareerExplorer, ProjectStory } from '@/components/canvas/PortfolioViews';
import { composeLocal, resolveCanvasPlan, validateComposition, reconcileComposition, blankBlock } from '@/lib/genui';
import { initialPlan, publicProjects } from '@/lib/canvas';
import { evidenceSections } from '@/lib/portfolioEvidence';
import { findPublishedProject } from '@/lib/portfolioRetrieval';
import { hiddenProjectIds } from '@/lib/siteContent';
import { applyPortfolioAction, createPortableView, encodeView, decodeView } from '@/lib/portfolioView';
import { portfolioSectionQuestions } from './fixtures/portfolioSectionQuestions';

afterEach(cleanup);
const compose = (question: string) => composeLocal(question, resolveCanvasPlan(question, initialPlan(), 1));

describe('published work beyond the default projects', () => {
  it.each([
    ['How did Isaac approach employee volunteering communications?', 'boehringer-cares-foundation-rebrand-strategy-shift', 2],
    ['How did Isaac build the Boehringer newsletter?', 'boehringer-cares-foundation-rebrand-strategy-shift', 2],
    ['How did Isaac coordinate UX and brand colleagues?', 'boehringer-cares-foundation-rebrand-strategy-shift', 1],
    ['How did Isaac build a press network?', 'congressional-office-setup-100-day-report', 1],
    ['How did Isaac reach different audiences in Congress?', 'congressional-office-setup-100-day-report', 3],
    ['How did Isaac connect child labor reporting to federal policy?', 'congressional-office-setup-100-day-report', 2],
    ['What did the journalism project say about bargaining codes?', 'senior-thesis-local-journalism', 1],
    ['Show the Taiwan program materials', 'fulbright-focus-group-sponsored-by-openai', 5],
    ['Read the final journalism thesis', 'senior-thesis-local-journalism', 2],
    ['How did Isaac work on Back to School?', 'openai-product-testing-and-feedback', 3],
  ])('selects the actual published passage: %s', (question, id, section) => {
    const composition = compose(question);
    expect(validateComposition(composition)).not.toBeNull();
    expect(composition.blocks[0]).toMatchObject({ kind: 'story', projectIds: [id], section });
    render(<ProjectStory block={composition.blocks[0]} onChange={() => {}} />);
    const expected = publicProjects.find(project => project.id === id)!.sections[section];
    if (composition.blocks[0].focus === 'evidence') {
      expect(screen.getByText(expected.heading).closest('details')!.open).toBe(true);
    } else {
      const label = id === 'senior-thesis-local-journalism' && section === 1 ? 'Research themes & outputs' : expected.heading;
      expect(screen.getByRole('heading', { level: 3, name: label })).toBeVisible();
    }
    expect(reconcileComposition(question, composition, composition)?.blocks[0].section).toBe(section);
  });

  it.each(publicProjects)('makes every published section reachable in $title', project => {
    const sections = evidenceSections(project.id, 'evidence');
    expect(sections.map(section => section.index)).toEqual(project.sections.map((_, index) => index));
    render(<ProjectStory block={{ ...blankBlock('story'), focus: 'evidence', layout: 'project-evidence', projectIds: [project.id] }} onChange={() => {}} />);
    const explorer = screen.getByRole('region', { name: 'Project explorer' });
    for (const section of project.sections) {
      expect(within(explorer).getByText(section.heading, { selector: 'summary' })).toBeInTheDocument();
      for (const link of section.links ?? []) expect(within(explorer).getByRole('link', { name: link.label, hidden: true })).toHaveAttribute('href', link.href);
    }
  });

  it('does not pull hidden projects into the evidence fallback', () => {
    expect(findPublishedProject('How did Isaac award Casa de Salud a philanthropy grant?')).toBeUndefined();
    for (const id of hiddenProjectIds) expect(evidenceSections(id, 'evidence')).toEqual([]);
  });

  it.each(['What were the election results?', 'Write an employee newsletter about elephants', 'Tell me about travel in Australia', 'How do I make dinner?'])('does not turn incidental words into a project: %s', question => {
    expect(findPublishedProject(question)).toBeUndefined();
  });

  it('answers from a later paragraph without requiring Continue reading', () => {
    const composition=compose('How did Isaac handle journalists working on deadline in Congress?');
    expect(composition.blocks[0]).toMatchObject({section:1,paragraphIndices:[3]});
    render(<ProjectStory block={composition.blocks[0]} onChange={()=>{}}/>);
    expect(screen.getByText(/dependable contact for journalists working on deadline/)).toBeVisible();
    expect(screen.queryByText(/new office began without a network/)).not.toBeInTheDocument();
  });

  it('renders a model-selected contribution passage, rather than replacing it with the general project summary', () => {
    const block={...blankBlock('story'),projectIds:['congressional-office-setup-100-day-report'],focus:'role' as const,section:2,paragraphIndices:[2]};
    render(<ProjectStory block={block} onChange={()=>{}}/>);
    expect(screen.getByText(/His outreach secured coverage from The New York Times/)).toBeVisible();
    expect(screen.queryByText(/Isaac helped build the communications function/)).not.toBeInTheDocument();
  });

  it('preserves paragraph references through sharing and clears them when changing sections', () => {
    const view=createPortableView({blocks:[{...blankBlock('story'),projectIds:['congressional-office-setup-100-day-report'],section:1,paragraphIndices:[3]}]});
    expect(decodeView(encodeView(view))).toEqual(view);
    const changed=applyPortfolioAction(view,{type:'update_module',index:0,changes:{section:5}});
    expect(changed.composition.blocks[0].paragraphIndices).toBeUndefined();
    expect(validateComposition({blocks:[{...view.composition.blocks[0],paragraphIndices:[99]}]})).toBeNull();
    expect(validateComposition({blocks:[{...view.composition.blocks[0],paragraphIndices:[1,1]}]})).toBeNull();
    expect(validateComposition({blocks:[{...blankBlock('contact'),paragraphIndices:[0]}]})).toBeNull();
  });

  it.each(['Show sources','Show the materials','What were his findings?','What are the sources?'])('keeps the active project for the follow-up %s', question => {
    const previous=compose('How did Isaac lead the Taiwan program?');
    const next=composeLocal(question,resolveCanvasPlan(question,initialPlan(),2,previous),previous);
    expect(next.blocks[0]).toMatchObject({kind:'story',projectIds:['fulbright-focus-group-sponsored-by-openai']});
    expect(validateComposition(next)).not.toBeNull();
    if(/sources|materials/i.test(question)){
      expect(next.blocks[0]).toMatchObject({focus:'evidence',section:5,expanded:true});
      render(<ProjectStory block={next.blocks[0]} onChange={()=>{}}/>);
      expect(screen.getByRole('link',{name:'View the conference workshop'})).toBeVisible();
    }else expect(next.blocks[0].focus).toBe('outcomes');
  });

  it('keeps product sources attached to the displayed product on a follow-up', () => {
    const previous=compose('What did Isaac contribute to Atlas?');
    const next=composeLocal('Show sources',initialPlan(),previous);
    expect(next.blocks[0]).toMatchObject({kind:'story',projectIds:['openai-product-testing-and-feedback'],section:5,focus:'evidence',expanded:true});
  });

  it('includes rebrand and journalism responsibilities in the general role explorer', () => {
    render(<CareerExplorer block={blankBlock('timeline')} onChange={()=>{}}/>);
    expect(screen.getByRole('button',{name:'Brand & strategy'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Journalism research'})).toBeVisible();
  });

  it.each(portfolioSectionQuestions)('renders the selected source rather than a generic contribution: $projectId / $section', ({projectId,section,paragraphIndices}) => {
    const source=publicProjects.find(project=>project.id===projectId)!.sections[section];
    render(<ProjectStory block={{...blankBlock('story'),projectIds:[projectId],section,paragraphIndices,focus:'role'}} onChange={()=>{}}/>);
    if(paragraphIndices?.length){
      for(const index of paragraphIndices)expect(screen.getByText(source.paragraphs![index])).toBeVisible();
    }else if(source.bullets?.length){
      expect(screen.getByText(source.bullets[0])).toBeVisible();
    }else if(source.links?.length){
      fireEvent.click(screen.getByText('Sources', {selector:'summary'}));
      for(const link of source.links)expect(screen.getByRole('link',{name:link.label})).toBeVisible();
    }
  });
});
