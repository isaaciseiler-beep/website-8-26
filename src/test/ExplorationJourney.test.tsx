import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeExplore from '@/components/canvas/HomeExplore';
import { ExplorationFeedback } from '@/components/canvas/ExplorationJourneyTools';
import { captureReadingState, restoreReadingState } from '@/lib/explorationReadingState';
import { beginExplorationMetric, recentExplorationMetrics } from '@/lib/explorationMetrics';
import { CONTENT_VERSION } from '@/lib/canvas';
import { blankBlock, TAIWAN_ID } from '@/lib/genui';

const response=(data:unknown)=>({ok:true,json:async()=>data});
async function submit(text:string){const input=screen.getByRole('textbox',{name:'Explore'});fireEvent.change(input,{target:{value:text}});await act(async()=>{fireEvent.submit(input.closest('form')!);});}
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();});

describe('primary exploration journeys',()=>{
  it('offers concrete work choices for compare experiences without a model request or default pair',async()=>{
    const fetcher=vi.fn(async()=>response({configured:true}));vi.stubGlobal('fetch',fetcher);
    render(<MemoryRouter><HomeExplore/></MemoryRouter>);await act(async()=>{});
    await submit('Compare experiences');
    expect(screen.getByText('Which work would you like to explore?')).toBeVisible();
    expect(screen.getByRole('button',{name:/Leading AI Literacy Efforts in Taiwan/})).toBeVisible();
    expect(screen.queryByRole('region',{name:'Project comparison'})).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('asks a concrete clarification for ambiguous work and opens the chosen subject locally',async()=>{
    const fetcher=vi.fn(async()=>response({configured:true}));vi.stubGlobal('fetch',fetcher);
    render(<MemoryRouter><HomeExplore/></MemoryRouter>);await act(async()=>{});
    await submit('research');
    expect(screen.getByText('Which work would you like to explore?')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button',{name:/Impact on Journalism in Australia/}));
    expect(screen.getByRole('heading',{name:'AI, platforms & local journalism'})).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('offers an optional complete work browse without provider requests while deciding',async()=>{
    const fetcher=vi.fn(async()=>response({configured:false}));vi.stubGlobal('fetch',fetcher);
    render(<MemoryRouter><HomeExplore/></MemoryRouter>);
    fireEvent.focus(screen.getByRole('textbox',{name:'Explore'}));
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option',{name:'How to explore'})).toBeInTheDocument();
    await act(async()=>{fireEvent.click(screen.getByRole('option',{name:'Browse work'}));});
    expect(screen.getByRole('region',{name:'Work explorer'})).toBeVisible();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox',{name:'Explore'})).toHaveValue('Explore all projects');
  });

  it('uses one composition POST when configured, retaining the previous evidence as context',async()=>{
    const requests:{url:string;body:Record<string,unknown>}[]=[];
    vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return response({configured:true});
      const body=JSON.parse(String(options.body));requests.push({url,body});
      return new Response(JSON.stringify({type:'composition',composition:{blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID]}]},revision:body.revision,contentVersion:CONTENT_VERSION,partial:false})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
    }));
    render(<MemoryRouter><HomeExplore/></MemoryRouter>);await act(async()=>{});
    await submit('Taiwan teaching');await submit('How did he adapt the sessions?');
    expect(requests).toHaveLength(2);
    expect(requests.every(request=>request.url==='/api/compose')).toBe(true);
    expect(requests[1].body.current).toMatchObject({blocks:[{projectIds:[TAIWAN_ID]}]});
  });

  it('jumps to a named earlier exploration and keeps the intervening forward path',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>response({configured:false})));
    render(<MemoryRouter><HomeExplore/></MemoryRouter>);
    await submit('Taiwan teaching');await submit('Boehringer rebrand');await submit('How can I contact Isaac?');
    const history=screen.getByText('History',{selector:'summary'}).closest('details')!;
    fireEvent.click(within(history).getByRole('button',{name:/Leading AI Literacy Efforts in Taiwan/,hidden:true}));
    expect(screen.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Next exploration'}));
    expect(screen.getByRole('heading',{name:'Bringing Boehringer Cares to life'})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Next exploration'}));
    expect(screen.getByRole('region',{name:'Contact'})).toBeVisible();
  });

  it('preserves opened source disclosures when returning to an earlier answer',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>response({configured:false})));
    render(<MemoryRouter><HomeExplore/></MemoryRouter>);
    await submit('Taiwan teaching');
    const source=screen.getByRole('region',{name:'Project explorer'}).querySelector<HTMLDetailsElement>('details.canvas-sources')!;
    source.open=true;
    await submit('How can I contact Isaac?');
    fireEvent.click(screen.getByRole('button',{name:'Previous exploration'}));
    expect(screen.getByRole('region',{name:'Project explorer'}).querySelector('details.canvas-sources')).toHaveAttribute('open');
  });

  it('prepares explicitly chosen feedback locally with the exact view rather than sending it',()=>{
    const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
    render(<ExplorationFeedback title="Taiwan" question="What changed?" url="https://seiler.page/#view=reviewed-example"/>);
    const feedback=screen.getByText('Feedback',{selector:'summary'}).closest('details')!;
    feedback.open=true;
    fireEvent.change(screen.getByLabelText('What could be better?'),{target:{value:'Something is missing or inaccurate'}});
    fireEvent.change(screen.getByLabelText(/What did you expect/),{target:{value:'Show the program materials.'}});
    const href=screen.getByRole('link',{name:'Email this feedback'}).getAttribute('href')!;
    expect(decodeURIComponent(href)).toContain('Something is missing or inaccurate');
    expect(decodeURIComponent(href)).toContain('Show the program materials.');
    expect(decodeURIComponent(href)).toContain('https://seiler.page/#view=reviewed-example');
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('bounded session reading state and diagnostics',()=>{
  it('distinguishes repeated disclosures and restores both open and closed state',()=>{
    const root=document.createElement('div');root.innerHTML='<details><summary>Sources +</summary>A</details><details open><summary>Sources +</summary>B</details>';
    const saved=captureReadingState(root);
    const details=[...root.querySelectorAll('details')];details[0].open=true;details[1].open=false;
    restoreReadingState(root,saved,false);
    expect(details.map(detail=>detail.open)).toEqual([false,true]);
  });
  it('records first committed content separately from completion and bounds retained diagnostics',()=>{
    let now=100;vi.spyOn(performance,'now').mockImplementation(()=>now);
    const metric=beginExplorationMetric('question');now=125;metric.contentCommitted();now=500;metric.finish('generated');metric.finish('cancelled');
    expect(recentExplorationMetrics().at(-1)).toMatchObject({firstContentCommittedMs:25,requestCompletedMs:400,result:'generated'});
    for(let index=0;index<30;index++)beginExplorationMetric('refinement').finish('authored');
    expect(recentExplorationMetrics()).toHaveLength(24);
    expect(Object.keys(recentExplorationMetrics()[0]).sort()).toEqual(['kind','requestCompletedMs','requestId','result']);
  });
});
