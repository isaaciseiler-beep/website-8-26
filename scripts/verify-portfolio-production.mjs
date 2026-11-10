import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const api=process.env.PORTFOLIO_EVAL_URL||'http://127.0.0.1:8080';
const preview=process.env.PORTFOLIO_PREVIEW_URL||'http://127.0.0.1:4173';
const profile=await fetch(api+'/api/public/profile').then(r=>r.json());
const routed=await fetch(api+'/api/intent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({draft:'What did Isaac learn in Taiwan?',revision:1,contentVersion:profile.contentVersion})}).then(r=>r.json());
const hash=Buffer.from(JSON.stringify({version:1,contentVersion:profile.contentVersion,composition:routed.composition})).toString('base64url');
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH});
try{
 const page=await browser.newPage();page.setDefaultTimeout(15000);
 await page.goto(preview+'/#view='+hash,{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'What I Learned',exact:true}).waitFor();
 assert(await page.getByText(/Second, the program reinforced my belief/).isVisible());
 await page.locator('.canvas-sources>summary').click();
 assert.equal(await page.getByText('Development diagnostics').count(),0);assert.equal(await page.getByText('Adjust view',{exact:true}).count(),0);assert(await page.locator('.canvas-sources a').count()>0);
 await page.goto(preview+'/photos?album=Japan',{waitUntil:'domcontentloaded'});
 const photo=page.getByRole('button',{name:/^Open .* photograph 1$/});await photo.click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 console.log('Production: shared section, both lessons, citations, clean footer and accessible photo viewer passed.');
}finally{await browser.close();}
