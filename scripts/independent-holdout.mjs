import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderedAnswer } from './portfolio-rendering.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=path.join(root,'docs/audits/independent-quality-2026-11-02');
fs.mkdirSync(destination,{recursive:true});
const mode=process.argv.includes('--regression')?'regression':'first-run';
const output=path.join(destination,mode+'.json');
if(mode==='first-run'&&fs.existsSync(output))throw new Error('First-run capture exists. Preserve it; use --regression.');
const fixture=JSON.parse(fs.readFileSync(path.join(root,'evals/independent-holdout-2026-11-02.json'),'utf8'));
const server=await createServer({root,resolve:{alias:{'@':path.join(root,'src')}},esbuild:{jsx:'automatic'},configFile:false,envFile:false,appType:'custom',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},logLevel:'error'});
try{
const canvas=await server.ssrLoadModule('/src/lib/canvas.ts');
const genui=await server.ssrLoadModule('/src/lib/genui.ts');
const components=await server.ssrLoadModule('/src/components/canvas/PortfolioViews.tsx');
const completed=new Map();const rows=[];
for(const [index,test] of fixture.cases.entries()){
 const previous=completed.get(test.follows);
 const plan=genui.resolveCanvasPlan(test.question,canvas.initialPlan(),index+1,previous);
 const guidance=genui.explorationGuidance(test.question,plan);
 const composition=guidance?null:genui.composeLocal(test.question,plan,previous);
 if(composition)completed.set(test.id,composition);
 const rendered=composition?renderedAnswer(components,composition):null;
 const html=composition?renderToStaticMarkup(createElement('main',null,...composition.blocks.map((block,key)=>{
 const Component=block.kind==='story'?components.ProjectStory:block.kind==='comparison'?components.ProjectComparison:block.kind==='timeline'?components.CareerExplorer:null;
 return Component?createElement(Component,{key,block,onChange:()=>{}}):null;
 }))):'';
 fs.writeFileSync(path.join(destination,(mode==='regression'?'regression-':'')+test.id+'.html'),html);
 rows.push({...test,plan,guidance,composition,rendered,valid:composition?Boolean(genui.validateComposition(composition)):null});
}
fs.writeFileSync(output,JSON.stringify({mode,heldOut:mode==='first-run',capturedAt:new Date().toISOString(),contentVersion:canvas.CONTENT_VERSION,fixture,rows},null,2)+'\n');
console.log(rows.map(row=>JSON.stringify({id:row.id,expected:row.project??row.guidance,actual:row.composition?.blocks.map(b=>({kind:b.kind,project:b.projectIds,section:b.section,focus:b.focus})),guidance:row.guidance,words:row.rendered?.text.trim().split(/\s+/).length,links:row.rendered?.linkCount})).join('\n'));
}finally{await server.close();}
