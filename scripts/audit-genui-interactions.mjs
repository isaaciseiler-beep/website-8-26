import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
// Authored UI only: every intent/composition request is intercepted below.
const out=process.env.PORTFOLIO_AUDIT_OUTPUT||'docs/audits/genui-stress';
const base=process.env.PORTFOLIO_EVAL_URL||'http://127.0.0.1:8080';
const duration=Number(process.env.PORTFOLIO_STRESS_DURATION_MS||60000);
if(!Number.isSafeInteger(duration)||duration<1000||duration>3600000)throw new Error('PORTFOLIO_STRESS_DURATION_MS must be 1000–3600000.');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
let page;const started=Date.now();const errors=[];const samples=[];let operations=0;
const prompts=['Explore all projects','Tell me about the ChatGPT Lab','Compare AI policy and teaching in Taiwan','Rank governments by AI preparedness','What connects Isaac’s work across fields?','Explore Isaac’s career','How does this website work?','What did Isaac learn in Taiwan?','Compare California and Washington'];
try {
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 await context.addInitScript(()=>localStorage.setItem('theme','light'));
 page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
 await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
 await page.goto(base);
 const input=page.getByRole('combobox',{name:'Explore',exact:true});await input.waitFor();
 async function settled(label){
  await page.mouse.move(0,0);
  await page.waitForTimeout(900);
  const observation=await page.evaluate(()=>{
   const root=document.querySelector('.home-genui');const panel=root.querySelector('.home-genui-window').getBoundingClientRect();
   const visible=e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&!e.closest('details:not([open]),[inert],[aria-hidden="true"]');};
   // Offscreen lazy images may intentionally have no pixels yet. A late
   // decoded image may also be in its bounded arrival fade, not stranded.
   const pendingImages=[...root.querySelectorAll('img')].filter(e=>!e.complete||!e.naturalWidth).length;
   const faded=[...root.querySelectorAll('p,img')].filter(visible).filter(e=>!(e instanceof HTMLImageElement)||e.complete&&e.naturalWidth>0&&!e.getAnimations().some(a=>a.playState==='running')).filter(e=>Number(getComputedStyle(e).opacity)<.99).map(e=>(e.textContent||e.getAttribute('alt')||'image').slice(0,50));
   const labelOverflow=[...root.querySelectorAll('.portfolio-tab-label')].filter(visible).filter(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return a.left<b.left-.5||a.right>b.right+.5;}).map(e=>e.textContent);
   const groups=[...root.querySelectorAll('.portfolio-tabs')].filter(visible).map(e=>({selected:e.querySelectorAll('button[aria-pressed="true"]').length,markers:e.querySelectorAll('.portfolio-tab-indicator').length}));
   const escaped=[...root.querySelectorAll('button,select,input')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left<panel.left-1||r.right>panel.right+1;}).map(e=>e.getAttribute('aria-label')||e.textContent);
   return {labelOverflow,pendingImages,width:innerWidth,scroll:document.documentElement.scrollWidth,faded,groups,escaped,animations:root.getAnimations({subtree:true}).filter(a=>a.playState==='running').length,heap:performance.memory?.usedJSHeapSize};
  });
  samples.push({seconds:Math.round((Date.now()-started)/1000),label,...observation});
  assert(observation.scroll<=observation.width,JSON.stringify(observation));
  assert.deepEqual(observation.labelOverflow,[],label);assert.deepEqual(observation.faded,[],label);assert.deepEqual(observation.escaped,[],label);
  assert(observation.groups.every(g=>g.selected===1&&g.markers===1),label);
  assert.equal(errors.length,0,errors.join('\n'));
 }
 for(let cycle=0;Date.now()-started<duration;cycle++){
  await page.setViewportSize({width:[320,390,1280][cycle%3],height:[568,844,900][cycle%3]});operations++;
  await page.emulateMedia({reducedMotion:cycle%2?'reduce':'no-preference'});operations++;
  for(let i=0;i<prompts.length;i++){
   const prompt=prompts[(i+cycle)%prompts.length];
   await input.fill(prompt);await input.press('Escape');await input.press('Enter');operations++;
   await page.locator('.home-genui-stage').waitFor();
   if(await page.getByRole('searchbox',{name:'Find a project',exact:true}).count()){
    const filter=page.getByRole('searchbox',{name:'Find a project',exact:true});
    for(const value of ['Tai','AI','Taiwan','']){await filter.fill(value);await page.waitForTimeout(45);operations++;}
    await filter.fill('Taiwan');await page.waitForTimeout(300);
    await page.getByRole('button',{name:'Leading AI Literacy Efforts in Taiwan',exact:true}).click();operations++;
    await page.waitForTimeout(100);
    await page.getByRole('button',{name:'Back to projects',exact:true}).click();operations++;
   }
   const groups=page.locator('.portfolio-tabs');
   for(let group=0;group<await groups.count();group++){
    const buttons=groups.nth(group).locator('button');const total=await buttons.count();
    for(const index of [total-1,1,0])if(index>=0&&index<total){await buttons.nth(index).click({force:true});operations++;await page.waitForTimeout(35);}
   }
   if(await page.getByRole('combobox',{name:'Lab work to explore'}).count()){
    await page.getByRole('combobox',{name:'Lab work to explore'}).selectOption('4');operations++;
   }
   const further=page.locator('.home-next-questions>summary');
   if((i+cycle)%3===0&&await further.count()){
    await further.click();await page.waitForTimeout(45);await further.click();await page.waitForTimeout(45);await further.click();operations+=3;
   }
   await settled(`cycle-${cycle}-prompt-${i}`);
   // Exercise a state replacement before the clear fold completes.
   if(i===2){await page.getByRole('button',{name:'Clear exploration',exact:true}).click();await input.fill('Taiwan teaching');await input.press('Escape');await input.press('Enter');operations+=2;await settled(`cycle-${cycle}-clear-reverse`);}
   if(i===5){await page.getByRole('button',{name:'Clear exploration',exact:true}).click();const undo=page.getByRole('button',{name:'Undo clear',exact:true});await undo.waitFor({timeout:5000});await undo.click();operations+=2;await settled(`cycle-${cycle}-undo`);}
  }
  if(cycle%3===0)console.log(JSON.stringify({cycle,operations,seconds:Math.round((Date.now()-started)/1000),errors:errors.length}));
 }
 await writeFile(`${out}/stress-results.json`,JSON.stringify({started:new Date(started).toISOString(),elapsedSeconds:Math.round((Date.now()-started)/1000),operations,errors,samples},null,2));
 console.log(JSON.stringify({passed:true,operations,samples:samples.length,elapsedSeconds:Math.round((Date.now()-started)/1000)}));
}catch(error){if(page){await page.screenshot({path:`${out}/stress-failure.png`});await writeFile(`${out}/stress-failure-text.txt`,await page.locator('body').innerText());}await writeFile(`${out}/stress-failure.json`,JSON.stringify({error:String(error),operations,errors,samples},null,2));throw error;}finally{await browser.close();}
