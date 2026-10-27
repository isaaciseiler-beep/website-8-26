import { records, publicProfile, searchPublic, albums, albumPhotos, CONTENT_VERSION } from "../src/lib/canvas.js";
import type { ApiRequest, ApiResponse } from "../server/http.js";
import { SITE_URL } from "../src/lib/site.js";

export function publicContent(path: string, params = new URLSearchParams()) {
  const limit = Math.min(20,Math.max(1, Number(params.get("limit") ?? 5) || 5));
  const cursor = Math.max(0,Number(params.get("cursor") ?? 0) || 0);
  if (!Number.isInteger(cursor)) return {status:400,data:{error:"Invalid cursor"}};
  const version = { schemaVersion:1,contentVersion:CONTENT_VERSION };
  if (path === "profile") return { status:200,data:{ ...version,...publicProfile } };
  if (path === "content" || path === "search") {
    const query=params.get("q") ?? "";
    if (query.length>500) return {status:400,data:{error:"Search too long"}};
    const type=params.get("type");
    if (type && !["project","album"].includes(type)) return {status:400,data:{error:"Invalid content type"}};
    let results=path === "search" ? searchPublic(query) : records;
    if (type) results=results.filter(r => r.type === type);
    return {status:200,data:{ ...version,items:results.slice(cursor,cursor+limit).map(({body,...r})=>r),nextCursor:cursor+limit<results.length ? String(cursor+limit) : null,total:results.length,filters:{query,type} }};
  }
  if (path === "albums") return {status:200,data:{...version,items:albums.slice(cursor,cursor+limit).map(a=>({id:a.folder,title:a.location,continent:a.continent,count:a.photos.length,cover:albumPhotos(a)[0],canonicalUrl:`${SITE_URL}/?album=${encodeURIComponent(a.folder)}`})),nextCursor:cursor+limit<albums.length?String(cursor+limit):null}};
  if (path.startsWith("albums/")) {
    const album=albums.find(a=>a.folder===path.slice(7));
    if (!album) return {status:404,data:{error:"Unknown album"}};
    return {status:200,data:{...version,id:album.folder,title:album.location,canonicalUrl:`${SITE_URL}/?album=${encodeURIComponent(album.folder)}`,photos:albumPhotos(album).slice(cursor,cursor+limit).map((url,i)=>({id:`${album.folder}-${cursor+i+1}`,url,alt:`${album.location} collection, photograph ${cursor+i+1}`,position:cursor+i+1,date:null,location:null})),nextCursor:cursor+limit<album.photos.length?String(cursor+limit):null,total:album.photos.length}};
  }
  if (path.startsWith("content/")) { const record=records.find(r=>r.id===path.slice(8)); return record ? {status:200,data:{...version,...record}} : {status:404,data:{error:"Unknown content ID"}}; }
  return {status:404,data:{error:"Unknown public route"}};
}
export default function handler(req: ApiRequest,res: ApiResponse) {
  if(req.method !== "GET") {res.statusCode=405;res.setHeader("Allow","GET");res.end();return;}
  const url=new URL(req.url ?? "/", "http://localhost");
  const path=url.searchParams.get("path") ?? decodeURIComponent(url.pathname.replace(/^\/api\/public\/?/,""));
  const result=publicContent(path,url.searchParams);
  res.statusCode=result.status;
  res.setHeader("Content-Type","application/json; charset=utf-8");
  res.setHeader("Cache-Control","public, max-age=60");
  res.setHeader("X-Content-Version",CONTENT_VERSION);
  res.end(JSON.stringify(result.data));
}
export function markdown(path: string) {
  if (path === "/" || path === "/index" || path === "/about") return `# ${publicProfile.name}\n\nCanonical: ${publicProfile.canonicalUrl}\nContent version: ${CONTENT_VERSION}\n\n${publicProfile.summary}\n\n${publicProfile.bio.join("\n\n")}\n\n${Object.entries(publicProfile.links).map(([label,url])=>`[${label}](${url})`).join("\n")}`;
  if (path === "/work") return `# Published work\n\n${records.filter(r=>r.type==="project").map(r=>`## ${r.title}\n\n${r.summary}\n\n[Project](${r.canonicalUrl})`).join("\n\n")}`;
  const id=path.startsWith("/projects/")?path.slice(10):path.startsWith("/photos/")?`album-${path.slice(8)}`:"";
  const record=records.find(r=>r.id===id);
  if(!record) return null;
  return `# ${record.title}\n\nCanonical: ${record.canonicalUrl}\nContent version: ${CONTENT_VERSION}\n\n${record.summary}\n\n${record.body}\n\n${record.sources.map(s=>`[${s.label}](${s.href})`).join("\n")}${record.type === "album" ? `\n\n${albumPhotos(albums.find(a=>`album-${a.folder}`===id)!).map((url,i)=>`[Photograph ${i+1}](${url})`).join("\n")}` : ""}`;
}

export function llmsText() {
  return `# Isaac Seiler — Tech Generalist

> ${publicProfile.summary}

Canonical website: ${SITE_URL}/

## Profile and evidence
- [About Isaac Seiler](${SITE_URL}/about.md): Biography, current role, and experience across fields.
- [Selected work](${SITE_URL}/work.md): Published projects and their primary sources.
- [Public profile JSON](${SITE_URL}/api/public/profile)
- [Agent guide](${SITE_URL}/agents)

## Projects
${records.filter(record => record.type === "project").map(record => `- [${record.title}](${record.canonicalUrl}.md): ${record.summary}`).join("\n")}

## Attribution
The government AI benchmark is an August 2025 snapshot. Teaching examples are illustrative workflows. OpenAI program participation, collaboration, and product feedback are distinct from employment. Project pages link to published evidence.
`;
}
