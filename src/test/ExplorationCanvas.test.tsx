import { fireEvent, render, screen, cleanup, act, within } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ExplorationCanvas from '@/components/canvas/ExplorationCanvas';
import HomeExplore from '@/components/canvas/HomeExplore';
import { blankBlock, TAIWAN_ID, presetComposition, validateComposition, type Composition } from '@/lib/genui';
import { AI_LAYOUTS } from '@/lib/layouts';
import { initialPlan, localPlan, CONTENT_VERSION } from '@/lib/canvas';
function Harness({initial}:{initial:Composition}){const [value,setValue]=useState(initial);return <ExplorationCanvas composition={value} onChange={setValue} plan={initialPlan()} generation={{status:'authored'}}/>;}
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();});
describe('interactive canvas',()=>{
  it('changes real benchmark values without asking a model',()=>{
    render(<Harness initial={{blocks:[{...blankBlock('benchmark'),states:['Michigan','California']}]}}/>);
    expect(within(screen.getByRole('article',{name:'Michigan score'})).getByText(/17\.8/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox',{name:'Benchmark measure'}),{target:{value:'preparednessScore'}});
    expect(within(screen.getByRole('article',{name:'Michigan score'})).getByText(/10\.0/)).toBeInTheDocument();
    expect(within(screen.getByRole('article',{name:'California score'})).getByText(/75\.0/)).toBeInTheDocument();
  });
  it.each(AI_LAYOUTS)('renders a valid $id without inventing content',({id})=>{
    const initial=presetComposition(id);
    expect(validateComposition(initial)).not.toBeNull();
    const {container}=render(<Harness initial={initial}/>);
    expect(container.querySelector(`[data-layout="${id}"] section`)).not.toBeNull();
  });
  it('keeps the evidence secondary and opens it on demand',()=>{
    render(<Harness initial={presetComposition('benchmark-compare')}/>);
    const evidence=screen.getByText('Evidence breakdown').closest('details')!;
    expect(evidence.open).toBe(false);
    fireEvent.click(screen.getByText('Evidence breakdown'));
    expect(evidence.open).toBe(true);
    expect(screen.getByLabelText('California: 2 of 2')).toBeInTheDocument();
  });
  it('returns to all governments without losing the selected measure',()=>{
    const initial=presetComposition('benchmark-compare');
    initial.blocks[0].metric='preparednessScore';
    render(<Harness initial={initial}/>);
    fireEvent.click(screen.getByRole('button',{name:'All governments'}));
    expect(screen.getByRole('combobox',{name:'Benchmark measure'})).toHaveValue('preparednessScore');
    expect(screen.getByRole('button',{name:'Inspect Maryland, score 85.0'})).toBeInTheDocument();
    expect(screen.queryByRole('article',{name:'Michigan score'})).not.toBeInTheDocument();
  });
  it('builds a teaching prompt from the chosen topic and audience',()=>{
    render(<Harness initial={{blocks:[{...blankBlock('workshop'),projectIds:[TAIWAN_ID]}]}}/>);
    fireEvent.change(screen.getByRole('textbox',{name:'Teaching topic'}),{target:{value:'fractions'}});
    fireEvent.change(screen.getByRole('combobox',{name:'Teaching audience'}),{target:{value:'Primary students'}});
    expect(screen.getByText(/Help me plan a lesson about fractions for primary students/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Give feedback'}));
    expect(screen.getByText(/Help me give useful feedback on fractions/)).toBeInTheDocument();
  });
  it('does not let a delayed LLM stream overwrite a manual control change',async()=>{
    vi.useFakeTimers();let deliver:((r:Response)=>void)|undefined;
    vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return {ok:true,json:async()=>({configured:true})};
      const request=JSON.parse(String(options.body));
      if(url==='/api/intent')return {ok:true,json:async()=>({plan:localPlan(request.draft,request.current,[],request.revision)})};
      return new Promise<Response>(resolve=>{deliver=resolve;});
    }));
    render(<MemoryRouter><HomeExplore/></MemoryRouter>);
    await act(async()=>{});
    const input=screen.getByRole('combobox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Compare Michigan and California'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    fireEvent.change(screen.getByRole('combobox',{name:'Benchmark measure'}),{target:{value:'preparednessScore'}});
    await act(async()=>{deliver!(new Response(JSON.stringify({type:'composition',revision:2,contentVersion:CONTENT_VERSION,composition:{blocks:[blankBlock('contact')]},partial:false})+'\n',{headers:{'Content-Type':'application/x-ndjson'}}));});
    expect(within(screen.getByRole('article',{name:'Michigan score'})).getByText(/10\.0/)).toBeInTheDocument();
    expect(screen.queryByRole('region',{name:'Contact'})).not.toBeInTheDocument();
  });
});
