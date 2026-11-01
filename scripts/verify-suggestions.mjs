import {chromium,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PORTFOLIO_EVAL_URL||'http://127.0.0.1:8081';
const output=process.env.PORTFOLIO_AUDIT_OUTPUT||'docs/audits/release-2026-10-31/suggestions';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
const results=[];
try{
 for(const theme of ['light','dark'])for(const width of [1440,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await context.addInitScript(theme=>localStorage.setItem('theme',theme),theme);
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{waitUntil:'domcontentloaded'});const input=page.getByRole('combobox',{name:'Explore',exact:true});await input.waitFor();
  let calls=0;page.on('request',request=>{if(/\/api\/(intent|compose)$/.test(request.url())&&request.method()==='POST')calls++;});
  for(const [draft,expected] of [['taiwan lessons','What did Isaac learn in Taiwan?'],['public service','Tell me about Isaac’s public service'],['pulse feedback','What feedback did Isaac give on Pulse?'],['tawian','What did Isaac build in Taiwan?']]){
   await input.fill(draft);await expect(page.getByRole('option').first()).toContainText(expected);await input.press('ArrowDown');await expect(input).toHaveValue(draft);assert(await input.getAttribute('aria-activedescendant'));await input.press('Escape');await expect(input).toHaveAttribute('aria-expanded','false');
   results.push({theme,width,draft,expected,ok:true});
  }
  for(const draft of ['weather in Seattle','Taiwan photos']){await input.fill(draft);await expect(input).toHaveAttribute('aria-expanded','false');await input.press('ArrowDown');assert.equal(await input.getAttribute('aria-activedescendant'),null);}
  assert.equal(calls,0);results.push({theme,width,case:'drafts and keyboard highlighting never call a provider or replace the draft',ok:true});
  await input.fill('taiwan lessons');await input.press('ArrowDown');await input.press('Enter');await page.getByRole('heading',{name:'What I Learned',exact:true}).waitFor();await page.waitForFunction(()=>!document.querySelector('button[aria-label="Explore"][aria-busy="true"]'));await expect(input).toHaveValue('What did Isaac learn in Taiwan?');
  await input.fill('');await expect(page.getByRole('option').first()).toContainText('Taiwan');await input.fill('what did he learn?');await expect(page.getByRole('option').first()).toContainText('What did Isaac learn in Taiwan?');
  await page.screenshot({path:`${output}/${theme}-${width}.png`});await input.press('Tab');await expect(input).toHaveAttribute('aria-expanded','false');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);results.push({theme,width,case:'committed suggestion opens exact evidence; follow-up suggestions retain the visible subject',ok:true});await context.close();
 }
}finally{await browser.close();await writeFile(output+'/results.json',JSON.stringify({base,checks:results.length,results},null,2)+'\n');}
console.log(`Passed ${results.length} suggestion checks.`);
