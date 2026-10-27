import fs from 'node:fs';

const base=(process.env.PORTFOLIO_EVAL_URL||'http://127.0.0.1:8080').replace(/\/$/,'');
const cases=JSON.parse(fs.readFileSync(new URL('../evals/portfolio-cases.json',import.meta.url),'utf8')).slice(0,Number(process.env.PORTFOLIO_EVAL_LIMIT)||Infinity);
const requireLive=process.env.PORTFOLIO_REQUIRE_LIVE==='1';
const compose=process.env.PORTFOLIO_EVAL_COMPOSE==='1';
const interval=Number(process.env.PORTFOLIO_EVAL_INTERVAL_MS??1100);
const composeLimit=Number(process.env.PORTFOLIO_EVAL_COMPOSE_LIMIT??1);
const content=await fetch(base+'/api/public/profile').then(response=>response.json());
if(!content.contentVersion)throw new Error('No public content version at this deployment');
const results=[];
function matches(test,block){return Boolean(block&&block.kind===test.kind&&(!test.project||block.projectIds.includes(test.project))&&(!test.projects||JSON.stringify(block.projectIds)===JSON.stringify(test.projects))&&(!test.states||JSON.stringify(block.states)===JSON.stringify(test.states))&&(!test.focus||block.focus===test.focus)&&(!test.roleId||block.roleId===test.roleId));}
for(const [index,test] of cases.entries()){
  if(index>0&&interval>0)await new Promise(resolve=>setTimeout(resolve,interval));
  const started=performance.now();
  try{
    const response=await fetch(base+'/api/intent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:test.question,revision:index+1,contentVersion:content.contentVersion})});
    const routed=await response.json();
    const ok=response.ok&&(test.guidance?routed.guidance===test.guidance:matches(test,routed.composition?.blocks?.[0]));
    const row={id:test.id,ok,router:routed.plan?.source,reason:routed.reason,guidance:routed.guidance,layout:routed.composition?.blocks?.[0]?.layout,focus:routed.composition?.blocks?.[0]?.focus,requestId:routed.requestId,routing:routed.routing};
    if(requireLive&&!test.guidance&&routed.plan?.source!=='jev')row.ok=false;
    if(compose&&test.kind&&index<composeLimit){
      const generated=await fetch(base+'/api/compose',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({draft:test.question,revision:index+1,contentVersion:content.contentVersion,current:routed.composition,proposed:routed.composition})});
      const text=await generated.text();
      const events=text.trim().split('\n').filter(Boolean).map(line=>JSON.parse(line));
      const last=events.findLast(event=>event.type==='composition'&&!event.partial);
      row.composer=last?.model;row.compositionOk=Boolean(last&&matches(test,last.composition.blocks[0]));row.compositionReason=events.find(event=>event.type==='unavailable')?.reason;
      if(!row.compositionOk)row.ok=false;
    }
    results.push({...row,ms:Math.round(performance.now()-started)});
  }catch(error){results.push({id:test.id,ok:false,error:error instanceof Error?error.message:String(error)});}
}
const summary={base,contentVersion:content.contentVersion,cases:results.length,passed:results.filter(row=>row.ok).length,liveRouting:results.filter(row=>row.router==='jev').length,liveComposition:results.filter(row=>row.composer).length,results};
console.log(JSON.stringify(summary,null,2));
if(summary.passed!==summary.cases)process.exitCode=1;
