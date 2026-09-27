import { expect, test } from '@playwright/test';
import { combat, freshGame, startFight } from './helpers';

test('title, hero select and journey render without errors', async ({ page }) => {
  const problems = await freshGame(page);
  await expect(page.locator('.logo')).toHaveText(/liverstone/i);
  await page.getByRole('button', { name: /new run/i }).click();
  await expect(page.locator('.hero-card')).toHaveCount(3);
  await page.getByRole('button', { name: /enter the dungeon/i }).click();
  await expect(page.locator('.node.current')).toBeVisible();
  expect(problems).toEqual([]);
});

test('a fight can be played and won, then a reward is offered', async ({ page }) => {
  const problems = await freshGame(page);
  await startFight(page);
  await expect(page.locator('.belt-cards .card').first()).toBeVisible();
  const before = (await combat(page, 'return c.enemy.hp;')) as number;
  const uid = (await combat(page, "return c.belt.find((b) => b.card.id === 'strike')?.card.uid ?? null;")) as number | null;
  if (uid !== null) {
    await page.locator(`.belt-cards .card[data-uid="${uid}"]`).dispatchEvent('pointerdown', { pointerId: 1, clientX: 0, clientY: 0 });
    await page.locator('.combat').dispatchEvent('pointerup', { pointerId: 1, clientX: 0, clientY: 0 });
    await expect.poll(() => combat(page, 'return c.enemy.hp;')).toBeLessThan(before);
  }
  await combat(page, "c.damage('hero', 'enemy', 999, { raw: true }, 'hero');");
  await expect(page.locator('.reward')).toBeVisible({ timeout: 5000 });
  expect(problems).toEqual([]);
});

test('the combat layout never moves when statuses appear', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  const snap = () =>
    page.evaluate(() => ['.belt', '.hero-row', '.threat', '.enemy-art .riso'].map((s) => {
      const r = document.querySelector(s)!.getBoundingClientRect();
      return `${Math.round(r.top)}/${Math.round(r.height)}`;
    }).join(' '));
  const a = await snap();
  await combat(page, "for (const id of ['poison', 'burn', 'strength']) c.applyStatus('enemy', id, 3); c.applyStatus('enemy', 'weak', 1, 5); c.applyStatus('hero', 'strength', 2); c.applyStatus('hero', 'dodge', 1); c.gainBlock('hero', 9);");
  await page.waitForTimeout(300);
  // The sprite bobs a few pixels while idle: compare size only for it.
  const norm = (s: string) => s.split(' ').map((x, i) => (i === 3 ? x.split('/')[1] : x)).join(' ');
  expect(norm(await snap())).toBe(norm(a));
});

test('compendium shows cards and enemies in separate sections', async ({ page }) => {
  const problems = await freshGame(page);
  await page.getByRole('button', { name: /compendium/i }).click();
  await expect(page.locator('.comp-grid .card').first()).toBeVisible();
  await expect(page.locator('.foe').first()).toBeHidden();
  await page.getByRole('tab', { name: /enemies/i }).click();
  await expect(page.locator('.foe').first()).toBeVisible();
  await expect(page.locator('.comp-grid')).toBeHidden();
  expect(problems).toEqual([]);
});
