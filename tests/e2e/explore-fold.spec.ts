import { expect, test } from '@playwright/test';

test.use({ launchOptions: process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {} });

for (const theme of ['light', 'dark']) for (const width of [375, 749, 1440]) for (const reducedMotion of ['reduce', 'no-preference'] as const) {
  test(`${theme} ${width} ${reducedMotion}: suggestion handoff and Clear fold`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion });
    await page.addInitScript(value => localStorage.setItem('theme', value), theme);
    // Authored UI motion, independent of provider latency or live availability.
    await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
    await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
    await page.goto('/');
    await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))));
    const input = page.getByRole('textbox', { name: 'Explore', exact: true });
    await input.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect.poll(() => page.locator('.experience-autocomplete').evaluate(el => Math.abs(el.getBoundingClientRect().height - el.scrollHeight))).toBeLessThan(1);
    const top = (await input.boundingBox())!.y;
    const surfaceTop = (await page.locator('.home-window-surface').boundingBox())!.y;
    await page.getByRole('option').filter({ hasText: 'Taiwan' }).first().click();
    // Sample the rendered geometry, rather than only checking the final preset.
    const opening = await page.evaluate(async () => {
      const frames: { top: number; resultTop: number; opacity: number; overflow: boolean; surfaceTop: number }[] = [];
      const start = performance.now();
      do {
        const reveal = document.querySelector<HTMLElement>('.home-genui-reveal')!;
        frames.push({ top: document.querySelector('#home-explore')!.getBoundingClientRect().top,
          resultTop: reveal.getBoundingClientRect().top, opacity: Number(getComputedStyle(reveal).opacity),
          surfaceTop: document.querySelector('.home-window-surface')!.getBoundingClientRect().top,
          overflow: document.documentElement.scrollWidth > innerWidth });
        await new Promise(requestAnimationFrame);
      } while (performance.now() - start < 950);
      return frames;
    });
    expect(opening.every(frame => Math.abs(frame.top - top) < 1 && !frame.overflow), JSON.stringify({top, frames:opening.filter(frame=>Math.abs(frame.top-top)>=1||frame.overflow)})).toBe(true);
    if (reducedMotion === 'no-preference') {
      const expandedTop = opening.at(-1)!.surfaceTop;
      expect(opening.some(frame => frame.surfaceTop < surfaceTop - .5 && frame.surfaceTop > expandedTop + .5)).toBe(true);
    }
    const visible = opening.filter(frame => frame.opacity > .5);
    expect(visible.length).toBeGreaterThan(0);
    if (reducedMotion === 'no-preference') expect(Math.max(...visible.map(frame => frame.resultTop)) - Math.min(...visible.map(frame => frame.resultTop))).toBeLessThan(2);
    await expect.poll(() => page.locator('.home-genui-reveal').evaluate(el => Math.abs(el.getBoundingClientRect().height - el.firstElementChild!.getBoundingClientRect().height))).toBeLessThan(2);
    const openWidth = (await page.locator('.home-genui-window').boundingBox())!.width;
    const openHeight = (await page.locator('.home-genui-reveal').boundingBox())!.height;
    await page.getByRole('button', { name: 'Clear exploration', exact: true }).click();
    const closing = await page.evaluate(async () => {
      const frames: { width: number; remaining: number; hidden: boolean; opacity: number; phase: string | undefined; surfaceHeight: number; surfaceTop: number; formHeight: number; formTop: number; utilityPresent: boolean; fullDepth: number }[] = [];
      const start = performance.now();
      do {
        const reveal = document.querySelector('.home-genui-reveal');
        const shell = document.querySelector<HTMLElement>('.home-genui-window')!;
        const surface = document.querySelector('.home-window-surface')!.getBoundingClientRect();
        const form = document.querySelector('.home-genui-composer form')!.getBoundingClientRect();
        frames.push({ width: document.querySelector('.home-genui-window')!.getBoundingClientRect().width,
          remaining: reveal?.getBoundingClientRect().height ?? 0,
          opacity: reveal ? Number(getComputedStyle(reveal).opacity) : 0,
          phase: shell.dataset.motion, surfaceHeight: surface.height, surfaceTop: surface.top, formHeight: form.height, formTop: form.top,
          utilityPresent: !!document.querySelector('.home-idle-actions'),
          fullDepth: Number(getComputedStyle(document.querySelector('.home-window-depth')!).opacity),
          hidden: !reveal || reveal.getAttribute('aria-hidden') === 'true' && reveal.hasAttribute('inert') });
        await new Promise(requestAnimationFrame);
      } while (performance.now() - start < 950);
      return frames;
    });
    expect(closing.every(frame => frame.hidden)).toBe(true);
    if (reducedMotion === 'no-preference') {
      const settling = closing.filter(frame => frame.phase === 'settling');
      expect(settling.length).toBeGreaterThan(0);
      // Once width is released, the surface is already the input's height and
      // stays there. No extra vertical contraction, double shadow, or premature utility reveal.
      expect(settling.every(frame => Math.abs(frame.surfaceHeight - frame.formHeight) < 1 && Math.abs(frame.surfaceTop - frame.formTop) < 1)).toBe(true);
      expect(settling.every(frame => !frame.utilityPresent && frame.fullDepth < .01)).toBe(true);
    }
    expect(closing.at(-1)!.phase).toBe('idle');
    // The content must not disappear while most of its empty surface remains.
    expect(closing.filter(frame => frame.remaining > openHeight * .3).every(frame => frame.opacity > .1)).toBe(true);
    expect(closing.filter(frame => frame.remaining > 1).every(frame => Math.abs(frame.width - openWidth) < 1)).toBe(true);
    await expect(page.locator('.home-genui-reveal')).toHaveCount(0);
    await expect(input).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: 'Undo clear', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'How to explore', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Explore guide' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How to explore', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Follow the work in Taiwan' })).toBeVisible();
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Put two kinds of work side by side' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
    await page.getByRole('button', { name: 'What did Isaac learn in Taiwan?', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Project explorer' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Explore guide' })).toHaveCount(0);
  });
}

for (const phase of ['folding', 'settling']) {
  test(`a new request reverses ${phase} without a stale idle handoff`, async ({ page }) => {
    await page.setViewportSize({ width: 749, height: 900 });
    await page.route('**/api/compose', route => route.fulfill({ json: { configured: false } }));
    await page.route('**/api/intent', route => route.fulfill({ status: 503, json: {} }));
    await page.goto('/');
    const input = page.getByRole('textbox', { name: 'Explore', exact: true });
    const shell = page.locator('.home-genui-window');
    await input.fill('What was Isaac’s role in Congress?');
    await input.press('Escape');
    await input.press('Enter');
    await expect(page.getByRole('button', { name: 'Evidence', exact: true })).toBeVisible();
    await expect.poll(() => page.locator('.home-genui-reveal').evaluate(el => Math.abs(el.getBoundingClientRect().height - el.firstElementChild!.getBoundingClientRect().height))).toBeLessThan(2);
    await page.getByRole('button', { name: 'Clear exploration', exact: true }).click();
    await expect.poll(() => shell.getAttribute('data-motion'), { intervals: [10] }).toBe(phase);
    await input.fill('Compare California and Washington');
    await input.press('Escape');
    await input.press('Enter');
    await expect(page.getByRole('combobox', { name: 'Benchmark measure' })).toBeVisible();
    // Allow the superseded fold/settle to finish: it must not release width or
    // reveal the idle controls over the replacement exploration.
    await expect.poll(() => page.locator('.home-genui-reveal').evaluate(el => Math.abs(el.getBoundingClientRect().height - el.firstElementChild!.getBoundingClientRect().height))).toBeLessThan(2);
    await expect(shell).toHaveAttribute('data-motion', 'open');
    await expect(shell).toHaveClass(/has-results/);
    await expect(page.locator('.home-idle-actions')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
