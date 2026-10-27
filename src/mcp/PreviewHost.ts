import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge';
import { readPortableView, viewTitle, type PortableView } from '../lib/portfolioView';

// Development-only host. It exercises the public HTTP transport and official app bridge.
if (!import.meta.env.DEV) throw new Error('The review host is available only in development.');
const status = document.getElementById('status')!;
const context = document.getElementById('context')!;
const iframe = document.getElementById('portfolio') as HTMLIFrameElement;
const theme = document.getElementById('theme') as HTMLSelectElement;
const followup = document.getElementById('followup') as HTMLButtonElement;
const client = new Client({ name: 'portfolio-local-review', version: '1.0.0' });
const call = async (args: Parameters<Client['callTool']>[0]) => CallToolResultSchema.parse(await client.callTool(args));
let current: PortableView;
let updates = 0;
async function start() {
  await client.connect(new StreamableHTTPClientTransport(new URL('/mcp', window.location.origin)));
  const args = { modules: [{ kind: 'story', projectIds: ['fulbright-focus-group-sponsored-by-openai'], focus: 'process' }] };
  const [result, resource] = await Promise.all([
    call({ name: 'create_portfolio_view', arguments: args }),
    client.readResource({ uri: 'ui://portfolio/explorer.html' }),
  ]);
  if (result.isError) throw new Error(JSON.stringify(result.content));
  current = readPortableView(result.structuredContent?.view);
  const bridge = new AppBridge(client, { name: 'Portfolio development host', version: '1.0.0' }, { openLinks: {}, updateModelContext: {} }, { hostContext: { theme: 'light' } });
  bridge.onsizechange = ({ height }) => { if (height) iframe.style.height = `${Math.ceil(height) + 1}px`; };
  bridge.onopenlink = async ({ url }) => { window.open(url, '_blank', 'noopener,noreferrer'); status.textContent = 'Website handoff requested'; return {}; };
  bridge.onupdatemodelcontext = async params => {
    current = readPortableView(params.structuredContent?.view); updates++;
    context.textContent = `Host received ${updates} view update${updates === 1 ? '' : 's'} · ${viewTitle(current)}`;
    return {};
  };
  bridge.oninitialized = () => {
    void (async () => {
      await bridge.sendToolInput({ arguments: args });
      await bridge.sendToolResult(result);
      status.textContent = 'Connected · real MCP result'; followup.disabled = false;
    })().catch(fail);
  };
  theme.addEventListener('change', () => { bridge.setHostContext({ theme: theme.value as 'light' | 'dark' }); document.body.classList.toggle('dark', theme.value === 'dark'); });
  followup.addEventListener('click', () => {
    void (async () => {
      followup.disabled = true;
      const parameters = { view: current, action: { type: 'update_module', index: 0, changes: { focus: 'outcomes' } } };
      await bridge.sendToolInput({ arguments: parameters });
      const next = await call({ name: 'apply_portfolio_action', arguments: parameters });
      await bridge.sendToolResult(next);
      if (!next.isError) current = readPortableView(next.structuredContent?.view);
      status.textContent = 'Follow-up returned through MCP'; followup.disabled = false;
    })().catch(fail);
  });
  await bridge.connect(new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!));
  const html = resource.contents[0];
  if (!('text' in html)) throw new Error('Expected HTML resource');
  // Mirrors the resource allowlist. An opaque sandbox origin isolates the app from the host.
  const policy = "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline' https://api.fontshare.com; img-src data: https://seiler.page https://pub-5f3b061447bb446f9d4529f2affeb05d.r2.dev https://pub-fa8ebd83ba8d4bf99e2e7f12e394fc2f.r2.dev; font-src https://cdn.fontshare.com; base-uri https://seiler.page; connect-src 'none'";
  iframe.srcdoc = html.text.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${policy}">`);
  window.addEventListener('pagehide', () => { void bridge.close(); void client.close(); }, { once: true });
}
function fail(error: unknown) { status.textContent = `Review failed: ${error instanceof Error ? error.message : String(error)}`; }
void start().catch(fail);
