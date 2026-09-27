import { expect, test } from '@playwright/test';
import { combat, freshGame, startFight } from './helpers';

test('title, hero select and journey render without errors', async ({ page }) => {
  const problems = await freshGame(page);
  await expect(page.locator('.logo')).toHaveText(/punchcard/i);
  await page.getByRole('button', { name: /new run/i }).click();
  await expect(page.locator('.hero-slide')).toHaveCount(3);
  // Carousel: the hero in view is the one that starts.
  await page.locator('.hero-arrow.next').click();
  await expect(page.locator('.hero-dot').nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(page.locator('.hero-select')).toHaveAttribute('data-hero', 'mage');
  await page.getByRole('button', { name: /start shift/i }).click();
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
  // Reward = swap: the whole deck on top, 4 offers below; Swap needs one of each.
  await expect(page.locator('.swap-deck .card')).toHaveCount(10);
  await expect(page.locator('.swap-offer .card')).toHaveCount(4);
  const swap = page.getByRole('button', { name: 'Swap' });
  await expect(swap).toBeDisabled();
  await page.locator('.swap-deck .card').first().click();
  await page.locator('.swap-offer .card').first().click();
  await expect(swap).toBeEnabled();
  await swap.click();
  // Back on the map: the two lanes ahead are open to choose.
  await expect(page.locator('.node.open')).toHaveCount(2);
  const deck = (await page.evaluate('window.__game.run.deck.length')) as number;
  expect(deck).toBe(10);
  expect(problems).toEqual([]);
});

test('the combat layout never moves when statuses appear', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  const snap = () =>
    page.evaluate(() =>
      ['.belt', '.hero-row', '.threat', '.enemy-art .riso']
        .map((s) => {
          const r = document.querySelector(s)!.getBoundingClientRect();
          return `${Math.round(r.top)}/${Math.round(r.height)}`;
        })
        .join(' '),
    );
  const a = await snap();
  await combat(
    page,
    "for (const id of ['poison', 'burn', 'strength']) c.applyStatus('enemy', id, 3); c.applyStatus('enemy', 'weak', 1, 5); c.applyStatus('hero', 'strength', 2); c.applyStatus('hero', 'dodge', 1); c.gainBlock('hero', 9);",
  );
  await page.waitForTimeout(300);
  // The sprite bobs a few pixels while idle: compare size only for it.
  const norm = (s: string) =>
    s
      .split(' ')
      .map((x, i) => (i === 3 ? x.split('/')[1] : x))
      .join(' ');
  expect(norm(await snap())).toBe(norm(a));
});

test('compendium shows cards and enemies in separate sections', async ({ page }) => {
  const problems = await freshGame(page);
  await page.getByRole('button', { name: /handbook/i }).click();
  await expect(page.locator('.comp-grid .card').first()).toBeVisible();
  await expect(page.locator('.foe').first()).toBeHidden();
  await page.getByRole('tab', { name: /personnel/i }).click();
  await expect(page.locator('.foe').first()).toBeVisible();
  await expect(page.locator('.comp-grid')).toBeHidden();
  expect(problems).toEqual([]);
});

for (const height of [844, 600]) {
  test(`title candles are visible and animated (height ${height})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height });
    await freshGame(page);
    const candles = page.locator('.title-screen .candle');
    await expect(candles).toHaveCount(4);
    for (const c of await candles.all()) await expect(c).toBeVisible();
    await expect(page.locator('.title-screen .candle .ff').first()).toHaveCSS('animation-name', 'flameframe');
  });
}

test('the fight waits for Start; meanwhile things can be held to read them', async ({ page }) => {
  await freshGame(page);
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  await page.getByRole('button', { name: /enter floor 1/i }).click();
  const clock = () => page.evaluate('window.__combat.time + window.__combat.intro');
  const before = await clock();
  await page.waitForTimeout(600);
  expect(await clock()).toBe(before);
  // Hold the ability button: an info sheet opens, nothing is played.
  const ability = page.locator('.js-ability');
  await ability.dispatchEvent('pointerdown');
  await page.waitForTimeout(500);
  await ability.dispatchEvent('pointerup');
  await expect(page.locator('.modal .info')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await page.locator('.js-start').click();
  await expect.poll(clock).not.toBe(before);
});

test('pausing switches to the pause theme and resuming restores the fight music', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  const track = () => page.evaluate('window.__game.musicTrack()');
  expect(await track()).toBe('combat');
  await page.locator('.js-pause').click();
  expect(await track()).toBe('pause');
  await page.getByRole('button', { name: /resume/i }).click();
  expect(await track()).toBe('combat');
});

test('pause → main menu keeps the run: Continue restarts the same floor', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  await combat(page, 'c.hero.hp -= 10;');
  await page.locator('.js-pause').click();
  await page.getByRole('button', { name: 'Main menu' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('.title-screen')).toBeVisible();
  await page.getByRole('button', { name: /back to work/i }).click();
  await expect(page.locator('.node.current')).toBeVisible();
  const run = (await page.evaluate('({ floor: window.__game.run.current, hp: window.__game.run.hp, max: window.__game.run.maxHp })')) as {
    floor: number;
    hp: number;
    max: number;
  };
  expect(run.floor).toBe(0);
  expect(run.hp).toBe(run.max);
});

test('tapping the backdrop over the pause button closes the pause menu without reopening it', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  const pause = page.locator('.js-pause');
  await pause.click();
  await expect(page.locator('.modal')).toBeVisible();
  const box = (await pause.boundingBox())!;
  // A real tap where the pause button sits (the backdrop covers it).
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(300);
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('campfire upgrade: tapping selects, the Upgrade button confirms', async ({ page }) => {
  await freshGame(page);
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  const floor = await page.evaluate(
    '(() => { const g = window.__game; const n = g.run.nodes.find((x) => x.type === "rest"); g.run.current = n.id; g.run.cleared = false; g.goJourney(); return n.floor; })()',
  );
  await page.getByRole('button', { name: new RegExp(`enter floor ${floor}`, 'i') }).click();
  await page.getByRole('button', { name: /training/i }).click();
  const upgrade = page.getByRole('button', { name: 'Upgrade', exact: true });
  await expect(upgrade).toBeDisabled();
  await expect(page.locator('.deck-grid .card.is-up')).toHaveCount(0);
  await page.locator('.deck-grid .card').first().click();
  await expect(page.locator('.deck-grid .card.sel')).toHaveCount(1);
  // Only the selected card is shown upgraded, and there is no Cancel button.
  await expect(page.locator('.deck-grid .card.is-up')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Cancel' })).toHaveCount(0);
  await expect(page.locator('.modal')).toBeVisible();
  await upgrade.click();
  await expect(page.locator('.node.open').first()).toBeVisible();
  const upgraded = (await page.evaluate('window.__game.run.deck.filter((c) => c.up).length')) as number;
  expect(upgraded).toBe(1);
});

test('coming back from the background while paused keeps the pause → fight music hand-off', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  await page.locator('.js-pause').click();
  // The dev server serves source modules: load the music module in the page (a variable keeps tsc out of it).
  await page.evaluate(async (url) => {
    const m = await import(url);
    m.suspendMusic(true);
    m.suspendMusic(false);
  }, '/src/audio/music.ts');
  expect(await page.evaluate('window.__game.musicTrack()')).toBe('pause');
  await page.getByRole('button', { name: /resume/i }).click();
  expect(await page.evaluate('window.__game.musicTrack()')).toBe('combat');
});

test('map: after a node, the player picks one of the two lanes and enters it', async ({ page }) => {
  const problems = await freshGame(page);
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  await page.evaluate('(() => { const g = window.__game; g.run.cleared = true; g.goJourney(); })()');
  const enter = page.getByRole('button', { name: /choose your path/i });
  await expect(enter).toBeDisabled();
  await page.locator('.node.open .dot').last().click();
  await page.getByRole('button', { name: /enter floor 2/i }).click();
  const at = (await page.evaluate('({ floor: window.__game.run.nodes[window.__game.run.current].floor, path: window.__game.run.path.length })')) as {
    floor: number;
    path: number;
  };
  expect(at).toEqual({ floor: 2, path: 2 });
  expect(problems).toEqual([]);
});
