import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    const input=screen.getByRole('combobox',{name:'Explore'});
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
    fireEvent.click(screen.getByRole('button',{name:/Leading AI Literacy Efforts in Taiwan/}));
    expect(screen.getByRole('region',{name:'Project explorer'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Back'}));
    expect(screen.getByRole('region',{name:'Work explorer'})).toBeInTheDocument();
  });

  it('keeps committed results while editing, then handles unknown requests without inherited content', async () => {
    const fetcher=vi.fn(async()=>success({configured:false}));
    vi.stubGlobal('fetch',fetcher);
    mount();
    const input=screen.getByRole('combobox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'AI in state government'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.getByRole('region',{name:'AI benchmark explorer'})).toBeInTheDocument();
    const calls=fetcher.mock.calls.length;
    fireEvent.change(input,{target:{value:'zxq nonsense'}});
    await act(async()=>{vi.advanceTimersByTime(5000);});
    expect(screen.getByRole('region',{name:'AI benchmark explorer'})).toBeInTheDocument();
    expect(screen.getByText('Press Enter to update')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(calls);
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.queryByRole('region',{name:'AI benchmark explorer'})).not.toBeInTheDocument();
    expect(screen.getByText('Try one of these starting points.')).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(calls+1);
    fireEvent.click(screen.getByRole('button',{name:'Back',exact:true}));
    expect(screen.getByRole('region',{name:'AI benchmark explorer'})).toBeInTheDocument();
    expect(input).toHaveValue('AI in state government');
  });

  it('offers starting points when an unfamiliar request cannot be composed',async()=>{
    vi.stubGlobal('fetch',vi.fn(async(url:string)=>{
      if(url==='/api/compose')return new Response(JSON.stringify({type:'unavailable',reason:'rate_limit',revision:1,contentVersion:CONTENT_VERSION})+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
      return success({configured:true,needsComposition:true});
    }));
    mount();
    const input=screen.getByRole('combobox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'An unfamiliar question'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.getByText('Try one of these starting points.')).toBeInTheDocument();
    expect(screen.queryByRole('region',{name:'Work explorer'})).not.toBeInTheDocument();
  });

  it('keeps short benchmark follow-ups in context without another provider call',async()=>{
    const fetcher=vi.fn(async()=>success({configured:false}));
    vi.stubGlobal('fetch',fetcher);mount();
    const input=screen.getByRole('combobox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'AI in state government'}});
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
    const input = screen.getByRole("combobox", { name: "Explore" });
    fireEvent.change(input, { target: { value: "contact" } });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    expect(screen.getByRole("link", { name: /Email/ })).toHaveAttribute("href", expect.stringContaining("mailto:"));
    expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body)).draft).toBe("contact");
    expect(screen.getByRole("region", {name:"Contact"})).toBeInTheDocument();
  });

  it("keeps photo requests in the existing gallery without an AI request",async()=>{
    const fetcher=vi.fn(async()=>success({configured:true}));
    vi.stubGlobal('fetch',fetcher);
    mount();
    const input=screen.getByRole('combobox',{name:'Explore'});
    fireEvent.change(input,{target:{value:'Show Japan photos'}});
    await act(async()=>{fireEvent.submit(input.closest('form')!);});
    expect(screen.queryByText(/Photography lives/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link',{name:'gallery below'})).not.toBeInTheDocument();
    expect(screen.queryByRole('region',{name:'Photo explorer'})).not.toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledTimes(1);
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
    const input = screen.getByRole("combobox", { name: "Explore" });
    fireEvent.change(input, { target: { value: "Taiwan teaching" } });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    fireEvent.change(input, { target: { value: "contact" } });
    await act(async () => { fireEvent.submit(input.closest("form")!); });
    await act(async () => { resolveOld!(success({ plan: localPlan("Taiwan teaching", initialPlan(), [], 1) })); });
    expect(screen.getByRole("link", { name: /Email/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Leading AI/ })).not.toBeInTheDocument();
  });

  it("waits for IME completion and submission, and resets only on explicit clear", async () => {
    const fetcher = vi.fn(async () => success({ configured: false }));
    vi.stubGlobal("fetch", fetcher);
    mount();
    const input = screen.getByRole("combobox", { name: "Explore" });
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
    expect(screen.getByRole("link", { name: /Email/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Clear exploration'}));
    await act(async () => { vi.advanceTimersByTime(1000); });
    expect(screen.queryByRole("link", { name: /Email/ })).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-expanded','false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it("carries the visible projects into a comparison and a detail follow-up", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, options?: RequestInit) => {
      if (!options?.body) return success({ configured: false });
      const request = JSON.parse(String(options.body));
      return success({ plan: localPlan(request.draft, request.current, [], request.revision) });
    }));
    mount();
    const input = screen.getByRole("combobox", { name: "Explore" });
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
