import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeExplore from '@/components/canvas/HomeExplore';
import { CONTENT_VERSION } from '@/lib/canvas';
import { applyPortfolioAction, decodeView, viewUrl, type PortableView } from '@/lib/portfolioView';
import { POLICY_ID, TAIWAN_ID } from '@/lib/genui';
import type { BrowserTool } from '@/lib/portfolioWebMcp';

const mount = () => render(<MemoryRouter><HomeExplore /></MemoryRouter>);
type Snapshot = { revision: number; view: PortableView; canGoBack: boolean; canGoForward: boolean; shareUrl: string };
describe('website agent and shared-view integration', () => {
  let tools: Map<string, BrowserTool>;
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    tools = new Map();
    Object.defineProperty(document, 'modelContext', { configurable: true, value: { registerTool: (tool: BrowserTool) => tools.set(tool.name, tool), unregisterTool: (name: string) => tools.delete(name) } });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ configured: false }) })));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); delete (document as Document & { modelContext?: unknown }).modelContext; window.history.replaceState({}, '', '/'); });
  const inspect = () => tools.get('get_portfolio_view')!.execute({}) as Snapshot;
  const change = async (action: unknown, expectedRevision = inspect().revision) => {
    let result: unknown;
    await act(async () => { result = tools.get('change_portfolio_view')!.execute({ action, expectedRevision, contentVersion: CONTENT_VERSION }); });
    return result;
  };
  it('restores links without a generation request and shares only the committed state', async () => {
    const view = applyPortfolioAction(null, { type: 'compose', modules: [{ kind: 'benchmark', layout: 'benchmark-compare', states: ['Michigan', 'California'], metric: 'preparednessScore' }] });
    window.history.replaceState({}, '', viewUrl(view, window.location.origin));
    await act(async () => { mount(); });
    expect(screen.getByRole('combobox', { name: 'Benchmark measure' })).toHaveValue('preparednessScore');
    expect(fetch).toHaveBeenCalledTimes(1); // Configuration only, no generation.
    fireEvent.change(screen.getByRole('combobox', { name: 'Explore' }), { target: { value: 'An unfinished private thought' } });
    expect(decodeView(new URL(inspect().shareUrl).hash.slice(6))).toEqual(view);
    expect(JSON.stringify(inspect())).not.toContain('unfinished');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('returns the new rendered state and preserves manual edits against stale actions', async () => {
    await act(async () => { mount(); });
    const result = await change({ type: 'open_project', projectId: TAIWAN_ID, focus: 'process' }) as Snapshot;
    expect(result.revision).toBe(1); expect(result.view.composition.blocks[0].focus).toBe('process');
    expect(screen.getByRole('navigation', { name: 'Project process steps' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Outcomes' }));
    expect(inspect().view.composition.blocks[0].focus).toBe('outcomes');
    expect(await change({ type: 'open_project', projectId: POLICY_ID }, result.revision)).toMatchObject({ isError: true });
    expect(inspect().view.composition.blocks[0].projectIds).toEqual([TAIWAN_ID]);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(inspect().view.composition.blocks[0].focus).toBe('process');
    fireEvent.click(screen.getByRole('button', { name: 'Forward' }));
    expect(inspect().view.composition.blocks[0].focus).toBe('outcomes');
  });
  it('cancels an in-flight provider response when an agent opens a view', async () => {
    let finish: (value: unknown) => void;
    const pending = new Promise(resolve => { finish = resolve; });
    vi.stubGlobal('fetch', vi.fn((url: string) => url === '/api/intent' ? pending : Promise.resolve({ ok: true, json: async () => ({ configured: false }) })));
    await act(async () => { mount(); });
    const input = screen.getByRole('combobox', { name: 'Explore' });
    fireEvent.change(input, { target: { value: 'AI in state government' } });
    await act(async () => { fireEvent.submit(input.closest('form')!); });
    await change({ type: 'open_project', projectId: TAIWAN_ID });
    await act(async () => { finish!({ ok: true, json: async () => ({ guidance: 'unmatched' }) }); });
    expect(screen.getByRole('region', { name: 'Project explorer' })).toBeInTheDocument();
    expect(screen.queryByText('Try one of these starting points.')).not.toBeInTheDocument();
  });
  it('handles invalid shared links and tears down all registered tools', async () => {
    window.history.replaceState({}, '', '/#view=invalid');
    const rendered = mount();
    expect(screen.getByText('This shared view is unavailable. You can start a new exploration.')).toBeInTheDocument();
    expect(inspect().view).toBeNull();
    rendered.unmount(); expect(tools.size).toBe(0);
  });
});
