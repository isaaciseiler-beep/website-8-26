import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { publicContent } from "./public-content.js";
import type { ApiRequest, ApiResponse } from "../server/http.js";
import { applyPortfolioAction, encodeView, moduleSchema, portfolioActionSchema, portfolioViewCatalog, portableViewSchema, readPortableView, viewTitle, viewUrl, type PortableView } from "../src/lib/portfolioView.js";
import { SITE_URL } from "../src/lib/site.js";

export const PORTFOLIO_APP_URI = "ui://portfolio/explorer.html";
const appMeta = { ui: { resourceUri: PORTFOLIO_APP_URI } };
const resourceMeta = { ui: { prefersBorder: false, csp: {
  connectDomains: [],
  resourceDomains: [SITE_URL, "https://api.fontshare.com", "https://cdn.fontshare.com", "https://pub-5f3b061447bb446f9d4529f2affeb05d.r2.dev", "https://pub-fa8ebd83ba8d4bf99e2e7f12e394fc2f.r2.dev"],
  baseUriDomains: [SITE_URL],
} } };
const viewResult = (view: PortableView, basedOn?: string) => ({
  content: [{ type: "text" as const, text: `${viewTitle(view)}. Interactive view: ${viewUrl(view, SITE_URL)}` }],
  structuredContent: { view, shareUrl: viewUrl(view, SITE_URL), ...(basedOn ? { basedOn } : {}) },
});
const failedView = (error: unknown) => ({ content: [{ type: "text" as const, text: error instanceof Error ? error.message : "This view could not be created." }], isError: true });

export function createPortfolioMcpServer() {
  const server=new McpServer({name:"isaac-seiler-public-content",version:"1.0.0"});
  const result=(path:string,params=new URLSearchParams())=>{const value=publicContent(path,params);return {content:[{type:"text" as const,text:JSON.stringify(value.data)}],structuredContent:value.data,isError:value.status>=400};};
  const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
  server.registerTool("get_profile",{description:"Retrieve Isaac Seiler's approved public biography and contact links.",inputSchema:{},annotations},async()=>result("profile"));
  server.registerTool("search_content",{description:"Search published projects and albums using lexical matching. Cite canonical URLs.",inputSchema:{query:z.string().max(500),type:z.enum(["project","album"]).optional(),limit:z.number().int().min(1).max(20).optional(),cursor:z.string().regex(/^\d+$/).optional()},annotations},async({query,type,limit,cursor})=>result("search",new URLSearchParams({q:query,...type?{type}:{},...limit?{limit:String(limit)}:{},...cursor?{cursor}:{}})));
  server.registerTool("get_project",{description:"Retrieve a published project by exact ID/slug, with evidence links.",inputSchema:{id:z.string().max(150)},annotations},async({id})=>result(`content/${id}`));
  server.registerTool("list_albums",{description:"List original photography albums in editorial order.",inputSchema:{limit:z.number().int().min(1).max(20).optional(),cursor:z.string().regex(/^\d+$/).optional()},annotations},async({limit,cursor})=>result("albums",new URLSearchParams({limit:String(limit??5),cursor:cursor??"0"})));
  server.registerTool("get_album",{description:"Retrieve paginated photo URLs from an album. Unknown individual locations and dates remain null.",inputSchema:{id:z.string().max(100),limit:z.number().int().min(1).max(20).optional(),cursor:z.string().regex(/^\d+$/).optional()},annotations},async({id,limit,cursor})=>result(`albums/${id}`,new URLSearchParams({limit:String(limit??5),cursor:cursor??"0"})));
  server.registerTool("get_portfolio_catalog", {
    description: "Discover Isaac's published projects, available interactive layouts, exact IDs and controls. The government benchmark is an August 2025 snapshot. Use this before creating a view. Photography and classroom utilities are not available in interactive views.",
    inputSchema: {}, annotations,
  }, async () => { const catalog = portfolioViewCatalog(); return { content: [{ type: "text", text: JSON.stringify(catalog) }], structuredContent: catalog }; });
  registerAppTool(server, "create_portfolio_view", {
    description: "Open one to three interactive modules about Isaac's work. Use catalog IDs; choose benchmark, story, comparison, timeline, architecture, contact, or collection. Human-authored evidence supplies all facts. Returns an MCP App and a portable website link; it does not modify published content.",
    inputSchema: { modules: z.array(moduleSchema).min(1).max(3) }, annotations, _meta: appMeta,
  }, async ({ modules }) => { try { return viewResult(applyPortfolioAction(null, { type: "compose", modules })); } catch (error) { return failedView(error); } });
  registerAppTool(server, "apply_portfolio_action", {
    description: "Adjust a previously returned portfolio view. Pass the latest view from app context to preserve visitor selections. Add, compare, reorder, remove modules or change known controls. Returns a new view without writing to the website.",
    inputSchema: { view: portableViewSchema, action: portfolioActionSchema }, annotations, _meta: appMeta,
  }, async ({ view, action }) => { try { const current = readPortableView(view); return viewResult(applyPortfolioAction(current, action), encodeView(current)); } catch (error) { return failedView(error); } });
  server.registerResource("Portfolio catalog", "portfolio://catalog", { mimeType: "application/json", description: "Public projects and available interactive view controls." }, async uri => ({ contents: [{ uri: uri.toString(), mimeType: "application/json", text: JSON.stringify(portfolioViewCatalog()) }] }));
  registerAppResource(server, "Interactive portfolio", PORTFOLIO_APP_URI, {
    description: "Interactive exploration of Isaac's published work, using the same components as his website.", _meta: resourceMeta,
  }, async () => ({ contents: [{ uri: PORTFOLIO_APP_URI, mimeType: RESOURCE_MIME_TYPE,
    text: await readFile(path.join(process.cwd(), ".mcp-build/mcp-app.html"), "utf8"), _meta: resourceMeta,
  }] }));
  return server;
}

export default async function handler(req: ApiRequest,res: ApiResponse) {
  if (process.env.MCP_ENABLED === "false") {res.statusCode=503;res.end("MCP disabled");return;}
  if(req.method !== "POST") {res.statusCode=405;res.setHeader("Allow","POST");res.end();return;}
  if (req.headers.origin) {
    try { if (new URL(req.headers.origin).host !== req.headers.host) throw new Error("Untrusted origin"); }
    catch { res.statusCode=403;res.end();return; }
  }
  let body=req.body;
  if (body && Buffer.byteLength(JSON.stringify(body)) > 16384) { res.statusCode=413;res.end();return; }
  if(!body) {const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>16384){res.statusCode=413;res.end();return;}chunks.push(Buffer.from(chunk));}try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{res.statusCode=400;res.end();return;}}
  const server = createPortfolioMcpServer();
  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  res.on("close",()=>{void transport.close();void server.close();});
  try {await server.connect(transport);await transport.handleRequest(req,res,body);}catch{if(!res.headersSent){res.statusCode=500;res.end("MCP request failed");}}
}
