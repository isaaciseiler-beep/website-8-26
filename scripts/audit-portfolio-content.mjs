import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {portfolioSectionQuestions} from '../evals/portfolio-section-cases.mjs';
import {portfolioSmokeQuestions} from '../evals/portfolio-smoke-cases.mjs';
import {portfolioReleaseQuestions} from '../evals/portfolio-release-cases.mjs';
import {buildContentAudit,checkPublicLink} from './portfolio-content-audit.mjs';
async function main(){
  const args=process.argv.slice(2);
  if(args.includes('--help')){console.log('Offline public content inventory: node scripts/audit-portfolio-content.mjs [--output=/path/report.json] [--baseline=/path/prior.json]\nOptional --check-links [--link-limit=20] makes bounded HEAD requests to published source links only; no model calls.');return;}
  const options={linkLimit:20};
  for(const arg of args){if(arg==='--check-links')options.links=true;else if(arg.startsWith('--link-limit=')){options.linkLimit=Number(arg.slice(13));if(!Number.isSafeInteger(options.linkLimit)||options.linkLimit<0||options.linkLimit>50)throw new Error('Link limit must be an integer between 0 and 50.');}else if(arg.startsWith('--output='))options.output=arg.slice(9);else if(arg.startsWith('--baseline='))options.baseline=arg.slice(11);else throw new Error('Unknown argument; use --help.');}
  const root=fileURLToPath(new URL('../',import.meta.url));
  const server=await createServer({root,configFile:false,envFile:false,appType:'custom',server:{middlewareMode:true,hmr:false,ws:false},optimizeDeps:{noDiscovery:true,include:[]},logLevel:'error'});
  try{
    const registry=await server.ssrLoadModule('/src/lib/portfolioEvidenceRegistry.ts');
    const canvas=await server.ssrLoadModule('/src/lib/canvas.ts');
    const report=buildContentAudit({matrix:registry.portfolioCoverageMatrix,evidence:registry.portfolioEvidenceRegistry,cases:[...portfolioSectionQuestions,...portfolioSmokeQuestions,...portfolioReleaseQuestions],contentVersion:canvas.CONTENT_VERSION,baseline:options.baseline?JSON.parse(fs.readFileSync(path.resolve(options.baseline),'utf8')):undefined});
    if(options.links){report.linkChecks=[];for(let index=0;index<Math.min(report.links.length,options.linkLimit);index+=2){const batch=report.links.slice(index,Math.min(index+2,options.linkLimit));report.linkChecks.push(...await Promise.all(batch.map(link=>checkPublicLink(link.href))));}report.uncheckedLinkCount=report.links.length-report.linkChecks.length;report.networkRequests=report.linkChecks.reduce((sum,item)=>sum+item.requests,0);}
    const text=JSON.stringify({capturedAt:new Date().toISOString(),...report},null,2)+'\n';
    if(options.output){const destination=path.resolve(options.output);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,text);}
    console.log(text);
  }finally{await server.close();}
}
main().catch(error=>{console.error(`Content audit: ${error instanceof Error?error.message:'failed'}`);process.exitCode=1;});
