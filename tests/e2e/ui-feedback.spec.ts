import { expect, test } from '@playwright/test';

test('typing after an answer replaces the committed question and follow-up keeps the answer', async ({ page }) => {
  await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Explore', exact: true });
  await input.fill('Who is Isaac?');
  await input.press('Enter');
  await expect(page.getByRole('region', { name: 'Role explorer' })).toBeVisible();
  await input.pressSequentially('What projects involved AI?');
  await expect(input).toHaveValue('What projects involved AI?');
  await page.getByRole('button', { name: 'Ask a follow-up' }).click();
  await expect(input).toHaveValue('');
  await expect(input).toBeFocused();
  await expect(page.getByRole('region', { name: 'Role explorer' })).toBeVisible();
});

test('finishing refinement keeps the answer at the same vertical position', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/intent', async route => {
    const request = route.request().postDataJSON();
    await route.fulfill({ json: { composerConfigured: true, plan: { ...request.current, layout: 'detail', projectIds: ['fulbright-focus-group-sponsored-by-openai'], albumIds: [], source: 'local', revision: request.revision, contentVersion: request.contentVersion } } });
  });
  await page.route('**/api/compose', async route => {
    if (route.request().method() === 'GET') { await route.fulfill({ json: { configured: true } }); return; }
    const request = route.request().postDataJSON();
    await gate;
    await route.fulfill({ contentType: 'application/x-ndjson', body: JSON.stringify({ type: 'composition', composition: request.proposed, revision: request.revision, contentVersion: request.contentVersion, partial: false }) + '\n' }).catch(() => {});
  });
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Explore', exact: true });
  await input.fill('Taiwan teaching');
  await input.press('Enter');
  try {
    await expect(page.getByRole('button', { name: 'Stop updating this view' })).toBeVisible();
    await expect(page.locator('.home-submit-spinner')).toHaveCount(0);
    await expect.poll(() => page.locator('.home-genui-window').evaluate(el => Math.abs(el.getBoundingClientRect().width - Math.min(1120, el.parentElement!.clientWidth)))).toBeLessThan(2);
    const top = (await page.locator('.home-genui-stage').boundingBox())!.y;
    release();
    await expect(page.getByRole('button', { name: 'Stop updating this view' })).toHaveCount(0);
    await expect(page.locator('.home-request-state')).toHaveCount(1);
    await expect.poll(async () => Math.abs((await page.locator('.home-genui-stage').boundingBox())!.y - top)).toBeLessThan(2);
  } finally { release(); }
});

for (const width of [320, 1280]) {
  test(`search overlays the page, deduplicates destinations, and restores focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const before = await page.locator('main').boundingBox();
    const trigger = page.getByRole('button', { name: 'Search', exact: true });
    await trigger.click();
    const query = page.getByRole('combobox', { name: 'Search query' });
    await query.fill('taiwan');
    await expect(query).toHaveCSS('text-align', 'left');
    const results = page.getByRole('region', { name: 'Search results' });
    await expect(results.getByRole('option', { name: 'Leading AI Literacy Efforts in Taiwan' })).toHaveCount(1);
    await expect.poll(async () => (await page.locator('main').boundingBox())!.width).toBe(before!.width);
    await query.press('Shift+Tab');
    await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toContainText('Taiwan');
    expect(await page.evaluate(() => Boolean(document.activeElement?.closest('[data-site-overlay="search"]')))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Search', exact: true })).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('the mobile video play icon and title occupy separate space', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/projects/openai-product-testing-and-feedback');
  const video = page.getByRole('link', { name: 'Play Introducing ChatGPT Atlas', exact: true });
  const title = await video.locator('span.block').boundingBox();
  const play = await video.locator('svg:visible').first().boundingBox();
  expect(title).not.toBeNull();
  expect(play).not.toBeNull();
  expect(play!.x + play!.width).toBeLessThan(title!.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a narrow Work page loads a prepared image size and the local Satoshi face', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/work');
  const image = page.locator('.work-story-image img').first();
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  expect(await image.evaluate((el: HTMLImageElement) => el.currentSrc)).toContain('/project-images/responsive/aiindex-480.jpg');
  expect(await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('16px Satoshi'); })).toBe(true);
  expect(await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name).some(name => name.includes('/fonts/Satoshi-')))).toBe(true);
});
