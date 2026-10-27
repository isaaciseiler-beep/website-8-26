import { describe, expect, it, vi } from 'vitest';
import { CONTENT_VERSION } from '@/lib/canvas';
import { registerPortfolioTools, type BrowserTool } from '@/lib/portfolioWebMcp';

describe('browser portfolio tools', () => {
  it('registers a public catalog and guarded actions and removes them on teardown', async () => {
    const tools = new Map<string, BrowserTool>(); const signals: AbortSignal[] = [];
    const registry = { registerTool: (tool: BrowserTool, options: { signal?: AbortSignal }) => { tools.set(tool.name, tool); signals.push(options.signal!); }, unregisterTool: (name: string) => { tools.delete(name); } };
    const apply = vi.fn(() => ({ revision: 5 }));
    const cleanup = registerPortfolioTools(registry, { inspect: () => ({ revision: 4, view: null }), apply, travel: vi.fn() });
    expect(tools.size).toBe(4);
    expect(await tools.get('get_portfolio_view')!.execute({})).toEqual({ revision: 4, view: null });
    const action = { action: { type: 'compose', modules: [{ kind: 'contact' }] }, expectedRevision: 4, contentVersion: CONTENT_VERSION };
    expect(await tools.get('change_portfolio_view')!.execute(action)).toEqual({ revision: 5 });
    expect(tools.get('change_portfolio_view')!.execute({ ...action, contentVersion: 'old' })).toMatchObject({ isError: true });
    expect(tools.get('change_portfolio_view')!.execute({ ...action, expectedRevision: undefined })).toMatchObject({ isError: true });
    expect(apply).toHaveBeenCalledTimes(1);
    const catalog = JSON.stringify(await tools.get('get_portfolio_catalog')!.execute({}));
    expect(catalog).toContain('August 2025'); expect(catalog).not.toContain('photo-focus');
    cleanup(); expect(tools.size).toBe(0); expect(signals.every(signal => signal.aborted)).toBe(true);
  });
});
