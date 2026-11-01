import { useState } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CareerExplorer } from '@/components/canvas/PortfolioViews';
import { composeLocal, validateComposition, reconcileComposition, isLocalCompositionRefinement } from '@/lib/genui';
import { initialPlan } from '@/lib/canvas';
import { connectionIds, portfolioConnections } from '@/lib/portfolioConnections';
import { evidenceFor, evidenceSections } from '@/lib/portfolioEvidence';
import { createPortableView, encodeView, decodeView } from '@/lib/portfolioView';
const starting=()=>composeLocal('What connects Isaac’s work across fields?',initialPlan());
function Explorer(){const [block,setBlock]=useState(starting().blocks[0]);return <CareerExplorer block={block} onChange={setBlock}/>;}
afterEach(cleanup);
describe('linked portfolio evidence',()=>{
  it('changes every project against one lens and keeps the chosen thread',()=>{
    render(<Explorer/>);
    fireEvent.change(screen.getByRole('combobox',{name:'Connection to explore'}),{target:{value:'listening'}});
    fireEvent.click(screen.getByRole('button',{name:'Process',exact:true}));
    for(const id of portfolioConnections.listening.projectIds)expect(screen.getByText(evidenceFor(id)!.practice)).toBeVisible();
    expect(screen.getByRole('combobox')).toHaveValue('listening');
    expect(screen.getByRole('button',{name:'Process',exact:true})).toHaveAttribute('aria-pressed','true');
    expect(screen.queryByRole('heading',{name:'Building a congressional office'})).not.toBeInTheDocument();
  });
  it('shows original supporting passages on demand, then closes them on a lens change',()=>{
    render(<Explorer/>);
    const disclosure=screen.getAllByText(/Supporting evidence/,{selector:'summary'})[0].closest('details');
    expect(disclosure?.open).toBe(false);
    fireEvent.click(within(disclosure!).getByText('Supporting evidence',{exact:false}));
    expect(disclosure?.open).toBe(true);
    expect(within(disclosure!).getByRole('button',{name:'Explore this project'})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Outcomes',exact:true}));
    expect(screen.getAllByText(/Supporting evidence/,{selector:'summary'}).every(summary=>!summary.closest('details')!.open)).toBe(true);
  });
  it.each(connectionIds)('grounds the %s thread in published projects and passages',id=>{
    for(const projectId of portfolioConnections[id].projectIds){
      expect(evidenceFor(projectId)).not.toBeNull();
      expect(evidenceSections(projectId,'process').length).toBeGreaterThan(0);
      expect(evidenceSections(projectId,'outcomes').length).toBeGreaterThan(0);
    }
  });
  it('preserves selected controls through followups and portable views',()=>{
    const current=starting();current.blocks[0]={...current.blocks[0],connectionId:'delivery',focus:'outcomes'};
    expect(composeLocal('Tell me more',initialPlan(),current).blocks[0]).toMatchObject({connectionId:'delivery',focus:'outcomes'});
    const portable=createPortableView(current);
    expect(decodeView(encodeView(portable))?.composition.blocks[0]).toMatchObject({connectionId:'delivery',focus:'outcomes'});
    expect(isLocalCompositionRefinement('Process',current)).toBe(true);
    expect(isLocalCompositionRefinement('Learning from people',current)).toBe(true);
  });
  it('accepts a model-selected reviewed relationship without overriding an explicit one',()=>{
    const baseline=starting();const generated={blocks:[{...baseline.blocks[0],connectionId:'listening' as const}]};
    expect(reconcileComposition('What connects Isaac’s work?',generated,baseline)?.blocks[0].connectionId).toBe('listening');
    const explicit=composeLocal('Explore carrying ideas into practice',initialPlan());
    expect(reconcileComposition('Explore carrying ideas into practice',generated,explicit)?.blocks[0].connectionId).toBe('delivery');
  });
  it('rejects invented relationships and use outside the connections view',()=>{
    const block=starting().blocks[0];
    expect(validateComposition({blocks:[{...block,connectionId:'invented'}]})).toBeNull();
    expect(validateComposition({blocks:[{...block,answerId:'strengths',connectionId:'systems'}]})).toBeNull();
  });
});
