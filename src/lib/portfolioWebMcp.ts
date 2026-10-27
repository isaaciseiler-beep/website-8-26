import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { CONTENT_VERSION } from './canvas.js';
import { portfolioActionSchema, portfolioViewCatalog } from './portfolioView.js';

export type BrowserTool = { name: string; description: string; inputSchema: object; annotations?: object; execute: (input: unknown) => unknown | Promise<unknown> };
export type BrowserToolRegistry = { registerTool: (tool: BrowserTool, options?: { signal?: AbortSignal }) => void | Promise<void>; unregisterTool?: (name: string) => void };
const actionInput = z.object({ action: portfolioActionSchema, expectedRevision: z.number().int().nonnegative(), contentVersion: z.literal(CONTENT_VERSION) }).strict();
const historyInput = z.object({ direction: z.enum(['back', 'forward']), expectedRevision: z.number().int().nonnegative(), contentVersion: z.literal(CONTENT_VERSION) }).strict();
export function registerPortfolioTools(registry: BrowserToolRegistry, controls: {
  inspect: () => unknown;
  apply: (input: z.infer<typeof actionInput>) => unknown;
  travel: (input: z.infer<typeof historyInput>) => unknown;
}) {
  const lifecycle = new AbortController();
  const act = (operation: () => unknown) => {
    try { return operation(); }
    catch (error) { return { isError: true, error: error instanceof Error ? error.message : 'The view could not be changed.', current: controls.inspect() }; }
  };
  const tools: BrowserTool[] = [
    { name: 'get_portfolio_catalog', description: 'Read available published projects, government names, roles, and approved layouts. Photography is browsed separately.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => portfolioViewCatalog() },
    { name: 'get_portfolio_view', description: 'Inspect the committed visible portfolio view, its revision, and a share link. Does not read unsubmitted text.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: controls.inspect },
    { name: 'change_portfolio_view', description: 'Change the visible portfolio using approved modules and controls. Read the current revision first. Cancels pending AI work and supports Back. No external writes.', inputSchema: zodToJsonSchema(actionInput, { $refStrategy: 'none' }), annotations: { readOnlyHint: false, destructiveHint: false }, execute: input => act(() => controls.apply(actionInput.parse(input))) },
    { name: 'navigate_portfolio_history', description: 'Undo or redo a portfolio view change on this page. Read the current revision first.', inputSchema: zodToJsonSchema(historyInput, { $refStrategy: 'none' }), annotations: { readOnlyHint: false, destructiveHint: false }, execute: input => act(() => controls.travel(historyInput.parse(input))) },
  ];
  for (const tool of tools) {
    try { void Promise.resolve(registry.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional enhancement; ordinary controls stay available. */ }
  }
  return () => { lifecycle.abort(); for (const tool of tools) { try { registry.unregisterTool?.(tool.name); } catch { /* Already removed by the signal. */ } } };
}
