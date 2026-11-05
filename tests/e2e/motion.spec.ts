import { expect, test } from '@playwright/test';

test.use({ trace: 'retain-on-failure' });
test.describe.configure({mode:'parallel'});
for (const theme of ['light', 'dark']) for (const width of [320, 1440]) for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`${theme} ${width} ${reducedMotion}: motion lifecycle`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    // Deliberately exercise authored UI; these are not live provider-health checks.
    await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
    await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    const contained = async () => {
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      // Destination-width content is deliberately clipped while the shell opens.
      // Containment is a settled-state assertion, not an intermediate-frame invariant.
      await expect.poll(() => page.locator('.home-genui-window').evaluate(el => {
        const panel = el.getBoundingClientRect();
        return [...el.querySelectorAll('button,select,input,textarea')].every(control => {
          const rect = control.getBoundingClientRect();
          return rect.width === 0 || rect.left >= panel.left - 1 && rect.right <= panel.right + 1;
        });
      })).toBe(true);
    };
    await page.goto('/');
    const input = page.getByRole('textbox', { name: 'Explore', exact: true });
    await expect(input).toBeVisible();
    await expect(page.locator('.home-window-depth')).toHaveCSS('opacity', '0');
    await contained();
    await page.screenshot({ path: info.outputPath('idle.png') });
    await input.fill('Compare California and Washington');
    await input.press('Escape');
    const frames = page.evaluate(async () => {
      const intervals: number[] = [];
      let previous = performance.now();
      for (let i = 0; i < 40; i++) await new Promise<void>(resolve => requestAnimationFrame(now => { intervals.push(now - previous); previous = now; resolve(); }));
      return intervals.slice(1);
    });
    await input.press('Enter');
    await expect(page.getByRole('heading', { name: 'Government comparison', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explore', exact: true })).not.toHaveAttribute('aria-busy', 'true');
    await contained();
    await info.attach('expansion-frame-intervals', { body: JSON.stringify(await frames), contentType: 'application/json' });
    await page.screenshot({ path: info.outputPath('comparison.png') });
    await page.getByRole('combobox', { name: 'Benchmark measure' }).selectOption('preparednessScore');
    await expect(page.getByRole('article', { name: 'California score' })).toContainText('75.0');
    await page.getByRole('button', { name: 'Start over' }).click();
    if(reducedMotion==='no-preference') {
      await expect(page.locator('.home-genui-reveal')).toHaveAttribute('aria-hidden','true');
      await expect(page.locator('.home-genui-reveal')).toHaveAttribute('inert','');
      await expect(page.locator('.home-genui-window')).toHaveClass(/has-results/);
    }
    await expect(page.locator('.home-genui-stage')).toHaveCount(0);
    await expect(page.locator('.home-genui-window')).not.toHaveClass(/has-results/);
    await contained();
    await input.fill('What did Isaac learn in Taiwan?');
    await input.press('Escape'); await input.press('Enter');
    await expect(page.getByRole('heading', { name: 'AI literacy in Taiwan', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Process', exact: true }).click();
    await page.getByRole('button', { name: 'Outcomes', exact: true }).click();
    await page.setViewportSize({ width: width === 320 ? 375 : 1280, height: 900 });
    await expect(page.getByRole('button', { name: 'Outcomes', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => page.locator('.home-genui-reveal').evaluate(el => {
      const content=el.querySelector('.home-genui-reveal-content');
      return content ? Math.abs(el.getBoundingClientRect().height-content.getBoundingClientRect().height) : Infinity;
    })).toBeLessThan(2);
    await contained();
    // Preference changes apply without a reload.
    await page.emulateMedia({ reducedMotion: reducedMotion === 'reduce' ? 'no-preference' : 'reduce' });
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.locator('.home-genui-stage')).toHaveCount(0);
    await page.getByRole('button', { name: 'Toggle menu', exact: true }).click();
    await page.getByRole('link', { name: 'Work', exact: true }).or(page.getByRole('button', { name: 'Work', exact: true })).click();
    await page.waitForURL('**/work');
    await expect(page.locator('.work-index')).toBeVisible();
    await page.keyboard.press('Tab');
    const row = page.locator('.work-index a').nth(1);
    const before = await page.locator('.work-index').evaluate(el => el.getBoundingClientRect().height);
    await row.focus();
    await expect(page.locator('.work-preview img')).toBeVisible();
    expect(await page.locator('.work-index').evaluate(el => el.getBoundingClientRect().height)).toBe(before);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('photo viewer holds its image, supports rapid navigation, and restores focus', async ({ page }) => {
  await page.goto('/');
  const album = page.getByRole('link', { name: /^Open .* album$/ }).or(page.getByRole('button', { name: /^Open .* album$/ })).first();
  await album.click();
  const photo = page.getByRole('button', { name: /^Open .* photograph 1$/ });
  await photo.click();
  await expect(page.locator('.photo-preview-image')).toBeVisible();
  await page.getByRole('button', { name: 'Next photograph', exact: true }).click();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('heading', { name: /Photograph 3 of/ })).toBeVisible();
  await expect(page.locator('.photo-preview-stage')).toHaveAttribute('aria-busy', 'false');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(photo).toBeFocused();
});


for(const width of [390,1440])for(const reducedMotion of ['no-preference','reduce'] as const){
  test(`${width} ${reducedMotion}: changing screenshot shapes never stretches their pixels`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.emulateMedia({reducedMotion});
    await page.route('**/api/compose',route=>route.fulfill({json:{configured:false}}));
    await page.route('**/api/intent',route=>route.fulfill({status:503,json:{}}));
    // Fixed image dimensions isolate motion from remote asset availability.
    for(const [pattern,height] of [['**/chat-lab/OpenAI_StudyMode_Flow_*.png',1080],['**/chat-lab/pulse1.webp',1920]] as const){
      await page.route(pattern,route=>route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="${height}"><rect width="1920" height="${height}" fill="white"/></svg>`}));
    }
    await page.goto('/');
    const input=page.getByRole('textbox',{name:'Explore',exact:true});
    await input.fill('What feedback did Isaac give on Study Mode?');await input.press('Escape');await input.press('Enter');
    await expect(page.getByRole('combobox',{name:'Lab work to explore'})).toHaveValue('2');
    await expect.poll(()=>page.locator('.portfolio-project-image').evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
    for(const section of ['4','2']){
      const [frames]=await Promise.all([
        page.evaluate(async()=>{
          const frames:{src:string;distortion:number}[]=[];
          for(let index=0;index<40;index++){
            await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
            const image=document.querySelector<HTMLImageElement>('.portfolio-project-image')!;
            const anchor=image.closest('a')!;
            const scale=new DOMMatrixReadOnly(getComputedStyle(anchor).transform);
            if(image.naturalWidth&&Number(getComputedStyle(image).opacity)>.5)frames.push({src:image.currentSrc,distortion:Math.abs(scale.a/scale.d-1)});
          }
          return frames;
        }),
        page.getByRole('combobox',{name:'Lab work to explore'}).selectOption(section),
      ]);
      expect(frames.some(frame=>section==='4'?frame.src.includes('pulse1'):frame.src.includes('StudyMode'))).toBe(true);
      expect(Math.max(...frames.map(frame=>frame.distortion))).toBeLessThan(.02);
    }
  });
}
