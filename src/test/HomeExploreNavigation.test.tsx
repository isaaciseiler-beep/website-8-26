import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HomeExplore from '@/components/canvas/HomeExplore';
import { CONTENT_VERSION, initialPlan } from '@/lib/canvas';
import { blankBlock, resolveCanvasPlan, TAIWAN_ID } from '@/lib/genui';

const mount = () => render(<MemoryRouter><HomeExplore /></MemoryRouter>);
async function submit(text: string) {
  const input=screen.getByRole('combobox',{name:'Explore'});
  fireEvent.change(input,{target:{value:text}});
  await act(async()=>{fireEvent.submit(input.closest('form')!);});
}
afterEach(()=>{cleanup();vi.unstubAllGlobals();});

describe('exploration navigation',()=>{
  it('keeps live filtering in the current exploration instead of adding keystrokes to Back',async()=>{
    const fetcher=vi.fn(async()=>({ok:true,json:async()=>({configured:false})}));
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('Explore all projects');
    const calls=fetcher.mock.calls.length;
    const search=screen.getByRole('searchbox',{name:'Find a project'});
    for(const value of ['T','Tai','Taiwan'])fireEvent.change(search,{target:{value}});
    expect(screen.queryByRole('button',{name:'Previous exploration'})).not.toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('region',{name:'Work explorer'})).getByRole('button',{name:/Leading AI Literacy/}));
    fireEvent.click(screen.getByRole('button',{name:'Back to projects'}));
    expect(screen.getByRole('searchbox',{name:'Find a project'})).toHaveValue('Taiwan');
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it('returns from supporting evidence to the exact connection and lens',async()=>{
    const fetcher=vi.fn(async()=>({ok:true,json:async()=>({configured:false})}));
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('What connects Isaac’s work across fields?');
    fireEvent.change(screen.getByRole('combobox',{name:'Connection to explore'}),{target:{value:'delivery'}});
    fireEvent.click(screen.getByRole('button',{name:'Outcomes'}));
    const calls=fetcher.mock.calls.length;
    fireEvent.click(screen.getAllByText(/Supporting evidence/,{selector:'summary'})[0]);
    fireEvent.click(screen.getByRole('button',{name:'Explore AI literacy in Taiwan'}));
    fireEvent.click(screen.getByRole('button',{name:'Back to connections'}));
    expect(screen.getByRole('combobox',{name:'Connection to explore'})).toHaveValue('delivery');
    expect(screen.getByRole('button',{name:'Outcomes'})).toHaveAttribute('aria-pressed','true');
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it('keeps the selected connection and visible source lens through project exploration',async()=>{
    const fetcher=vi.fn(async()=>({ok:true,json:async()=>({configured:false})}));
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('What connects Isaac’s work across fields?');
    fireEvent.change(screen.getByRole('combobox',{name:'Connection to explore'}),{target:{value:'listening'}});
    fireEvent.click(screen.getByRole('button',{name:'Evidence'}));
    const calls=fetcher.mock.calls.length;
    expect(screen.getByRole('link',{name:'Final Thesis Draft'})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Explore AI, platforms & local journalism'}));
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeVisible();
    expect(screen.getByRole('button',{name:'Evidence'})).toHaveAttribute('aria-pressed','true');
    fireEvent.click(screen.getByRole('button',{name:'Back to connections'}));
    expect(screen.getByRole('combobox',{name:'Connection to explore'})).toHaveValue('listening');
    expect(screen.getByRole('link',{name:'Final Thesis Draft'})).toBeVisible();
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });
  it('returns to the exact project search after opening and refining a project without another request',async()=>{
    const fetcher=vi.fn(async()=>({ok:true,json:async()=>({configured:false})}));
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('Explore all projects');
    fireEvent.change(screen.getByRole('searchbox',{name:'Find a project'}),{target:{value:'Taiwan'}});
    const calls=fetcher.mock.calls.length;
    const matches=within(screen.getByRole('region',{name:'Work explorer'})).getAllByRole('button').length;
    fireEvent.click(within(screen.getByRole('region',{name:'Work explorer'})).getByRole('button',{name:/Leading AI Literacy/}));
    fireEvent.click(screen.getByRole('button',{name:'Process'}));
    fireEvent.click(screen.getByRole('button',{name:'Outcomes'}));
    fireEvent.click(screen.getByRole('button',{name:'Back to projects'}));
    expect(screen.getByRole('searchbox',{name:'Find a project'})).toHaveValue('Taiwan');
    expect(within(screen.getByRole('region',{name:'Work explorer'})).getAllByRole('button')).toHaveLength(matches);
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });

  it('keeps the return path through a natural-language project follow-up and removes it on a new subject',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({configured:false})})));mount();
    await submit('Explore all projects');
    fireEvent.click(screen.getByRole('button',{name:/Leading AI Literacy/}));
    await submit('Show the process');
    expect(screen.getByRole('button',{name:'Back to projects'})).toBeInTheDocument();
    await submit('How can I contact Isaac?');
    expect(screen.getByRole('region',{name:'Contact'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Back to projects'})).not.toBeInTheDocument();
  });

  it('uses server-confirmed composer availability while the configuration probe is still pending',async()=>{
    const composition={blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID]}]};
    const fetcher=vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return new Promise(()=>{});
      const request=JSON.parse(String(options.body));
      if(url==='/api/intent')return {ok:true,json:async()=>({plan:resolveCanvasPlan(request.draft,initialPlan(),request.revision),composition,needsComposition:true,composerConfigured:true})};
      return new Response(JSON.stringify({type:'composition',composition,revision:request.revision,contentVersion:CONTENT_VERSION,partial:false,model:'test-only'})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
    });
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('Describe the educator community initiative');
    expect(fetcher.mock.calls.filter(([url,options])=>url==='/api/compose'&&options?.method==='POST')).toHaveLength(1);
    expect(screen.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeInTheDocument();
  });

  it('uses a configuration probe that becomes ready while intent routing is pending',async()=>{
    let finishConfiguration:(value:unknown)=>void;
    let finishIntent:(value:unknown)=>void;
    const composition={blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID]}]};
    const fetcher=vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return new Promise(resolve=>{finishConfiguration=resolve;});
      if(url==='/api/intent')return new Promise(resolve=>{finishIntent=resolve;});
      const request=JSON.parse(String(options.body));
      return new Response(JSON.stringify({type:'composition',composition,revision:request.revision,contentVersion:CONTENT_VERSION,partial:false,model:'test-only'})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
    });
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('Taiwan teaching');
    await act(async()=>{finishConfiguration!({ok:true,json:async()=>({configured:true})});});
    await act(async()=>{finishIntent!({ok:false,json:async()=>({})});});
    expect(fetcher.mock.calls.filter(([url,options])=>url==='/api/compose'&&options?.method==='POST')).toHaveLength(1);
    expect(screen.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeInTheDocument();
  });

  it('carries generated subjects into the next request instead of the unresolved local preview',async()=>{
    const requests:Record<string,unknown>[]=[];
    const fetcher=vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return {ok:true,json:async()=>({configured:true})};
      const request=JSON.parse(String(options.body));requests.push({url,...request});
      if(url==='/api/intent')return {ok:true,json:async()=>({needsComposition:true})};
      const composition={blocks:[{...blankBlock('story'),projectIds:[TAIWAN_ID]}]};
      return new Response(JSON.stringify({type:'composition',composition,revision:request.revision,contentVersion:CONTENT_VERSION,partial:false,model:'test-only'})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
    });
    vi.stubGlobal('fetch',fetcher);mount();await act(async()=>{});
    await submit('Describe the educator community initiative');
    expect(screen.getByRole('heading',{name:'AI literacy in Taiwan'})).toBeInTheDocument();
    await submit('How can I contact Isaac?');
    const second=requests.filter(request=>request.url==='/api/compose')[1];
    expect(second.current).toMatchObject({blocks:[{kind:'story',projectIds:[TAIWAN_ID]}]});
    expect(requests.some(request=>request.url==='/api/intent')).toBe(false);
  });
  it('restores a previous exploration and its selected controls without another request', async () => {
    const fetcher=vi.fn(async()=>({ok:true,json:async()=>({configured:false})}));
    vi.stubGlobal('fetch',fetcher);mount();
    await submit('Compare California and Washington');
    fireEvent.change(screen.getByRole('combobox',{name:'Benchmark measure'}),{target:{value:'preparednessScore'}});
    await submit('How can I contact Isaac?');
    const calls=fetcher.mock.calls.length;
    fireEvent.click(screen.getByRole('button',{name:'Previous exploration'}));
    expect(screen.getByRole('combobox',{name:'Benchmark measure'})).toHaveValue('preparednessScore');
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });

});
