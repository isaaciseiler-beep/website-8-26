import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { publicContent } from "./public-content.js";
import type { ApiRequest, ApiResponse } from "../server/http.js";

export default async function handler(req: ApiRequest,res: ApiResponse) {
  if (process.env.MCP_ENABLED === "false") {res.statusCode=503;res.end("MCP disabled");return;}
  if(req.method !== "POST") {res.statusCode=405;res.setHeader("Allow","POST");res.end();return;}
  if(req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) {res.statusCode=403;res.end();return;}
  let body=req.body;
  if(!body) {const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=Buffer.byteLength(chunk);if(size>16384){res.statusCode=413;res.end();return;}chunks.push(Buffer.from(chunk));}try{body=JSON.parse(Buffer.concat(chunks).toString());}catch{res.statusCode=400;res.end();return;}}
  const server=new McpServer({name:"isaac-seiler-public-content",version:"0.1.0"});
  const result=(path:string,params=new URLSearchParams())=>{const value=publicContent(path,params);return {content:[{type:"text" as const,text:JSON.stringify(value.data)}],structuredContent:value.data,isError:value.status>=400};};
  const annotations={readOnlyHint:true,destructiveHint:false,idempotentHint:true,openWorldHint:false};
  server.registerTool("get_profile",{description:"Retrieve Isaac Seiler's approved public biography and contact links.",inputSchema:{},annotations},async()=>result("profile"));
  server.registerTool("search_content",{description:"Search published projects and albums using lexical matching. Cite canonical URLs.",inputSchema:{query:z.string().max(500),type:z.enum(["project","album"]).optional(),limit:z.number().int().min(1).max(20).optional(),cursor:z.string().regex(/^\d+$/).optional()},annotations},async({query,type,limit,cursor})=>result("search",new URLSearchParams({q:query,...type?{type}:{},...limit?{limit:String(limit)}:{},...cursor?{cursor}:{}})));
  server.registerTool("get_project",{description:"Retrieve a published project by exact ID/slug, with evidence links.",inputSchema:{id:z.string().max(150)},annotations},async({id})=>result(`content/${id}`));
  server.registerTool("list_albums",{description:"List original photography albums in editorial order.",inputSchema:{limit:z.number().int().min(1).max(20).optional(),cursor:z.string().regex(/^\d+$/).optional()},annotations},async({limit,cursor})=>result("albums",new URLSearchParams({limit:String(limit??5),cursor:cursor??"0"})));
  server.registerTool("get_album",{description:"Retrieve paginated photo URLs from an album. Unknown individual locations and dates remain null.",inputSchema:{id:z.string().max(100),limit:z.number().int().min(1).max(20).optional(),cursor:z.string().regex(/^\d+$/).optional()},annotations},async({id,limit,cursor})=>result(`albums/${id}`,new URLSearchParams({limit:String(limit??5),cursor:cursor??"0"})));
  const transport=new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  res.on("close",()=>{void transport.close();void server.close();});
  try {await server.connect(transport);await transport.handleRequest(req,res,body);}catch{if(!res.headersSent){res.statusCode=500;res.end("MCP request failed");}}
}
