import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const output = process.env.PORTFOLIO_AUDIT_OUTPUT || 'docs/audits/mobile-2026-10-31';
const base = process.env.PORTFOLIO_EVAL_URL || 'http://127.0.0.1:8080';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH });
const results = [];
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    await context.addInitScript(value => localStorage.setItem('theme', value), theme);
    const page = await context.newPage();
    const device = await context.newCDPSession(page);
    async function resize(size) {
      await page.setViewportSize(size);
      await device.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    }
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    async function contained(label) {
      const measure = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert(measure.scroll <= measure.width, `${label}: ${JSON.stringify(measure)}`);
      results.push({ theme, label, ...measure });
    }
    for (const [width, height] of [[320, 568], [382, 676], [390, 844], [466, 678], [626, 890], [890, 626], [844, 390]]) {
      await resize({ width, height });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const input = page.getByRole('textbox', { name: 'Explore', exact: true });
      await input.waitFor();
      await contained(`${width}x${height}-idle`);
      assert.equal(await input.evaluate(el => getComputedStyle(el).fontSize), '16px');
      const stripTop = await page.locator('.photo-strip').evaluate(el => el.getBoundingClientRect().top);
      assert(stripTop >= height * .5 - 2, `Photo strip crowds Explore at ${width}x${height}: ${stripTop}`);
      for (const selector of ['.site-nav-toggle-xray', '.site-search-xray']) {
        const size = await page.locator(selector).boundingBox();
        assert(size.width >= 44 && size.height >= 44);
      }
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${output}/${theme}-${width}-idle.png` });
      await input.fill('Compare California and Washington on AI policy');
      await input.press('Escape');
      await input.press('Enter');
      await page.locator('.canvas-benchmark').waitFor();
      await contained(`${width}x${height}-comparison`);
      const escaped = await page.locator('.home-genui select, .home-genui button').evaluateAll(elements => {
        const panel = document.querySelector('.home-genui-window').getBoundingClientRect();
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          if (!rect.width || !rect.height) return false;
          for (let parent = el.parentElement; parent && !parent.classList.contains('home-genui-window'); parent = parent.parentElement) {
            if (['auto', 'scroll', 'hidden'].includes(getComputedStyle(parent).overflowX)) return false;
          }
          return rect.left < panel.left - 1 || rect.right > panel.right + 1;
        }).map(el => el.getAttribute('aria-label') || el.textContent);
      });
      assert.deepEqual(escaped, []);
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${output}/${theme}-${width}-comparison.png`, fullPage: false });
      // Resize the active experience without remounting it or losing the draft.
      await input.fill('My unfinished question');
      await resize({ width: width < 600 ? 890 : 390, height: 626 });
      assert.equal(await input.inputValue(), 'My unfinished question');
      await page.locator('.canvas-benchmark').waitFor();
      await contained(`${width}-resized-active`);
      await resize({ width, height });
      await input.fill('Tell me about teaching in Taiwan');
      await input.press('Escape');
      await input.press('Enter');
      await page.getByRole('heading', { name: 'AI literacy in Taiwan', exact: true }).waitFor();
      await contained(`${width}x${height}-taiwan`);
      await page.goto(base + '/work');
      await page.locator('.work-grid').waitFor();
      await contained(`${width}x${height}-work`);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.work-story-caption')).opacity === '1');
      await page.waitForTimeout(350);
      const unevenPairs = await page.locator('.work-row').evaluateAll(rows => rows.filter(row => {
        const images = [...row.querySelectorAll('.work-story-image')];
        return images.length === 2 && Math.abs(images[0].getBoundingClientRect().bottom - images[1].getBoundingClientRect().bottom) > 1;
      }).map(row => row.textContent));
      assert.deepEqual(unevenPairs, [], `Uneven Work pair at ${width}`);
      const clippedTitles = await page.locator('.work-story-caption').evaluateAll(captions => captions.filter(caption => {
        const image = caption.parentElement.getBoundingClientRect();
        const box = caption.getBoundingClientRect();
        return box.top < image.top || box.bottom > image.bottom;
      }).map(caption => caption.textContent));
      assert.deepEqual(clippedTitles, [], `Clipped Work captions at ${width}`);
      await page.screenshot({ path: `${output}/${theme}-${width}-work.png` });
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify({ mode: 'Local authored results; responsive viewport emulation, not physical iPhone Duo verification', results }, null, 2) + '\n');
  await browser.close();
}
console.log(`Passed ${results.length} mobile checks.`);
