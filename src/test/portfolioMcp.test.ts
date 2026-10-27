import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPortfolioMcpServer, PORTFOLIO_APP_URI } from '../../api/mcp';
import { readPortableView } from '@/lib/portfolioView';
import { TAIWAN_ID } from '@/lib/genui';

describe('portfolio MCP protocol', () => {
  let server: ReturnType<typeof createPortfolioMcpServer>; let client: Client;
  const call = async (args: Parameters<Client['callTool']>[0]) => CallToolResultSchema.parse(await client.callTool(args));
  beforeEach(async () => {
    server = createPortfolioMcpServer(); client = new Client({ name: 'portfolio-test', version: '1' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  });
  afterEach(async () => { await client.close(); await server.close(); });
  it('discovers the app and maintains public tool compatibility', async () => {
    const { tools } = await client.listTools();
    expect(tools.map(tool => tool.name)).toEqual(expect.arrayContaining(['get_profile', 'search_content', 'get_project', 'list_albums', 'get_album', 'create_portfolio_view', 'apply_portfolio_action']));
    expect(tools.find(tool => tool.name === 'create_portfolio_view')?._meta?.ui).toMatchObject({ resourceUri: PORTFOLIO_APP_URI });
    expect((await call({ name: 'get_project', arguments: { id: TAIWAN_ID } })).isError).toBe(false);
    expect((await client.listResources()).resources.map(resource => resource.uri)).toContain(PORTFOLIO_APP_URI);
  });
  it('roundtrips a typed view and returns actionable protocol errors', async () => {
    const result = await call({ name: 'create_portfolio_view', arguments: { modules: [{ kind: 'story', projectIds: [TAIWAN_ID], focus: 'process' }] } });
    expect(result.isError).not.toBe(true);
    const view = readPortableView(result.structuredContent?.view);
    expect(view.composition.blocks[0].layout).toBe('project-process');
    expect(result.structuredContent?.shareUrl).toMatch(/^https:\/\/seiler.page\/#view=/);
    const edited = await call({ name: 'apply_portfolio_action', arguments: { view, action: { type: 'update_module', index: 0, changes: { focus: 'outcomes' } } } });
    expect(readPortableView(edited.structuredContent?.view).composition.blocks[0].focus).toBe('outcomes');
    expect(edited.structuredContent?.basedOn).toBeTruthy();
    expect((await call({ name: 'create_portfolio_view', arguments: { modules: [{ kind: 'story', projectIds: ['unknown'] }] } })).isError).toBe(true);
  });
});
