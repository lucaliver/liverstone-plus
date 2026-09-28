import { expect, type Page } from '@playwright/test';

/**
 * Fresh game: no saves, tutorial already seen, every hero unlocked (unless `locked`).
 * Collects console errors and warnings (e.g. missing i18n keys).
 */
export async function freshGame(page: Page, opts: { tutorial?: boolean; locked?: boolean } = {}): Promise<string[]> {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  await page.goto('/');
  await page.evaluate(
    ([seen, unlocked]) => {
      localStorage.clear();
      if (seen) localStorage.setItem('cardstone+:settings', JSON.stringify({ seenTutorial: true }));
      if (unlocked) localStorage.setItem('cardstone+:meta', JSON.stringify({ discovered: [], heroes: ['mage', 'necromancer'], fresh: [] }));
    },
    [!opts.tutorial, !opts.locked],
  );
  await page.reload();
  // The splash screen comes first: the contract, signed with a hold the first time, then one tap (it unlocks audio).
  await signAndStart(page);
  await expect(page.locator('.title-screen')).toBeVisible();
  return problems;
}

/** Title → hero select → journey → first fight, ready to play (Start pressed if present). */
export async function startFight(page: Page, heroIndex = 0): Promise<void> {
  await page.getByRole('button', { name: /new run/i }).click();
  await page.locator('.hero-dot').nth(heroIndex).click();
  await expect(page.locator('.hero-dot').nth(heroIndex)).toHaveAttribute('aria-current', 'true');
  await page.getByRole('button', { name: /start shift/i }).click();
  await page.getByRole('button', { name: /enter floor 1/i }).click();
  await expect(page.locator('.combat')).toBeVisible();
  const start = page.locator('.js-start');
  if (await start.count()) await start.click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __combat: { intro: number } }).__combat.intro <= 0)).toBe(true);
}

export const combat = (page: Page, fn: string): Promise<unknown> => page.evaluate(`(() => { const c = window.__combat; ${fn} })()`);

/** On the start screen: hold to sign the contract (first launch), or tap Start game once it's signed. */
export async function signAndStart(page: Page): Promise<void> {
  const sign = page.locator('.sign-btn');
  if (await sign.count()) {
    await sign.hover();
    await page.mouse.down();
    await page.waitForTimeout(1100);
    await page.mouse.up();
    return;
  }
  await page.getByRole('button', { name: /start game/i }).click();
}
