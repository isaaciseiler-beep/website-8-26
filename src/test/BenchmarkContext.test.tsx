import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ExplorationCanvas from '@/components/canvas/ExplorationCanvas';
import BenchmarkExplorer from '@/components/canvas/BenchmarkExplorer';
import { presetComposition, type Composition } from '@/lib/genui';
import { AI_LAYOUTS } from '@/lib/layouts';
import { initialPlan } from '@/lib/canvas';
import { evidenceFor } from '@/lib/portfolioEvidence';

const research=evidenceFor('artificial-intelligence-in-state-government-index')!;
function Harness(){
  const [composition,setComposition]=useState<Composition>(presetComposition('benchmark-scorecard'));
  return <ExplorationCanvas composition={composition} onChange={setComposition} plan={initialPlan()} generation={{status:'authored'}}/>;
}
afterEach(cleanup);

describe('benchmark data stays connected to Isaac’s research',()=>{
  it.each(AI_LAYOUTS.filter(layout=>layout.kind==='benchmark'))('$id establishes authorship, purpose and dated scope before data controls',({id})=>{
    const {container}=render(<BenchmarkExplorer block={presetComposition(id).blocks[0]} onChange={()=>{}}/>);
    const context=container.querySelector('.benchmark-study-context')!;
    expect(context).toBeVisible();
    expect(context).toHaveTextContent('Isaac’s public-information benchmark of AI adoption across U.S. states and territories');
    expect(context).toHaveTextContent('August 2025 snapshot');
    const scores=container.querySelector('.canvas-scorecards');
    if(scores)expect(scores.compareDocumentPosition(context) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(context.compareDocumentPosition(container.querySelector('.canvas-benchmark-controls')!) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(screen.getByRole('link',{name:'The GenAI Benchmark'})).toBeVisible();
    expect(screen.getByRole('link',{name:'The GenAI Benchmark'})).toHaveAccessibleDescription('Opens in a new tab.');
    expect(screen.getByText('About this benchmark').closest('details')).not.toHaveAttribute('open');
  });

  it('updates the measure explanation without duplicating the project context or hiding its source',()=>{
    render(<Harness/>);
    fireEvent.click(screen.getByText('About this benchmark'));
    expect(screen.getByText(/The composite score combines the 15-criteria preparedness score/)).toBeVisible();
    fireEvent.change(screen.getByRole('combobox',{name:'Benchmark measure'}),{target:{value:'preparednessScore'}});
    expect(screen.getByText(/Preparedness uses 15 criteria grounded in publicly verifiable evidence/)).toBeVisible();
    expect(screen.queryByText(/The composite score combines/)).not.toBeInTheDocument();
    expect(document.querySelectorAll('.benchmark-study-context')).toHaveLength(1);
    expect(screen.getAllByRole('link',{name:'The GenAI Benchmark'})).toHaveLength(1);
  });

  it('opens the actual project overview from its visible study context',()=>{
    render(<Harness/>);
    fireEvent.click(screen.getByRole('button',{name:'Explore Isaac’s research'}));
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Contribution'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText(research.contribution)).toBeVisible();
    expect(screen.getByText(research.outcome)).toBeVisible();
    expect(screen.queryByRole('region',{name:'AI benchmark explorer'})).not.toBeInTheDocument();
  });
});
