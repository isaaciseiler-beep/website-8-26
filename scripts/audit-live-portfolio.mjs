import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PORTFOLIO_EVAL_URL||'https://seiler.page';
const out=process.env.PORTFOLIO_AUDIT_OUTPUT||'docs/audits/cohesive-2026-10-31/live';
await mkdir(out,{recursive:true});
const profile=await fetch(base+'/api/public/profile').then(r=>r.json());
const cases=[
 ['What are Isaac’s strongest skills?','career'],
 ['Tell me about Isaac’s public service','public-service'],
 ['How did Isaac create the 100 Day Report?','report'],
 ['What did the congressional office accomplish?','office-outcomes'],
 ['What feedback did Isaac give on Study Mode?','study-mode'],
 ['What feedback did Isaac give on Pulse?','pulse'],
 ['What feedback did Isaac give on Atlas?','atlas'],
 ['What feedback did Isaac give on group chats?','group-chats'],
 ['What did Isaac learn in Taiwan?','taiwan-lessons'],
 ['How did educators shape the Taiwan program?','educator-influence'],
 ['What did Isaac discover about local journalism?','journalism-findings'],
 ['Compare Isaac’s AI policy and Taiwan projects','comparison'],
 ['Show me the second one','ordinal'],
 ['Tell me more','more'],
 ['Compare Isaac’s Congress and Boehringer work','comparison-comms'],
 ['Compare Isaac’s OpenAI and journalism work','comparison-research'],
 ['What connects Isaac’s different roles?','career-connections'],
 ['What were the tradeoffs in the Taiwan program?','taiwan-tradeoffs'],
 ['How did Isaac measure whether the Taiwan program worked?','taiwan-measurement'],
 ['Which work best demonstrates Isaac’s leadership?','leadership'],
];
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
const results=[],errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.addInitScript(()=>localStorage.setItem('theme','light'));
 const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);
 page.on('pageerror',e=>errors.push(e.message));
 let events=[];
 page.on('response',async response=>{if(/\/api\/(intent|compose)$/.test(response.url())&&response.request().method()==='POST'){try{events.push({url:new URL(response.url()).pathname,status:response.status(),body:await response.text()});}catch{}}});
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.getByRole('combobox',{name:'Explore',exact:true}).waitFor();
 await page.screenshot({path:out+'/idle.png'});
 for(const [prompt,id] of cases){
  events=[];const start=performance.now();
  const input=page.getByRole('combobox',{name:'Explore',exact:true});
  await input.fill(prompt);await input.press('Escape');await input.press('Enter');
  await page.waitForFunction(()=>!document.querySelector('button[aria-label="Explore"][aria-busy="true"]'),{},{timeout:40000});
  await page.waitForTimeout(150);
  const observed=await page.locator('.home-genui').evaluate(el=>({text:el.innerText,headings:[...el.querySelectorAll('h2,h3')].map(n=>n.textContent),selected:[...el.querySelectorAll('[aria-pressed="true"]')].map(n=>n.textContent),layout:[...el.querySelectorAll('[data-layout]')].map(n=>n.getAttribute('data-layout')),overflow:document.documentElement.scrollWidth>innerWidth}));
  const row={id,prompt,settledMs:Math.round(performance.now()-start),observed,events:[...events]};results.push(row);
  await page.screenshot({path:out+'/'+id+'.png',fullPage:false});console.log(JSON.stringify({id,headings:observed.headings,selected:observed.selected,settledMs:row.settledMs,requests:events.map(e=>({url:e.url,status:e.status}))}));
 }
 for(const theme of ['light','dark'])for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.evaluate(value=>{localStorage.setItem('theme',value);location.reload();},theme);await page.getByRole('combobox',{name:'Explore',exact:true}).waitFor();
  await page.screenshot({path:`${out}/${theme}-${width}-idle.png`});
 }
 await context.close();
}finally{await browser.close();await writeFile(out+'/results.json',JSON.stringify({base,contentVersion:profile.contentVersion,capturedAt:new Date().toISOString(),errors,results},null,2)+'\n');}
