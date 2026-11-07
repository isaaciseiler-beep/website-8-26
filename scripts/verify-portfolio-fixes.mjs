import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.PORTFOLIO_EVAL_URL||'http://127.0.0.1:8080';
const output=process.env.PORTFOLIO_AUDIT_OUTPUT||'docs/audits/fixes-2026-10-31';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
const results=[];
const cases=[
 ['What are Isaac’s strongest skills?','Strengths across the work'],
 ['Tell me about Isaac’s public service','Public service'],
 ['How did Isaac create the 100 Day Report?','Making the first 100 days measurable'],
 ['What did the congressional office accomplish?','Making the first 100 days measurable'],
 ['What feedback did Isaac give on Study Mode?','Study Mode: making ChatGPT teach, not answer'],
 ['What feedback did Isaac give on Pulse?','Pulse: when ChatGPT starts the conversation'],
 ['What feedback did Isaac give on Atlas?','Atlas: rethinking the browser'],
 ['What feedback did Isaac give on group chats?','Group Chats: learning when AI should speak'],
 ['What did Isaac learn in Taiwan?','What I Learned'],
 ['What did Isaac discover about local journalism?','Research themes & outputs'],
 ['Which work best demonstrates Isaac’s leadership?','Leadership in practice'],
 ['What were the tradeoffs in the Taiwan program?','Building a Program Where People Learned From Each Other'],
 ['How did Isaac measure whether the Taiwan program worked?','What I Learned'],
 ['What does Isaac do well?','Strengths across the work'],
 ['Compare Isaac’s AI policy and Taiwan projects','Contributions, side by side'],
];
try{
 for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  await context.addInitScript(value=>localStorage.setItem('theme',value),theme);
  const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  async function contained(){
   const sizes=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,escaped:[...document.querySelectorAll('.canvas-modules button,.canvas-modules select,.canvas-modules input')].filter(el=>el.getBoundingClientRect().width&&getComputedStyle(el).visibility!=='hidden').filter(el=>{for(let parent=el.parentElement;parent&&!parent.classList.contains('home-genui-window');parent=parent.parentElement){if(['auto','scroll','hidden'].includes(getComputedStyle(parent).overflowX))return false;}const b=el.getBoundingClientRect(),p=document.querySelector('.home-genui-window').getBoundingClientRect();return b.left<p.left-1||b.right>p.right+1;}).map(el=>el.getAttribute('aria-label')||el.textContent)}));
   assert(sizes.scroll<=sizes.width,JSON.stringify(sizes));assert.deepEqual(sizes.escaped,[]);
  }
  async function submit(prompt){
   const input=page.getByRole('textbox',{name:'Explore',exact:true});
   await input.fill(prompt);await input.press('Escape');
   const response=page.waitForResponse(r=>r.url().endsWith('/api/intent')&&r.request().method()==='POST');
   await input.press('Enter');
   const routing=await (await response).json();
   assert.equal(routing.reason,'unconfigured','This check expects local authored routing; use the live evaluation script for configured providers.');
   await page.getByRole('button',{name:'Explore',exact:true}).waitFor();
   await page.waitForFunction(()=>!document.querySelector('button[aria-label="Explore"][aria-busy="true"]'));
   return routing;
  }
  for(const width of [1440,390,320]){
   await page.setViewportSize({width,height:width===320?740:1000});
   await page.goto(base,{waitUntil:'domcontentloaded'});await page.getByRole('textbox',{name:'Explore',exact:true}).waitFor();await contained();
   await page.screenshot({path:`${output}/${theme}-${width}-idle.png`});
   results.push({theme,width,case:'idle',ok:true});
   for(const [prompt,heading] of cases){
    await submit(prompt);await page.getByRole('heading',{name:heading,exact:true}).waitFor();await contained();
    if(prompt==='What did Isaac learn in Taiwan?')assert(await page.getByText(/Second, the program reinforced my belief/).isVisible());
    if(prompt.includes('measure whether'))assert(await page.getByText(/does not report pre\/post assessment scores/).isVisible());
    results.push({theme,width,prompt,ok:true});
   }
   await page.screenshot({path:`${output}/${theme}-${width}-comparison.png`});
   await submit('Show me the second one');
   await page.getByRole('heading',{name:'AI literacy in Taiwan',exact:true}).waitFor();
   await submit('Tell me more');
   await page.getByRole('button',{name:'Process',exact:true}).getAttribute('aria-pressed').then(value=>assert.equal(value,'true'));
   await contained();await page.screenshot({path:`${output}/${theme}-${width}-taiwan.png`});
   results.push({theme,width,case:'second-project-and-more',ok:true});
   await page.getByRole('button',{name:'Clear exploration'}).click();
   await page.getByRole('textbox',{name:'Explore',exact:true}).fill('Japan photos');
   await page.getByRole('textbox',{name:'Explore',exact:true}).press('Escape');
   let requests=0;const count=req=>{if(/\/api\/(intent|compose)$/.test(req.url()))requests++;};
   page.on('request',count);await page.getByRole('textbox',{name:'Explore',exact:true}).press('Enter');
   await page.waitForTimeout(150);page.off('request',count);assert.equal(requests,0);
   results.push({theme,width,case:'photo-request-no-provider',ok:true});
  }
  await page.goto(base+'/?album=Japan',{waitUntil:'domcontentloaded'});await contained();
  await page.goto(base+'/photos/map',{waitUntil:'domcontentloaded'});await page.locator('#photo-globe').waitFor();
  results.push({theme,case:'album-and-photo-globe',ok:true});
  assert.deepEqual(errors,[]);await context.close();
 }
}finally{await writeFile(`${output}/browser-results.json`,JSON.stringify({base,mode:'local authored routing; providers unconfigured',checks:results.length,results},null,2)+'\n');await browser.close();}
console.log(`Passed ${results.length} browser checks.`);
