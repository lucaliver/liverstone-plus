import { expect, type Page } from '@playwright/test';

/** Fresh game: no saves, tutorial already seen. Collects console errors and warnings (e.g. missing i18n keys). */
export async function freshGame(page: Page, opts: { tutorial?: boolean } = {}): Promise<string[]> {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  await page.goto('/');
  await page.evaluate((seen) => {
    localStorage.clear();
    if (seen) localStorage.setItem('cardstone+:settings', JSON.stringify({ seenTutorial: true }));
  }, !opts.tutorial);
  await page.reload();
  await expect(page.locator('.title-screen')).toBeVisible();
  return problems;
}

/** Title → hero select → journey → first fight, ready to play (Start pressed if present). */
export async function startFight(page: Page, heroIndex = 0): Promise<void> {
  await page.getByRole('button', { name: /new run/i }).click();
  await page.locator('.hero-card').nth(heroIndex).click();
  await page.getByRole('button', { name: /enter the dungeon/i }).click();
  await page.getByRole('button', { name: /enter floor 1/i }).click();
  await expect(page.locator('.combat')).toBeVisible();
  const start = page.locator('.js-start');
  if (await start.count()) await start.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __combat: { intro: number } }).__combat.intro <= 0)).toBe(true);
}

export const combat = (page: Page, fn: string): Promise<unknown> => page.evaluate(`(() => { const c = window.__combat; ${fn} })()`);
