/** Offline inventory/impact analysis of public authored evidence. No inference
 * about outcomes is made from a count or a missing editorial question. */
export function buildContentAudit({matrix,evidence,cases,contentVersion,baseline}) {
  const byProject=matrix.map(project=>({...project,sections:project.sections.map(section=>({...section,
    questions:cases.filter(test=>(test.projectId??test.project)===project.projectId&&(test.section===undefined||test.section===section.index)).map(test=>({id:test.id??`${project.projectId}:section:${test.section}`,question:test.question})),
  }))}));
  const inventory=evidence.map(({id,projectId,sectionId,sectionIndex,kind,text,href})=>({id,projectId,sectionId,sectionIndex,kind,words:text.split(/\s+/).length,...(href?{href}:{})}));
  const ids=new Set(inventory.map(record=>record.id));
  const before=new Set((baseline?.evidence??[]).map(record=>record.id));
  const added=baseline?inventory.filter(record=>!before.has(record.id)):[];
  const removed=(baseline?.evidence??[]).filter(record=>!ids.has(record.id));
  const affectedProjects=[...new Set([...added,...removed].map(record=>record.projectId))];
  const links=[...new Map(inventory.filter(record=>record.kind==='link'&&record.href).map(record=>[record.href,{href:record.href,projectIds:[...new Set(inventory.filter(item=>item.href===record.href).map(item=>item.projectId))]}])).values()];
  return {schemaVersion:1,contentVersion,networkRequests:0,projects:byProject,evidence:inventory,links,
    summary:{projects:matrix.length,sections:matrix.reduce((count,p)=>count+p.sections.length,0),evidence:inventory.length,links:links.length},
    editorialReview:byProject.flatMap(project=>project.sections.filter(section=>!section.questions.length).map(section=>({projectId:project.projectId,section:section.index,heading:section.heading,reason:'No explicit section-targeted evaluation question; review coverage before claiming complete retrieval.'}))),
    impact:baseline?{previousVersion:baseline.contentVersion,added:added.map(record=>record.id),removed:removed.map(record=>record.id),affectedProjects,affectedCases:cases.filter(test=>affectedProjects.includes(test.projectId??test.project)).map(test=>test.id??`${test.projectId??test.project}:section:${test.section}`)}:null,
    claims:'Published evidence inventory and editorial coverage only. Link availability is unverified until an explicit network check; missing prose is not supplied or invented.'};
}
const publicUrl = value => {
  try {const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password&&!/^(localhost|.*\.localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(url.hostname)&&!/^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname)?url:null;}catch{return null;}
};
/** Deliberate opt-in only. HEAD never downloads linked documents or sends local
 * credentials. Redirect destinations receive the same public-host validation. */
export async function checkPublicLink(href,{fetchImpl=fetch,timeoutMs=5000}={}) {
  let url=publicUrl(href);
  if(!url)return {href,status:'not_checked',reason:'non_public_http_url',requests:0};
  let requests=0;
  try {
    for(let redirect=0;redirect<=3;redirect++){
      requests++;
      const response=await fetchImpl(url.href,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(timeoutMs)});
      void response.body?.cancel().catch(()=>{});
      if([301,302,303,307,308].includes(response.status)){
        const location=response.headers.get('location');
        const next=location?publicUrl(new URL(location,url).href):null;
        if(!next)return {href,status:'unverified',reason:'redirect_not_public',requests};
        url=next;continue;
      }
      return {href,status:response.ok?'reachable':[401,403,405,429].includes(response.status)?'unverified':'unavailable',httpStatus:response.status,requests};
    }
    return {href,status:'unverified',reason:'redirect_limit',requests};
  }catch(error){const code=error?.cause?.code;const reason=['ENOTFOUND','EAI_AGAIN','ENETUNREACH','EPERM'].includes(code)?'dns_or_network_unavailable':['TimeoutError','AbortError'].includes(error?.name)?'timeout':'request_failed';return {href,status:'unverified',reason,requests};}
}
