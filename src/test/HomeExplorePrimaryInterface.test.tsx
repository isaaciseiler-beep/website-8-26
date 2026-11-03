import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeExplore from '@/components/canvas/HomeExplore';
import { CONTENT_VERSION, initialPlan } from '@/lib/canvas';
import { blankBlock, resolveCanvasPlan, TAIWAN_ID } from '@/lib/genui';

const success=(data:unknown)=>({ok:true,json:async()=>data});
const mount=()=>render(<MemoryRouter><HomeExplore/></MemoryRouter>);
async function submit(text:string){
  const input=screen.getByRole('combobox',{name:'Explore'});
  fireEvent.change(input,{target:{value:text}});
  await act(async()=>{fireEvent.submit(input.closest('form')!);});
}
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

describe('Explore as the primary site interface',()=>{
  it('offers actionable first-visit examples without submitting a question or changing the draft',async()=>{
    const fetcher=vi.fn(async()=>success({configured:false}));vi.stubGlobal('fetch',fetcher);mount();
    const input=screen.getByRole('combobox',{name:'Explore'});
    fireEvent.focus(input);
    expect(screen.getAllByRole('option').length).toBeGreaterThan(1);
    expect(input).toHaveValue('');
    expect(fetcher.mock.calls).toHaveLength(1);
    fireEvent.keyDown(input,{key:'Escape'});
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(fetcher.mock.calls).toHaveLength(1);
  });

  it('hides the old answer during an unresolved new request and can stop back to it safely',async()=>{
    let finish:((value:unknown)=>void)|undefined;
    let signal:AbortSignal|undefined;
    const fetcher=vi.fn(async(_url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:false});
      const request=JSON.parse(String(options.body));
      if(request.draft==='How can I contact Isaac?')return success({plan:resolveCanvasPlan(request.draft,initialPlan(),request.revision),needsComposition:false});
      signal=options.signal as AbortSignal;
      return new Promise(resolve=>{finish=resolve;});
    });
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('How can I contact Isaac?');
    expect(screen.getByRole('region',{name:'Contact'})).toBeVisible();
    await submit('zxq unfamiliar topic');
    expect(screen.queryByRole('region',{name:'Contact'})).not.toBeInTheDocument();
    expect(screen.getByText('Finding a view…',{selector:'.home-request-state span'})).toBeVisible();
    const calls=fetcher.mock.calls.length;
    await act(async()=>{fireEvent.submit(screen.getByRole('combobox',{name:'Explore'}).closest('form')!);});
    expect(fetcher).toHaveBeenCalledTimes(calls);
    fireEvent.click(screen.getByRole('button',{name:'Stop updating this view'}));
    expect(signal?.aborted).toBe(true);
    expect(screen.getByRole('region',{name:'Contact'})).toBeVisible();
    expect(screen.getByRole('combobox',{name:'Explore'})).toHaveValue('How can I contact Isaac?');
    await act(async()=>{finish?.(success({plan:resolveCanvasPlan('Taiwan teaching',initialPlan(),2),composition:{blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID]}]}}));});
    expect(screen.getByRole('region',{name:'Contact'})).toBeVisible();
    expect(screen.queryByRole('heading',{name:'AI literacy in Taiwan'})).not.toBeInTheDocument();
  });

  it('returns directly from a comparison project to the exact sources lens after refinements',async()=>{
    const fetcher=vi.fn(async()=>success({configured:false}));vi.stubGlobal('fetch',fetcher);mount();
    await submit('Compare Congress and Boehringer');
    fireEvent.click(screen.getByRole('button',{name:'Evidence'}));
    const calls=fetcher.mock.calls.length;
    fireEvent.click(screen.getByRole('button',{name:'Explore Bringing Boehringer Cares to life'}));
    fireEvent.click(screen.getByRole('button',{name:'Process'}));
    fireEvent.click(screen.getByRole('button',{name:'Back to comparison'}));
    expect(screen.getByRole('region',{name:'Project comparison'})).toBeVisible();
    expect(screen.getByRole('heading',{name:'The published sources'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Evidence'})).toHaveAttribute('aria-pressed','true');
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });

  it('returns from the research story to the exact government comparison and selected measure',async()=>{
    const fetcher=vi.fn(async()=>success({configured:false}));vi.stubGlobal('fetch',fetcher);mount();
    await submit('Compare Michigan and California');
    fireEvent.change(screen.getByRole('combobox',{name:'Benchmark measure'}),{target:{value:'preparednessScore'}});
    const calls=fetcher.mock.calls.length;
    fireEvent.click(screen.getByText('About this benchmark',{selector:'summary'}));
    fireEvent.click(screen.getByRole('button',{name:'Explore Isaac’s research'}));
    fireEvent.click(screen.getByRole('button',{name:'Outcomes'}));
    fireEvent.click(screen.getByRole('button',{name:'Back to benchmark'}));
    // Returning may reverse an opening reveal; assert the readable result once
    // opacity settles rather than racing its first animation frame.
    await waitFor(()=>expect(screen.getByRole('heading',{name:'Government comparison'})).toBeVisible());
    expect(screen.getByRole('combobox',{name:'Benchmark measure'})).toHaveValue('preparednessScore');
    expect(screen.getByRole('combobox',{name:'First government'})).toHaveValue('Michigan');
    expect(screen.getByRole('combobox',{name:'Second government'})).toHaveValue('California');
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });

  it('finishes on the first valid answer even if a transport stays open or sends another terminal result',async()=>{
    const cancel=vi.fn();
    const composition={blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID]}]};
    const other={blocks:[{...blankBlock('story'),projectIds:['boehringer-cares-foundation-rebrand-strategy-shift']}]};
    vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:true});
      const request=JSON.parse(String(options.body));
      if(url==='/api/intent')return success({plan:resolveCanvasPlan(request.draft,initialPlan(),request.revision),needsComposition:true,composerConfigured:true});
      const event=(value:unknown)=>JSON.stringify({type:'composition',composition:value,revision:request.revision,contentVersion:CONTENT_VERSION,partial:false,model:'test-only'})+'\n';
      return new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(event(composition)+event(other)));},cancel}),{headers:{'Content-Type':'application/x-ndjson'}});
    }));
    mount();await submit('Taiwan teaching');
    expect(screen.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeVisible();
    expect(screen.queryByRole('heading',{name:'Bringing Boehringer Cares to life'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Stop updating this view'})).not.toBeInTheDocument();
    expect(cancel).toHaveBeenCalled();
  });

  it.each([60000,180000])('keeps the published preview when an oversized response tries to replace it (%s bytes)',async(size)=>{
    const cancel=vi.fn();
    vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:true});
      const request=JSON.parse(String(options.body));
      if(url==='/api/intent')return success({plan:resolveCanvasPlan(request.draft,initialPlan(),request.revision),needsComposition:true,composerConfigured:true});
      const event={type:'composition',composition:{blocks:[{...blankBlock('story'),projectIds:['boehringer-cares-foundation-rebrand-strategy-shift']}]},revision:request.revision,contentVersion:CONTENT_VERSION,partial:false,padding:'x'.repeat(size)};
      return new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(JSON.stringify(event)+'\n'));},cancel}),{headers:{'Content-Type':'application/x-ndjson'}});
    }));
    mount();await submit('Taiwan teaching');
    expect(screen.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeVisible();
    expect(screen.queryByRole('heading',{name:'Bringing Boehringer Cares to life'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Stop updating this view'})).not.toBeInTheDocument();
    expect(cancel).toHaveBeenCalled();
  });
});
