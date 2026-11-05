import { expect, test } from '@playwright/test';

async function localOnly(page: import('@playwright/test').Page) {
  await page.route('**/api/compose', route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent', route=>route.fulfill({status:503,json:{}}));
}
const explore=(page: import('@playwright/test').Page)=>page.getByRole('textbox',{name:'Explore',exact:true});
async function ask(page: import('@playwright/test').Page,text:string){
  await explore(page).fill(text);await explore(page).press('Escape');await explore(page).press('Enter');
  await expect(page.getByRole('button',{name:'Stop updating this view'})).toHaveCount(0);
  await expect.poll(()=>new URL(page.url()).searchParams.get('q')).toBe(text);
}

test('committed questions survive browser Back, Forward, reload and Share',async({page,context})=>{
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await localOnly(page);await page.goto('/');
  await ask(page,'Who is Isaac?');await expect(page.getByRole('region',{name:'Role explorer'})).toBeVisible();
  await ask(page,'Taiwan teaching');await expect(page.getByRole('region',{name:'Project explorer'})).toBeVisible();
  await page.goBack();await expect(explore(page)).toHaveValue('Who is Isaac?');await expect(page.getByRole('region',{name:'Role explorer'})).toBeVisible();
  await page.goForward();await expect(explore(page)).toHaveValue('Taiwan teaching');
  await page.reload();await expect(explore(page)).toHaveValue('Taiwan teaching');await expect(page.getByRole('region',{name:'Project explorer'})).toBeVisible();
  await page.getByRole('button',{name:'Process',exact:true}).click();await page.reload();await expect(page.getByRole('button',{name:'Process',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Copy link to this view'}).click();
  const shared=await page.evaluate(()=>navigator.clipboard.readText());
  await page.goto(shared);await expect(explore(page)).toHaveValue('Taiwan teaching');
  await page.goBack();
});

test('first browser Back returns from an exploration to the empty composer',async({page})=>{
  await localOnly(page);await page.goto('/');await ask(page,'Who is Isaac?');
  await page.goBack();await expect(explore(page)).toHaveValue('');await expect(page.locator('.home-genui-stage')).toHaveCount(0);
});

test('pointer refocus replaces the committed question; Escape dismisses then clears',async({page})=>{
  await localOnly(page);await page.goto('/');await ask(page,'Who is Isaac?');
  await page.getByRole('button',{name:'Copy link to this view'}).focus();
  await explore(page).click();await explore(page).pressSequentially('Taiwan teaching');
  await expect(explore(page)).toHaveValue('Taiwan teaching');
  await explore(page).press('Escape');await expect(page.getByRole('region',{name:'Role explorer'})).toBeVisible();
  await explore(page).press('Escape');await expect(explore(page)).toHaveValue('');await expect(explore(page)).toBeFocused();
});

for(const width of [320,375,390,768,1024,1280])test(`stationary composer, readable mobile field, no fast-typing loop at ${width}`,async({page})=>{
  await page.setViewportSize({width,height:900});await localOnly(page);await page.goto('/');
  const errors:string[]=[];page.on('console',msg=>{if(/Maximum update depth|ResizeObserver loop/.test(msg.text()))errors.push(msg.text());});page.on('pageerror',error=>errors.push(error.message));
  const question='How did Isaac help educators in Taiwan develop practical AI literacy and use AI tools thoughtfully in their classrooms?';
  await explore(page).pressSequentially(question,{delay:0});await explore(page).press('Escape');
  await expect.poll(()=>explore(page).evaluate(el=>el.getBoundingClientRect().height)).toBeGreaterThan(60);
  await expect.poll(async()=>Math.abs((await explore(page).boundingBox())!.height-await page.locator('.home-question-measure').evaluate(el=>Math.max(42,Math.min(160,el.getBoundingClientRect().height))))).toBeLessThan(.5);
  const before=(await explore(page).boundingBox())!;
  await explore(page).press('Enter');await expect(page.getByRole('region',{name:'Project explorer'})).toBeVisible();
  await expect.poll(async()=>Math.abs((await explore(page).boundingBox())!.width-before.width)).toBeLessThan(1);
  await expect.poll(async()=>Math.abs((await explore(page).boundingBox())!.x-before.x)).toBeLessThan(1);
  await expect.poll(async()=>Math.abs((await explore(page).boundingBox())!.height-before.height)).toBeLessThan(1);
  if(width<=390)expect((await explore(page).boundingBox())!.width).toBeGreaterThanOrEqual(240);
  expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('intent timeout is announced in the retained status slot',async({page})=>{
  await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
  await page.route('**/api/intent',async route=>{await new Promise(resolve=>setTimeout(resolve,8000));await route.fulfill({json:{}}).catch(()=>{});});
  await page.goto('/');await explore(page).fill('What was the color of Isaac’s first bicycle?');await explore(page).press('Escape');await explore(page).press('Enter');
  const slot=page.locator('.home-request-state');await expect(slot).toContainText('Finding projects',{timeout:5000});
  await expect(slot).toContainText('Couldn’t match that, so here are starting points.',{timeout:8000});
  await expect(page.getByRole('status').filter({hasText:'Couldn’t match that'})).toBeVisible();
});

test('search arrow selection navigates to the chosen result and shortcut opens search',async({page})=>{
  await page.goto('/');await page.keyboard.press('Control+k');
  const input=page.getByRole('combobox',{name:'Search query'});await expect(input).toBeFocused();await input.fill('taiwan');
  const options=page.getByRole('listbox',{name:'Matching pages'}).getByRole('option');await expect(options.first()).toBeVisible();
  await input.press('ArrowDown');await expect(options.nth(0)).toHaveAttribute('aria-selected','true');
  await input.press('ArrowDown');await expect(options.nth(1)).toHaveAttribute('aria-selected','true');
  const href=await options.nth(1).getAttribute('href');await expect(input).toHaveAttribute('aria-activedescendant',await options.nth(1).getAttribute('id') as string);
  await input.press('Enter');await expect(page).toHaveURL(new URL(href!,page.url()).href);
});

test('skip link and header precede the gallery; sidebar targets and outside dismissal work',async({page})=>{
  await page.goto('/');await page.locator('h1').evaluate((el:HTMLElement)=>el.blur());await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'IIS home'})).toBeFocused();
  await page.getByRole('button',{name:'Toggle menu'}).click();const nav=page.locator('[data-site-overlay="sidebar"]');
  for(const label of ['Email','GitHub','LinkedIn','Light']){const target=nav.getByRole(label==='Light'?'radio':'button',{name:label,exact:true});expect((await target.boundingBox())!.height).toBeGreaterThanOrEqual(44);}
  await page.locator('main').click({position:{x:500,y:100}});await expect(nav).toHaveAttribute('aria-hidden','true');
  await page.getByRole('button',{name:'Toggle menu'}).click();await nav.getByRole('link',{name:'Writing',exact:true}).click();await expect(page.getByRole('heading',{name:'Writing',exact:true})).toBeFocused();await expect(nav).toHaveAttribute('aria-hidden','true');
});

test('a photo question opens gallery destinations and does not call a model',async({page})=>{
  let posts=0;
  await page.route('**/api/**',route=>{if(route.request().method()==='POST')posts+=1;return route.fulfill({json:{configured:false}});});
  await page.goto('/');
  await explore(page).fill('Show me photos from Japan');
  await explore(page).press('Enter');
  const photos=page.getByRole('region',{name:'Photographs'});
  await expect(photos).toBeVisible();
  await expect(photos.getByRole('link',{name:'Japan',exact:true})).toHaveAttribute('href','/?album=Japan');
  await expect(photos.getByRole('link',{name:'Photo Map',exact:true})).toHaveAttribute('href','/photos/map');
  expect(posts).toBe(0);
  await expect.poll(()=>new URL(page.url()).searchParams.get('q')).toBe('Show me photos from Japan');
});

test('odd album ends in a pair and mobile lightbox has wide frame and stable end controls',async({page})=>{
  await page.setViewportSize({width:375,height:812});await page.goto('/?album=Iceland');await expect(page).toHaveTitle('Iceland · Photos · Isaac Seiler');
  const last=page.locator('.album-photo-row').last();await expect(last.locator('> *')).toHaveCount(2);await expect(last.getByRole('link',{name:/Back to albums/})).toBeVisible();
  await page.locator('.album-photo-tile').first().click();const dialog=page.getByRole('dialog',{name:/Iceland.*Photograph 1 of/i});await expect(dialog).toBeVisible();
  await expect(page.getByRole('button',{name:'Previous photograph'})).toBeDisabled();expect((await page.locator('.photo-preview-stage').boundingBox())!.width).toBe(343);
  await expect(page.locator('.photo-preview-image').first()).toHaveAttribute('alt',/Iceland, photograph 1 of/);
  await page.getByRole('button',{name:'Next photograph'}).click();await expect(page.getByRole('button',{name:'Previous photograph'})).toBeEnabled();
  const stage=page.locator('.photo-preview-stage');
  const box=await stage.boundingBox();
  if(!box)throw new Error('The photograph stage has no box');
  await page.mouse.move(box.x+box.width*0.7, box.y+box.height/2);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*0.2, box.y+box.height/2, {steps:10});
  await page.mouse.up();
  await expect(page.getByRole('dialog',{name:/photograph 3 of/i})).toBeVisible();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});

for(const reducedMotion of ['reduce','no-preference'] as const)test(`About keeps its copy and supports cycling at narrow widths: ${reducedMotion}`,async({page})=>{
  await page.emulateMedia({reducedMotion});await page.setViewportSize({width:320,height:900});await page.goto('/about');
  const paragraph=page.locator('.about-display');expect((await paragraph.innerText()).replace(/\s+/g,' ')).toBe('Isaac Seiler is a Seattle-based tech generalist with experience across AI, public policy, education, research, journalism, and communications. He leads marketing and communications at Summation and has worked across government, enterprise, and international education.');
  await expect(page.locator('.about-article').locator('a,button')).toHaveCount(8);
  const cycle=page.locator('.about-cycle');await cycle.focus();await cycle.press('Enter');await expect(page.getByRole('button',{name:'public policy. Show next'})).toBeFocused();await cycle.press('Shift+Enter');await expect(cycle).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(reducedMotion==='reduce')expect(await paragraph.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
});
