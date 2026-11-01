import { expect, test } from '@playwright/test';

test.use({ trace: 'retain-on-failure', launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH, timeout: 10000 } : {} });
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
      expect(await page.locator('.home-genui-window').evaluate(el => {
        const panel = el.getBoundingClientRect();
        return [...el.querySelectorAll('button,select,input')].every(control => {
          const rect = control.getBoundingClientRect();
          return rect.width === 0 || rect.left >= panel.left - 1 && rect.right <= panel.right + 1;
        });
      })).toBe(true);
    };
    await page.goto('/');
    const input = page.getByRole('combobox', { name: 'Explore', exact: true });
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
    await page.getByRole('button', { name: 'Clear exploration' }).click();
    await expect(page.locator('.home-genui-stage')).toHaveCount(0);
    await expect(page.locator('.home-genui-window')).not.toHaveClass(/has-results/);
    await contained();
    await input.fill('What did Isaac learn in Taiwan?');
    await input.press('Escape'); await input.press('Enter');
    await expect(page.getByRole('heading', { name: 'AI literacy in Taiwan', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Process', exact: true }).click();
    await page.getByRole('button', { name: 'Outcomes', exact: true }).click();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Process', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await contained();
    // Preference changes apply without a reload.
    await page.emulateMedia({ reducedMotion: reducedMotion === 'reduce' ? 'no-preference' : 'reduce' });
    await page.getByRole('button', { name: 'Clear exploration' }).click();
    await expect(page.locator('.home-genui-stage')).toHaveCount(0);
    await page.getByRole('button', { name: 'Toggle menu', exact: true }).click();
    await page.getByRole('button', { name: 'Work', exact: true }).click();
    await page.waitForURL('**/work');
    await expect(page.locator('.work-grid')).toBeVisible();
    await page.locator('.work-story a').first().focus();
    await expect(page.locator('.work-story-caption').first()).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('photo viewer holds its image, supports rapid navigation, and restores focus', async ({ page }) => {
  await page.goto('/');
  const album = page.getByRole('button', { name: /^Open .* album$/ }).first();
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
