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
  await explore(page).press('Enter');await expect(page.getByRole('region',{name:'Project explorer'})).toBeVisible();
  // One frame: the window is still widening, so separate bounding boxes drift apart.
  const align=await page.evaluate(()=>{
    const field=document.querySelector('#home-explore')!.getBoundingClientRect();
    const status=document.querySelector('.home-request-state')?.getBoundingClientRect();
    const send=[...document.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')==='Explore')!.getBoundingClientRect();
    return {dx:status?Math.abs(field.x-status.x):0,dy:Math.abs(send.bottom-field.bottom),width:field.width};
  });
  expect(align.dx).toBeLessThan(2);
  expect(align.dy).toBeLessThan(6);
  // The history control sits beside Send. At 320 the gutters and those two buttons leave about 150px for the field.
  if(width<=390)expect(align.width).toBeGreaterThanOrEqual(width===320?148:190);
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
  const paragraph=page.locator('.about-display');expect((await paragraph.innerText()).replace(/\s+/g,' ')).toMatch(/across AI\s*▾\s*\.\s*He leads marketing and communications at Summation/);
  await expect(page.locator('.about-article').locator('a,button')).toHaveCount(8);
  const cycle=page.locator('.about-cycle');await cycle.focus();await cycle.press('Enter');await expect(cycle).toHaveAttribute('aria-expanded','true');
  await expect(paragraph).toContainText('AI, public policy, education, research, journalism, and communications');
  await page.keyboard.press('Escape');await expect(cycle).toHaveAttribute('aria-expanded','false');
  await paragraph.evaluate(async el => { await Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished)); });
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(reducedMotion==='reduce')expect(await paragraph.evaluate(el=>el.getAnimations({subtree:true}).length)).toBe(0);
  const before=await paragraph.boundingBox();
  const chip=page.locator('.about-display .about-chip').first();
  await chip.locator('a').focus();
  await expect(chip.locator('.about-preview')).toBeVisible();
  const after=await paragraph.boundingBox();
  expect(Math.abs((after?.height??0)-(before?.height??0))).toBeLessThan(1);
  await page.setViewportSize({width:375,height:812});
  await chip.locator('a').dispatchEvent('pointerdown',{pointerType:'touch',bubbles:true});
  await chip.locator('a').click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(chip).toHaveClass(/is-open/);
});

test('the about display has no leading whitespace or double spaces', async ({ page }) => {
  const paragraph = page.locator('.about-display');
  for (const width of [320, 375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about');
    for (let step = 0; step < 1; step++) {
      const problem = await paragraph.evaluate(el => {
        const text = el.textContent ?? '';
        if (text.includes('  ')) return 'double space in textContent';
        const range = document.createRange();
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const chars: { ch: string; x: number; y: number; w: number }[] = [];
        let node: Node | null;
        while ((node = walker.nextNode())) {
          const parent = node.parentElement;
          if (!parent || parent.closest('[aria-hidden="true"], .sr-only')) continue;
          const value = node.textContent ?? '';
          for (let i = 0; i < value.length; i++) {
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const box = range.getClientRects()[0];
            if (!box || box.width < 0.5) continue;
            chars.push({ ch: value[i], x: box.x, y: box.y, w: box.width });
          }
        }
        const groups = new Map<number, typeof chars>();
        for (const item of chars) {
          const key = Math.round(item.y);
          const existing = [...groups.keys()].find(candidate => Math.abs(candidate - key) <= 2);
          const bucket = existing ?? key;
          groups.set(bucket, [...(groups.get(bucket) ?? []), item]);
        }
        for (const line of groups.values()) {
          line.sort((a, b) => a.x - b.x);
          if (line[0] && /\s/.test(line[0].ch)) return `line box starts with ${JSON.stringify(line[0].ch)}`;
        }
        return '';
      });
      expect(problem, `${width} after ${step}`).toBe('');
      await page.locator('.about-cycle').click();
    }
  }
});

test('the area chip stays one line, shares its line, and has no empty interior', async ({ page }) => {
  const areas = ['AI', 'public policy', 'education', 'research', 'journalism', 'communications'];
  for (const width of [1280, 1024, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/about');
    await expect(page.locator('.about-display')).toBeVisible();
    for (let step = 0; step < 1; step++) {
      const report = await page.evaluate(() => {
        const paragraph = document.querySelector('.about-display') as HTMLElement;
        const chip = paragraph.querySelector('.about-cycle') as HTMLElement;
        const value = chip.querySelector('.about-cycle-value') as HTMLElement;
        const caret = chip.querySelector('.about-cycle-caret') as HTMLElement;
        const line = parseFloat(getComputedStyle(paragraph).lineHeight);
        const chipBox = chip.getBoundingClientRect();
        const valueBox = value.getBoundingClientRect();
        const caretBox = caret.getBoundingClientRect();
        const range = document.createRange();
        const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        let shares = false;
        while ((node = walker.nextNode())) {
          const parent = node.parentElement;
          if (!parent || parent.closest('.about-cycle, [aria-hidden="true"], .sr-only')) continue;
          const text = node.textContent ?? '';
          for (let i = 0; i < text.length; i++) {
            if (!text[i].trim()) continue;
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const box = range.getClientRects()[0];
            if (!box || box.width < 0.5) continue;
            if (Math.abs(box.y - chipBox.y) < line * 0.6) { shares = true; break; }
          }
          if (shares) break;
        }
        return {
          height: chipBox.height,
          limit: line * 1.15,
          slack: chipBox.width - (valueBox.width + caretBox.width),
          shares,
          text: value.textContent,
        };
      });
      expect(report.height, `${width} ${report.text} height`).toBeLessThanOrEqual(report.limit + 1);
      expect(report.slack, `${width} ${report.text} interior`).toBeLessThan(report.limit);
      expect(report.shares, `${width} ${report.text} shares its line`).toBe(true);
      await page.locator('.about-cycle').click();
      await page.waitForTimeout(220);
    }
  }
});

test('no home line is only punctuation', async ({ page }) => {
  for (const width of [320, 375, 414]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto('/');
    const lone = await page.locator('.home-statement').evaluate(el => {
      const range = document.createRange();
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const chars: { ch: string; x: number; y: number }[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const value = node.textContent ?? '';
        for (let i = 0; i < value.length; i++) {
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const box = range.getClientRects()[0];
          if (!box || box.width < 0.5) continue;
          chars.push({ ch: value[i], x: box.x, y: Math.round(box.y) });
        }
      }
      const lines = new Map<number, string[]>();
      for (const item of chars) {
        const key = [...lines.keys()].find(candidate => Math.abs(candidate - item.y) <= 2) ?? item.y;
        lines.set(key, [...(lines.get(key) ?? []), item.ch]);
      }
      for (const line of lines.values()) {
        const visible = line.join('').trim();
        if (visible && /^[\p{P}]+$/u.test(visible)) return visible;
      }
      return '';
    });
    expect(lone, `${width}`).toBe('');
  }
});

test('mono meta uses one sentence case', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/work');
  for (const selector of ['.work-kicker', '.work-index-type', '.work-preview figcaption']) {
    await expect(page.locator(selector).first()).toHaveCSS('text-transform', 'none');
  }
  await page.goto('/projects/artificial-intelligence-in-state-government-index');
  await expect(page.locator('.article-meta')).toHaveCSS('text-transform', 'none');
  await expect(page.locator('.article-meta')).toContainText('Research');
  await expect(page.locator('.article-meta').getByRole('button', { name: 'Work' })).toBeVisible();
  await expect(page.locator('.site-back-arrow')).toHaveCount(0);
});

test('the about paragraph stays inside its measure through a full cycle',async({page})=>{
  await page.goto('/about');
  const paragraph=page.locator('.about-display');
  for(const width of [320,375,768,1280,1920]){
    await page.setViewportSize({width,height:900});
    for(let step=0;step<2;step++){
      const fit=await paragraph.evaluate(el=>el.scrollWidth<=el.clientWidth+1);
      expect(fit,`${width} after ${step}`).toBe(true);
      await page.locator('.about-cycle').click();
    }
  }
});

test('a shorter answer keeps the first body block from jumping up', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Explore', exact: true });
  await input.fill('Compare California and Washington');
  await input.press('Escape');
  await input.press('Enter');
  await expect(page.getByRole('heading', { name: 'Government comparison', exact: true })).toBeVisible();
  const before = await page.locator('.home-genui-stage p').first().boundingBox();
  await input.fill('How can I contact Isaac?');
  await input.press('Enter');
  await expect(page.getByRole('region', { name: 'Contact' })).toBeVisible();
  const samples: number[] = [];
  for (let frame = 0; frame < 5; frame++) {
    samples.push((await page.locator('.portfolio-contact a').first().boundingBox())?.y ?? 0);
    await page.waitForTimeout(40);
  }
  expect(Math.max(...samples) - Math.min(...samples)).toBeLessThan(6);
  expect(samples[0]).toBeGreaterThan((before?.y ?? 0) - 48);
});

test('the skeleton title matches the answer title', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Explore', exact: true });
  await input.fill('Compare California and Washington');
  await input.press('Escape');
  const seen = page.waitForFunction(() => {
    const skeleton = document.querySelector('.home-skeleton-question')?.textContent?.trim();
    const heading = document.querySelector('.home-genui-reveal h2:not(.sr-only)')?.textContent?.trim();
    return skeleton && heading && skeleton === heading ? skeleton : '';
  });
  await input.press('Enter');
  const skeleton = await (await seen).jsonValue();
  const heading = page.getByRole('heading', { name: String(skeleton), exact: true });
  await expect(heading).toBeVisible();
  const first = await heading.boundingBox();
  await page.waitForTimeout(180);
  const second = await heading.boundingBox();
  expect(Math.abs((first?.y ?? 0) - (second?.y ?? 0))).toBeLessThan(2);
  expect(Math.abs((first?.height ?? 0) - (second?.height ?? 0))).toBeLessThan(2);
});

test('work rows use a square thumbnail at 375 and one meta case', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/work');
  const thumb = page.locator('.work-index-thumb').first();
  await expect(thumb).toBeVisible();
  const box = await thumb.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(56);
  expect(box?.width ?? 0).toBeLessThanOrEqual(64);
  expect(Math.abs((box?.width ?? 0) - (box?.height ?? 0))).toBeLessThan(1);
  expect(await page.locator('.work-preview').evaluate(el => el.getBoundingClientRect().height)).toBeLessThan(2);
  const year = (await page.locator('.work-index-year').first().innerText()).trim();
  expect(year).toMatch(/^\d{4}$/);
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator('.work-preview figcaption')).toHaveCSS('text-transform', 'none');
  await expect(page.locator('.work-index-type').first()).toHaveCSS('text-transform', 'none');
});

async function exploreGeometry(page: import('@playwright/test').Page, label: string) {
  const problem = await page.evaluate(() => {
    const header = document.querySelector('.site-home-link')?.getBoundingClientRect();
    const floor = (header?.bottom ?? 56) + 4;
    const hit = (a?: DOMRect, b?: DOMRect) => Boolean(a && b && a.width > 1 && b.width > 1 && a.height > 1 && b.height > 1 && !(a.bottom <= b.top + 1 || a.top >= b.bottom - 1 || a.right <= b.left + 1 || a.left >= b.right - 1));
    if (window.scrollY < 2) {
      for (const el of document.querySelectorAll('.home-genui-composer textarea, .home-submit, .home-history-trigger, .answer-document-meta, .home-history-menu')) {
        const box = el.getBoundingClientRect();
        if (box.width < 2 || box.bottom < floor) continue;
        if (box.top < floor) return `${el.className || el.tagName} sits under the header`;
      }
    }
    const menu = document.querySelector('.home-history-menu')?.getBoundingClientRect();
    const title = document.querySelector<HTMLElement>('.home-genui-composer textarea')?.getBoundingClientRect();
    const heading = [...document.querySelectorAll<HTMLElement>('.home-genui-stage h2:not(.sr-only)')].find(el => el.getBoundingClientRect().height > 8)?.getBoundingClientRect();
    if (hit(menu, title)) return 'history covers the question';
    if (hit(menu, heading)) return 'history covers the answer title';
    if (hit(document.querySelector('.home-submit')?.getBoundingClientRect(), document.querySelector('.home-history-trigger')?.getBoundingClientRect())) return 'history covers send';
    return '';
  });
  expect(problem, label).toBe('');
}

test('explore controls stay clear of the title through the answer states', async ({ page }) => {
  await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
  for (const [width, height] of [[1280, 800], [375, 812]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 0));
    await exploreGeometry(page, `${width} idle`);
    const input = page.getByRole('textbox', { name: 'Explore', exact: true });
    await input.fill('Compare California and Washington');
    await exploreGeometry(page, `${width} typing`);
    await input.press('Escape');
    await input.press('Enter');
    await expect(page.getByRole('heading', { name: 'Government comparison', exact: true })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await exploreGeometry(page, `${width} answered`);
    await expect(page.locator('.home-submit')).toHaveClass(/is-quiet/);
    await page.locator('.canvas-sources summary').first().click();
    await exploreGeometry(page, `${width} sources`);
    await input.fill('How can I contact Isaac?');
    await expect(page.locator('.home-submit')).not.toHaveClass(/is-quiet/);
    await exploreGeometry(page, `${width} follow-up`);
    await input.press('Enter');
    await expect(page.getByRole('region', { name: 'Contact' })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(input).toHaveValue('How can I contact Isaac?');
    await exploreGeometry(page, `${width} second`);
    await page.getByRole('button', { name: /History/ }).click();
    await expect(page.getByRole('menu', { name: 'History' })).toBeVisible();
    await exploreGeometry(page, `${width} history`);
    await expect(page.getByRole('menuitem', { name: 'How can I contact Isaac?' })).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: 'Compare California and Washington' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('menu', { name: 'History' })).toHaveCount(0);
  }
});

test('loading, stopped, and error states stay below the header', async ({ page }) => {
  for (const [width, height] of [[1280, 800], [375, 812]] as const) {
    await page.setViewportSize({ width, height });
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    let release = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route('**/api/compose', async route => {
      if (route.request().method() === 'GET') { await route.fulfill({ json: { configured: true } }); return; }
      await gate;
      if (!route.request().isNavigationRequest()) await route.fulfill({ status: 500, json: {} }).catch(() => {});
    });
    await page.route('**/api/intent', async route => { await gate; await route.fulfill({ status: 503, json: {} }).catch(() => {}); });
    await page.goto('/');
    const input = page.getByRole('textbox', { name: 'Explore', exact: true });
    await input.fill('How did Isaac research AI in government?');
    await input.press('Escape');
    const pending = input.press('Enter');
    await expect(page.getByRole('button', { name: 'Stop updating this view' })).toBeVisible();
    await exploreGeometry(page, `${width} loading`);
    await page.getByRole('button', { name: 'Stop updating this view' }).click();
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    await exploreGeometry(page, `${width} stopped`);
    release();
    await pending.catch(() => {});
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    await page.route('**/api/compose', async route => {
      if (route.request().method() === 'GET') { await route.fulfill({ json: { configured: true } }); return; }
      await route.fulfill({ status: 500, json: {} });
    });
    await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
    await input.fill('Who is Isaac?');
    await input.press('Enter');
    await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await exploreGeometry(page, `${width} error`);
  }
});

test('the history control and send share one center line', async ({ page }) => {
  await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
  for (const [width, height] of [[1280, 800], [375, 812]] as const) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    const input = page.getByRole('textbox', { name: 'Explore', exact: true });
    await input.fill('How can I contact Isaac?');
    await input.press('Escape');
    await input.press('Enter');
    await expect(page.getByRole('region', { name: 'Contact' })).toBeVisible();
    const align = await page.evaluate(() => {
      const clock = document.querySelector('.home-history-trigger')!.getBoundingClientRect();
      const send = document.querySelector('.home-submit')!.getBoundingClientRect();
      return {
        centers: Math.abs((clock.top + clock.height / 2) - (send.top + send.height / 2)),
        gap: send.left - clock.right,
        clock: clock.width,
        send: send.width,
      };
    });
    expect(align.centers, `${width}`).toBeLessThanOrEqual(1);
    expect(align.gap, `${width}`).toBeGreaterThanOrEqual(3);
    expect(align.gap, `${width}`).toBeLessThanOrEqual(5);
    expect(align.clock, `${width}`).toBe(36);
    expect(align.send, `${width}`).toBe(36);
  }
});

test('the expanded areas read as text, not one block', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/about');
  await page.locator('.about-cycle').click();
  const report = await page.locator('.about-display').evaluate(paragraph => {
    const phrase = paragraph.querySelector('.about-cycle-phrase');
    const period = paragraph.querySelector('.about-cycle-period');
    const line = parseFloat(getComputedStyle(paragraph).lineHeight);
    const rects = phrase ? [...phrase.getClientRects()] : [];
    return {
      lead: (phrase?.textContent ?? '').slice(0, 1),
      tall: rects.some(rect => rect.height > line * 1.25),
      periodOutside: Boolean(period && phrase && !phrase.contains(period)),
    };
  });
  expect(report.lead).toBe('A');
  expect(report.tall).toBe(false);
  expect(report.periodOutside).toBe(true);
});

test('the colophon closes the page without covering Explore', async ({ page }) => {
  for (const path of ['/', '/about', '/work', '/projects/artificial-intelligence-in-state-government-index']) {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(path);
    const footer = page.getByRole('contentinfo');
    await expect(footer.getByRole('link', { name: /Say hello/ })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Work', exact: true })).toBeVisible();
    await expect(footer).toContainText('Built with React');
    await expect(footer).toContainText('Satoshi');
    await footer.scrollIntoViewIfNeeded();
    if (path === '/') {
      const overlap = await page.evaluate(() => {
        const card = document.querySelector('.home-genui-window')?.getBoundingClientRect();
        const foot = document.querySelector('.site-colophon')?.getBoundingClientRect();
        if (!card || !foot) return true;
        return !(foot.bottom <= card.top + 1 || foot.top >= card.bottom - 1);
      });
      expect(overlap).toBe(false);
    }
  }
});

test('a work row swaps the anchored preview without moving the index',async({page})=>{
  await page.setViewportSize({width:1280,height:800});
  await page.goto('/work');
  const index=page.locator('.work-index');
  const before=await index.evaluate(el=>el.getBoundingClientRect().height);
  const row=page.locator('.work-index a').nth(2);
  await row.hover();
  await expect(page.locator('.work-preview img.is-current')).toBeVisible();
  expect(await index.evaluate(el=>el.getBoundingClientRect().height)).toBe(before);
  await row.focus();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
