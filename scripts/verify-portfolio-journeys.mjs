import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PORTFOLIO_EVAL_URL||'http://127.0.0.1:8080';
const out=process.env.PORTFOLIO_AUDIT_OUTPUT||'docs/audits/cohesive-2026-10-31/journeys';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
const results=[];
try{
 for(const theme of ['light','dark'])for(const width of [1440,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
  await context.addInitScript(value=>localStorage.setItem('theme',value),theme);
  const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(20000);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const record=name=>{results.push({theme,width,name,ok:true});console.log(`${theme} ${width}: ${name}`);};
  const contained=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.goto(base,{waitUntil:'domcontentloaded'});const input=page.getByRole('textbox',{name:'Explore',exact:true});await input.waitFor();
  await page.getByRole('button',{name:'Toggle menu',exact:true}).click();await page.getByRole('button',{name:'Work',exact:true}).click();await page.waitForURL('**/work');await contained();
  const project=page.locator('.work-story a').first();const href=await project.getAttribute('href');await project.focus();
  await expect(project.locator('.work-story-caption')).toHaveCSS('opacity','1');
  await project.press('Enter');await page.waitForURL('**'+href);await contained();record('menu → Work → keyboard project opening');
  await page.goto(base,{waitUntil:'domcontentloaded'});
  const album=page.getByRole('button',{name:/^Open .* album$/}).first();await album.scrollIntoViewIfNeeded();await album.click();await page.getByRole('button',{name:'All photos',exact:true}).waitFor();
  const photo=page.getByRole('button',{name:/^Open .* photograph 1$/});await photo.click();
  const modal=page.getByRole('dialog');
  if(await modal.count()){
    await modal.waitFor();
    await page.getByRole('button',{name:'Next photograph',exact:true}).click();await page.getByRole('heading',{name:/Photograph 2 of/}).waitFor();
    for(let index=0;index<5;index++){await page.keyboard.press('Tab');assert(await modal.evaluate(el=>el.contains(document.activeElement)));}
    await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});await expect(photo).toBeFocused();record('album → modal → next → Escape → focus restored');
  }else{
    results.push({theme,width,name:'photo viewer has modal semantics and named controls',ok:false,detail:'No accessible dialog exposed by the live viewer.'});
    await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');await expect(photo).toBeVisible();record('legacy album viewer opens and keyboard Escape closes');
  }
  await page.getByRole('button',{name:'All photos',exact:true}).click();await input.waitFor();await contained();
  await input.fill('What did Isaac learn in Taiwan?');await input.press('Escape');await input.press('Enter');await page.waitForFunction(()=>!document.querySelector('button[aria-label="Explore"][aria-busy="true"]'));
  await page.getByRole('button',{name:'Process',exact:true}).click();await page.getByRole('button',{name:'Outcomes',exact:true}).click();
  await page.getByRole('button',{name:'Back',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Process',exact:true}).getAttribute('aria-pressed'),'true');
  await page.getByRole('button',{name:'Forward',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Outcomes',exact:true}).getAttribute('aria-pressed'),'true');record('Explore local controls → Back → Forward');
  await input.fill('An unfinished draft');await input.press('Escape');assert(await page.getByRole('heading',{name:'AI literacy in Taiwan',exact:true}).isVisible());record('draft preserves committed answer');
  await page.getByRole('button',{name:'Clear exploration',exact:true}).click();await page.locator('.home-genui-stage').waitFor({state:'hidden'});await page.waitForFunction(()=>!document.querySelector('.home-genui-window.has-results'));
  await contained();await page.screenshot({path:`${out}/${theme}-${width}-cleared.png`});record('normal-motion Clear folds without overflow');
  assert.deepEqual(errors,[]);await context.close();
 }
}finally{await browser.close();await writeFile(out+'/results.json',JSON.stringify({base,checks:results.length,results},null,2)+'\n');}

if(results.some(result=>!result.ok))process.exitCode=1;
