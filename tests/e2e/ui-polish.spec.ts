import { expect, test } from '@playwright/test';

for (const width of [320, 1280]) test(`${width}: modal keyboard loops and Escape restore their opener`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/photos?album=Korea');
  if (width === 320) {
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Search query' })).toBeFocused();
    for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab']) {
      await page.keyboard.press(key);
      expect(await page.getByRole('dialog', { name: 'Search', exact: true }).evaluate(el => el.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeFocused();
  }
  const tile = page.locator('.album-photo-tile').first();
  await tile.click();
  const viewer = page.getByRole('dialog', { name: /Photograph \d+ of/ });
  await expect(viewer).toBeVisible();
  for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab', 'Tab']) {
    await page.keyboard.press(key);
    expect(await viewer.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(viewer).toHaveCount(0);
  await expect(tile).toBeFocused();
});

for (const theme of ['light', 'dark']) test(`${theme}: text spacing overrides retain readable controls at 320px`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(value => localStorage.setItem('theme', value), theme);
  await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  await expect(page.getByRole('banner').getByRole('link', { name: 'IIS home' })).toBeVisible();
  await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
  const input = page.getByRole('textbox', { name: 'Explore', exact: true });
  for (const question of ['how to explore', 'Compare California and Michigan', 'Taiwan teaching']) {
    await input.fill(question); await input.press('Escape'); await input.press('Enter');
    await expect(page.locator('#home-exploration-results')).toBeVisible();
    await expect.poll(() => page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      clipped: [...document.querySelectorAll<HTMLElement>('.home-genui button,.home-genui select,.home-guide-starters span')]
        .filter(el => !el.closest('[aria-hidden="true"]') && el.clientWidth > 0 && el.getBoundingClientRect().height > 0)
        .filter(el => el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2)
        .map(el => el.getAttribute('aria-label') || el.textContent),
    }))).toEqual({ overflow: false, clipped: [] });
  }
});

for (const theme of ['light', 'dark']) for (const width of [320, 1280]) {
  test(`${theme} ${width}: utilities, feedback, empty results and Search remain readable`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
    await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
    await page.goto('/');
    const input = page.getByRole('textbox', { name: 'Explore', exact: true });
    await input.fill('Compare Michigan and California');
    await input.press('Escape'); await input.press('Enter');
    const share = page.getByRole('button', { name: 'Copy link to this view' });
    const feedback = page.getByText('Feedback', { selector: 'summary', exact: true });
    await expect(share).toBeVisible();
    const a = (await share.boundingBox())!, b = (await feedback.boundingBox())!;
    expect(Math.abs(a.y + a.height / 2 - b.y - b.height / 2)).toBeLessThan(2);
    await feedback.click();
    await expect(page.getByLabel('What could be better?')).toBeVisible();
    const detail = page.getByLabel('What did you expect?');
    await detail.fill('I expected more detail about the research process.');
    await expect(page.getByRole('link', { name: 'Email this feedback' })).toHaveAttribute('href', /I%20expected%20more%20detail/);
    const reason = await page.getByLabel('What could be better?').boundingBox();
    const field = await detail.boundingBox();
    expect(reason!.width).toBeGreaterThan(200);
    expect(field!.width).toBeCloseTo(reason!.width, 0);
    await page.goto('/');
    await input.fill('Explore all projects'); await input.press('Escape'); await input.press('Enter');
    await page.getByRole('searchbox', { name: 'Find a project' }).fill('zzzxxyy');
    await expect(page.getByText('No matching projects.', { exact: true })).toBeVisible();
    const empty = await page.locator('.portfolio-empty-state').boundingBox();
    const grid = await page.locator('.canvas-project-list').boundingBox();
    expect(Math.abs(empty!.width - grid!.width)).toBeLessThan(2);
    await page.getByRole('button', { name: 'Clear search', exact: true }).click();
    await expect(page.getByRole('searchbox', { name: 'Find a project' })).toBeFocused();
    await expect(page.getByText('No matching projects.', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search query' }).fill('zzzxxyy');
    await expect(page.getByText('No matches', { exact: true })).toBeVisible();
    await expect(page.getByText('Try a project, topic, or location.', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('a first photograph communicates loading and recovers from an unavailable image', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/photos?album=Korea');
  const first = page.locator('.album-photo-tile').first();
  const src = await first.locator('img').getAttribute('src');
  expect(src).toBeTruthy();
  // Reload with this image held before the browser can warm its cache.
  let release!: () => void;
  const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route(url => url.pathname === new URL(src!, page.url()).pathname, async route => {
    await waiting; await route.abort('failed');
  });
  await page.reload();
  try {
    // Album order is shuffled per load, so open the same held source by its image.
    const held = page.locator('.album-photo-tile').filter({ has: page.locator(`img[src=${JSON.stringify(src)}]`) });
    await held.click();
    await expect(page.getByText('Loading photograph…', { exact: true })).toBeVisible();
    const status = page.getByRole('status');
    await expect(status).toHaveText('Loading photograph…');
    await status.evaluate(el => { el.dataset.photoStatus = 'persistent'; });
    expect(await status.evaluate(el => Boolean(el.closest('[aria-busy="true"]')))).toBe(false);
    release();
    await expect(page.getByText('This photograph could not load. Try another photograph.', { exact: true })).toBeVisible();
    await expect(status).toHaveAttribute('data-photo-status', 'persistent');
    await page.getByRole('button', { name: 'Close photograph' }).click();
    await expect(held).toBeFocused();
  } finally { release(); }
});

for (const width of [320, 1280]) test(`${width}: history unfolds on the full reading edge`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
  await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/');
  const input = page.getByRole('textbox', { name: 'Explore', exact: true });
  for (const question of ['Taiwan teaching', 'Boehringer rebrand', 'How can I contact Isaac?']) {
    await input.fill(question); await input.press('Escape'); await input.press('Enter');
  }
  await page.getByText('History', { selector: 'summary', exact: true }).click();
  const history = page.locator('.home-journey-history');
  const bounds = (await history.boundingBox())!, footer = (await page.locator('.home-genui-footer').boundingBox())!;
  expect(Math.abs(bounds.width - footer.width)).toBeLessThan(2);
  await history.getByRole('button').filter({ hasText: 'Taiwan teaching' }).click();
  await expect(page.getByRole('heading', { name: 'AI literacy in Taiwan', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
