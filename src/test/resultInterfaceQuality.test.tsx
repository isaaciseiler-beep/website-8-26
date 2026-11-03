import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CareerExplorer, ProjectComparison, ProjectStory } from '@/components/canvas/PortfolioViews';
import BenchmarkExplorer from '@/components/canvas/BenchmarkExplorer';
import { blankBlock, type CanvasBlock } from '@/lib/genui';
import { publicProjects, experienceEntries } from '@/lib/canvas';
import { evidenceFor } from '@/lib/portfolioEvidence';

const congress='congressional-office-setup-100-day-report';
const boehringer='boehringer-cares-foundation-rebrand-strategy-shift';
function Journey({initial}:{initial:CanvasBlock}){
  const [block,setBlock]=useState(initial);
  return block.kind==='comparison'?<ProjectComparison block={block} onChange={setBlock}/>:block.kind==='benchmark'?<BenchmarkExplorer block={block} onChange={setBlock}/>:block.kind==='timeline'?<CareerExplorer block={block} onChange={setBlock}/>:<ProjectStory block={block} onChange={setBlock}/>;
}
afterEach(cleanup);
describe('results serve as a complete site interface',()=>{
  it('reveals matching published passages as soon as the evidence search is entered and makes recovery possible',()=>{
    render(<Journey initial={{...blankBlock('story'),projectIds:[congress],focus:'evidence',layout:'project-evidence'}}/>);
    const search=screen.getByRole('searchbox',{name:'Find in this project'});
    fireEvent.change(search,{target:{value:'550'}});
    expect(screen.getByText(/numbers belonged to the full team/)).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('1 section found');
    fireEvent.change(search,{target:{value:'not-published-anywhere'}});
    expect(screen.getByText('No matching evidence in this project.')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Clear search'}));
    expect(search).toHaveValue('');
    expect(screen.queryByText('No matching evidence in this project.')).not.toBeInTheDocument();
  });
  it('answers a comparison source request with the actual sources from both projects',()=>{
    render(<Journey initial={{...blankBlock('comparison'),focus:'evidence',projectIds:[congress,boehringer]}}/>);
    expect(screen.getByRole('heading',{name:'The published sources'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Evidence'})).toHaveAttribute('aria-pressed','true');
    for(const id of [congress,boehringer]){
      const links=publicProjects.find(project=>project.id===id)!.sections.flatMap(section=>section.links??[]);
      for(const link of links)expect(screen.getAllByRole('link',{name:link.label}).some(element=>element.getAttribute('href')===link.href)).toBe(true);
    }
    expect(screen.queryByText(evidenceFor(congress)!.contribution)).not.toBeInTheDocument();
  });
  it('lets visitors open the corresponding project from a comparison without losing the requested lens',()=>{
    render(<Journey initial={{...blankBlock('comparison'),focus:'outcomes',projectIds:[congress,boehringer]}}/>);
    fireEvent.click(screen.getByRole('button',{name:`Explore ${evidenceFor(boehringer)!.title}`}));
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Outcomes'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText('25%')).toBeVisible();
    expect(screen.getByText(/result was a rebrand that showed up consistently/)).toBeVisible();
  });
  it('shows real sources across a selected connection instead of silently returning to Contribution',()=>{
    render(<Journey initial={{...blankBlock('timeline'),answerId:'connections',connectionId:'listening',focus:'evidence'}}/>);
    expect(screen.getByRole('heading',{name:'Sources across the work'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Evidence'})).toHaveAttribute('aria-pressed','true');
    for(const id of ['senior-thesis-local-journalism','fulbright-focus-group-sponsored-by-openai','openai-product-testing-and-feedback']){
      const article=screen.getByRole('heading',{name:evidenceFor(id)!.title}).closest('article')!;
      expect(within(article).getAllByRole('link').length).toBeGreaterThan(0);
      expect(within(article).queryByText(evidenceFor(id)!.contribution)).not.toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole('button',{name:'Process'}));
    expect(screen.getByText(evidenceFor('senior-thesis-local-journalism')!.practice)).toBeVisible();
  });
  it('gives an individual role its actual organization, role and period',()=>{
    const entry=experienceEntries.find(entry=>entry.id==='us-house')!;
    render(<Journey initial={{...blankBlock('timeline'),roleId:entry.id}}/>);
    const detail=document.querySelector('.portfolio-career-detail') as HTMLElement;
    expect(within(detail).getByText(entry.organization)).toBeVisible();
    expect(within(detail).getByText(`${entry.role} · ${entry.period}`)).toBeVisible();
  });
  it('updates the comparison interpretation with the selected benchmark measure',()=>{
    render(<Journey initial={{...blankBlock('benchmark'),layout:'benchmark-compare',states:['California','Michigan']}}/>);
    expect(screen.getByText('California leads by 69.3 points on composite score.')).toBeVisible();
    fireEvent.change(screen.getByRole('combobox',{name:'Benchmark measure'}),{target:{value:'preparednessScore'}});
    expect(screen.getByText('California leads by 65.0 points on preparedness.')).toBeVisible();
  });
  it('distinguishes an exact tie from scores whose difference is smaller than the displayed precision',()=>{
    const {unmount}=render(<Journey initial={{...blankBlock('benchmark'),layout:'benchmark-compare',metric:'preparednessScore',states:['Arizona','Georgia']}}/>);
    expect(screen.getByText('Arizona and Georgia are tied on preparedness.')).toBeVisible();
    unmount();
    render(<Journey initial={{...blankBlock('benchmark'),layout:'benchmark-compare',states:['Kansas','South Dakota']}}/>);
    expect(screen.getByText('South Dakota leads by less than 0.1 points on composite score.')).toBeVisible();
  });
  it('connects the benchmark data to Isaac’s actual research and source materials',()=>{
    render(<Journey initial={blankBlock('benchmark')}/>);
    fireEvent.click(screen.getByText('About this benchmark'));
    expect(screen.getByText(/composite score combines the 15-criteria preparedness score with an efficiency adjustment/)).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Explore Isaac’s research'}));
    expect(screen.getByText(/Isaac built a public-information benchmark/)).toBeVisible();
    expect(screen.getByRole('button',{name:'Contribution'})).toHaveAttribute('aria-pressed','true');
  });
});
