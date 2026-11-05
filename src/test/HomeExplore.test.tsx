import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomeExplore from "@/components/canvas/HomeExplore";
import { initialPlan, localPlan, CONTENT_VERSION } from "@/lib/canvas";

const success = (data: unknown) => ({ ok: true, json: async () => data });
const mount = () => render(<MemoryRouter><HomeExplore /></MemoryRouter>);

describe("homepage generative interface", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('does not turn a greeting or typing pause into an unrelated project', async () => {
    const fetcher=vi.fn(async()=>success({configured:true}));
    vi.stubGlobal('fetch',fetcher);
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'hello'}});
    await act(async()=>{vi.advanceTimersByTime(5000);});
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.getByText('Hi. What would you like to explore?')).toBeInTheDocument();
    expect(screen.queryByRole('region',{name:'AI benchmark explorer'})).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Explore the work'}));});
    expect(screen.getByRole('region',{name:'Work explorer'})).toBeInTheDocument();
    fireEvent.click(within(screen.getByRole('region',{name:'Work explorer'})).getByRole('button',{name:/Leading AI Literacy Efforts in Taiwan/}));
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Back'})).not.toBeInTheDocument();
    expect(screen.getByText('Sources',{selector:'summary'}).closest('details')).not.toHaveAttribute('open');
  });

  it('hands keyboard focus into an opened project and back to its filtered project button',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>success({configured:false})));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Explore all projects'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    fireEvent.change(screen.getByRole('searchbox',{name:'Find a project'}),{target:{value:'Taiwan'}});
    const project=within(screen.getByRole('region',{name:'Work explorer'})).getByRole('button',{name:/Leading AI Literacy Efforts in Taiwan/});
    act(()=>project.focus());fireEvent.click(project);
    expect(screen.getByRole('heading',{name:'AI literacy in Taiwan'})).toHaveFocus();
    fireEvent.click(screen.getByRole('button',{name:'Process'}));
    const back=screen.getByRole('button',{name:'Back to projects'});
    act(()=>back.focus());fireEvent.click(back);
    expect(screen.getByRole('searchbox',{name:'Find a project'})).toHaveValue('Taiwan');
    expect(within(screen.getByRole('region',{name:'Work explorer'})).getByRole('button',{name:/Leading AI Literacy Efforts in Taiwan/})).toHaveFocus();
  });

  it('keeps committed results while editing, then handles unknown requests without inherited content', async () => {
    const fetcher=vi.fn(async()=>success({configured:false}));
    vi.stubGlobal('fetch',fetcher);
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Show state government AI rankings'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.getByRole('region',{name:'AI benchmark explorer'})).toBeInTheDocument();
    const calls=fetcher.mock.calls.length;
    fireEvent.change(input,{target:{value:'zxq nonsense'}});
    await act(async()=>{vi.advanceTimersByTime(5000);});
    expect(screen.getByRole('region',{name:'AI benchmark explorer'})).toBeInTheDocument();
    expect(screen.queryByText('Press Enter to update')).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(calls);
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.queryByRole('region',{name:'AI benchmark explorer'})).not.toBeInTheDocument();
    expect(screen.getByLabelText('Choose a starting point')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(calls+1);
    expect(screen.queryByRole('button',{name:'Back'})).not.toBeInTheDocument();
    expect(input).toHaveValue('zxq nonsense');
  });

  it('offers starting points when an unfamiliar request cannot be composed',async()=>{
    vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
      if(url==='/api/compose')return new Response(JSON.stringify({type:'unavailable',reason:'rate_limit',revision:1,contentVersion:CONTENT_VERSION})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
      return success({configured:true,needsComposition:true});
    }));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'An unfamiliar question'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.getByLabelText('Choose a starting point')).toBeInTheDocument();
    expect(screen.queryByRole('region',{name:'Work explorer'})).not.toBeInTheDocument();
  });

  it('keeps short benchmark follow-ups in context without another provider call',async()=>{
    const fetcher=vi.fn(async()=>success({configured:false}));
    vi.stubGlobal('fetch',fetcher);mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Show state government AI rankings'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    const calls=fetcher.mock.calls.length;
    fireEvent.change(input,{target:{value:'only Midwest'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.getByRole('region',{name:'AI benchmark explorer'})).toBeInTheDocument();
    expect(screen.getByRole('combobox',{name:'Benchmark region'})).toHaveValue('Midwest');
    expect(fetcher).toHaveBeenCalledTimes(calls);
  });

  it("starts empty and submits the exact draft to the real endpoint contract", async () => {
    const fetcher = vi.fn(async (_url: string, options?: RequestInit) => {
      if (!options?.body) return success({ configured: false });
      const request = JSON.parse(String(options.body));
      return success({ plan: localPlan(request.draft, request.current, [], request.revision) });
    });
    vi.stubGlobal("fetch", fetcher);
    mount();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    const input = screen.getByRole("textbox", { name: "Explore" });
    fireEvent.change(input, { target: { value: "contact" } });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute("href", expect.stringContaining("mailto:"));
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body)).draft).toBe("contact");
    expect(screen.getByRole("region", {name:"Contact"})).toBeInTheDocument();
  });

  it("keeps photo requests in the existing gallery without an AI request",async()=>{
    const fetcher=vi.fn(async()=>success({configured:true}));
    vi.stubGlobal('fetch',fetcher);
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Show Japan photos'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.getByRole('region',{name:'Photographs'})).toBeInTheDocument();
    expect(screen.getByRole('link',{name:/Japan/})).toHaveAttribute('href','/?album=Japan');
    expect(screen.getByRole('link',{name:/Photo Map/})).toHaveAttribute('href','/photos/map');
    expect(screen.getByRole('link',{name:/All photographs/})).toHaveAttribute('href','/#photo-gallery');
    expect(screen.queryByRole('region',{name:'Photo explorer'})).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('announces pending work outside the busy results and stops when a draft cancels it', async () => {
    vi.stubGlobal('fetch',vi.fn(async (_url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:false});
      return new Promise(()=>{});
    }));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Taiwan teaching'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    const status=screen.getByRole('status');
    expect(status).toHaveTextContent('Finding projects');
    expect(status.closest('[aria-busy="true"]')).toBeNull();
    fireEvent.change(input,{target:{value:'a different question'}});
    expect(status).toBeEmptyDOMElement();
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeInTheDocument();
  });

  it('selects a committed question for replacement and offers a fresh follow-up draft',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>success({configured:false})));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'}) as HTMLTextAreaElement;
    act(()=>input.focus());
    fireEvent.change(input,{target:{value:'Taiwan teaching'}});
    await act(async()=>{fireEvent.keyDown(input,{key:'Enter'});});
    expect(input.selectionEnd-input.selectionStart).toBe(0);
    fireEvent.change(input,{target:{value:'Taiwan teachingA'}});
    expect(input).toHaveValue('A');
    fireEvent.click(screen.getByRole('button',{name:'Ask a follow-up'}));
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('offers starting points during a slow empty request and ignores its response after Stop',async()=>{
    let deliver:(value:unknown)=>void=()=>{};
    vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:false});
      return new Promise(resolve=>{deliver=resolve;});
    }));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'An unfamiliar question'}});
    await act(async()=>{fireEvent.keyDown(input,{key:'Enter'});});
    expect(screen.getByLabelText('Preparing exploration')).toBeInTheDocument();
    await act(async()=>{vi.advanceTimersByTime(3000);});
    expect(screen.getByRole('button',{name:'Browse work'})).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Finding projects');
    fireEvent.click(screen.getByRole('button',{name:'Stop updating this view'}));
    expect(screen.getByRole('status')).toHaveTextContent('Stopped.');
    expect(screen.getByRole('button',{name:'Retry'})).toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(screen.queryByLabelText('Preparing exploration')).not.toBeInTheDocument();
    await act(async()=>{deliver(success({plan:localPlan('contact',initialPlan(),[],1)}));});
    expect(screen.queryByRole('region',{name:'Contact'})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Stop updating this view'})).not.toBeInTheDocument();
  });

  it('retries the question currently in the box after a stopped follow-up',async()=>{
    const drafts:string[]=[];
    vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:false});
      const request=JSON.parse(String(options.body));
      drafts.push(request.draft);
      if(request.draft==='zxq follow up')return new Promise(()=>{});
      return success({plan:localPlan(request.draft,request.current,[],request.revision),needsComposition:false});
    }));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'How can I contact Isaac?'}});
    await act(async()=>{fireEvent.keyDown(input,{key:'Enter'});});
    fireEvent.change(input,{target:{value:'zxq follow up'}});
    await act(async()=>{fireEvent.keyDown(input,{key:'Enter'});});
    fireEvent.click(screen.getByRole('button',{name:'Stop updating this view'}));
    expect(input).toHaveValue('How can I contact Isaac?');
    await act(async()=>{fireEvent.click(screen.getByRole('button',{name:'Retry'}));});
    expect(drafts.at(-1)).toBe('How can I contact Isaac?');
  });

  it('retains the progress slot when an authored preview finishes and avoids a full loading spinner over content',async()=>{
    let deliver:(value:unknown)=>void=()=>{};
    vi.stubGlobal('fetch',vi.fn(async(_url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:false});
      return new Promise(resolve=>{deliver=resolve;});
    }));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Taiwan teaching'}});
    await act(async()=>{fireEvent.keyDown(input,{key:'Enter'});});
    const slot=document.querySelector('.home-request-state');
    expect(slot).not.toBeNull();
    expect(document.querySelector('.home-submit-spinner')).toBeNull();
    await act(async()=>{deliver(success({plan:localPlan('Taiwan teaching',initialPlan(),[],2),needsComposition:false}));});
    expect(document.querySelector('.home-request-state')).toBe(slot);
    expect(slot).toBeEmptyDOMElement();
    expect(screen.queryByRole('button',{name:'Stop updating this view'})).not.toBeInTheDocument();
  });

  it('shows a visible recovery message and preserves the authored view after a composition timeout',async()=>{
    vi.stubGlobal('fetch',vi.fn(async(url:string,options?:RequestInit)=>{
      if(!options?.body)return success({configured:true});
      const request=JSON.parse(String(options.body));
      if(url==='/api/intent')return success({plan:localPlan(request.draft,request.current,[],request.revision),composerConfigured:true});
      throw new DOMException('Timed out','TimeoutError');
    }));
    mount();
    const input=screen.getByRole('textbox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Taiwan teaching'}});
    await act(async()=>{fireEvent.keyDown(input,{key:'Enter'});});
    expect(document.querySelector('.home-request-state')).toHaveTextContent('The answer didn’t finish.');
    expect(screen.getByRole('button',{name:'Retry'})).toBeInTheDocument();
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:'Stop updating this view'})).not.toBeInTheDocument();
  });

  it.each(['manual control','draft edit','clear and new request'] as const)('ignores delayed clipboard outcomes after %s',async change=>{
    for(const outcome of ['success','failure'] as const){
      let finish:()=>void=()=>{};
      const writeText=vi.fn(()=>new Promise<void>((resolve,reject)=>{finish=()=>outcome==='success'?resolve():reject(new Error('Clipboard denied'));}));
      vi.stubGlobal('navigator',Object.create(navigator,{clipboard:{value:{writeText},configurable:true}}));
      vi.stubGlobal('fetch',vi.fn(async()=>success({configured:false})));
      mount();const input=screen.getByRole('textbox',{name:'Explore'});
      fireEvent.change(input,{target:{value:'Taiwan teaching'}});
      await act(async()=>{fireEvent.submit(input.closest('form')!);});
      fireEvent.click(screen.getByRole('button',{name:'Copy link to this view'}));
      expect(writeText).toHaveBeenCalledTimes(1);
      if(change==='manual control')fireEvent.click(screen.getByRole('button',{name:'Evidence'}));
      else if(change==='draft edit')fireEvent.change(input,{target:{value:'unfinished question'}});
      else{
        fireEvent.click(screen.getByRole('button',{name:'Clear exploration'}));
        fireEvent.change(input,{target:{value:'Explore Isaac’s career'}});
        await act(async()=>{fireEvent.submit(input.closest('form')!);});
      }
      await act(async()=>{finish();});
      expect(screen.getByRole('button',{name:'Copy link to this view'})).toBeInTheDocument();
      expect(screen.queryByRole('button',{name:'Link copied'})).not.toBeInTheDocument();
      expect(screen.queryByText('Could not copy the link. Check clipboard permissions.')).not.toBeInTheDocument();
      cleanup();
    }
  });

  it("cannot let an older server response replace a newer submitted view", async () => {
    let resolveOld: (data: unknown) => void;
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options?: RequestInit) => {
      if (!options?.body) return success({ configured: false });
      const request = JSON.parse(String(options.body));
      if (request.draft === "Taiwan teaching") return new Promise(resolve => { resolveOld = resolve; });
      return success({ plan: localPlan(request.draft, request.current, [], request.revision) });
    }));
    mount();
    const input = screen.getByRole("textbox", { name: "Explore" });
    fireEvent.change(input, { target: { value: "Taiwan teaching" } });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    fireEvent.change(input, { target: { value: "contact" } });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    await act(async () => { resolveOld!(success({ plan: localPlan("Taiwan teaching", initialPlan(), [], 1) })); });
    expect(screen.getByRole("link", { name: "Email" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Leading AI/ })).not.toBeInTheDocument();
  });

  it("waits for IME completion and submission, and resets only on explicit clear", async () => {
    const fetcher = vi.fn(async () => success({ configured: false }));
    vi.stubGlobal("fetch", fetcher);
    mount();
    const input = screen.getByRole("textbox", { name: "Explore" });
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "contact" } });
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    expect(fetcher).toHaveBeenCalledTimes(1);
    fireEvent.compositionEnd(input);
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    expect(fetcher).toHaveBeenCalledTimes(2);
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.getByRole("link", { name: "Email" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Clear exploration'}));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.queryByRole("link", { name: /Email/ })).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).not.toHaveAttribute('aria-controls');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it("carries the visible projects into a comparison and a detail follow-up", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options?: RequestInit) => {
      if (!options?.body) return success({ configured: false });
      const request = JSON.parse(String(options.body));
      return success({ plan: localPlan(request.draft, request.current, [], request.revision) });
    }));
    mount();
    const input = screen.getByRole("textbox", { name: "Explore" });
    for (const text of ["Compare AI policy and Taiwan teaching", "compare these"]) {
      fireEvent.change(input, { target: { value: text } });
      await act(async () => { fireEvent.submit(input.closest("form")!); });
    }
    expect(screen.getByRole("region", { name: "Project comparison" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Comparison project 1" })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "tell me more about the first" } });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    expect(screen.getByRole("combobox", { name: "Project" })).toBeInTheDocument();
  });
});
