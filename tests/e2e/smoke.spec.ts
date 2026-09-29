import { expect, test } from '@playwright/test';
import { combat, freshGame, startFight } from './helpers';

test('title, hero select and journey render without errors', async ({ page }) => {
  const problems = await freshGame(page);
  await expect(page.locator('.title-screen .logo')).toHaveText(/punchcard/i);
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
  await expect(page.locator('.swap-deck .card')).toHaveCount(15);
  await expect(page.locator('.swap-offer .card')).toHaveCount(4);
  const swap = page.getByRole('button', { name: 'Swap' });
  await expect(swap).toBeDisabled();
  await page.locator('.swap-deck .card').first().click();
  await page.locator('.swap-offer .card').first().click();
  await expect(swap).toBeEnabled();
  await swap.click();
  // Back on the map: act 1 starts on a single road, so the one floor ahead is open.
  await expect(page.locator('.node.open')).toHaveCount(1);
  const deck = (await page.evaluate('window.__game.run.deck.length')) as number;
  expect(deck).toBe(15);
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
  test(`title poster, time card and menu fit (height ${height})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height });
    await freshGame(page);
    for (const sel of ['.poster', '.poster .logo', '.timecard-cta', '.desk-clock', '.menu .btn >> nth=-1']) {
      await expect(page.locator(sel)).toBeInViewport({ ratio: 0.9 });
    }
    // The boss is cut by the poster's edge on purpose.
    await expect(page.locator('.poster-boss')).toBeVisible();
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

test('map: where the road splits, the player picks one of the two lanes and enters it', async ({ page }) => {
  const problems = await freshGame(page);
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  // The end of act 1's shared road (floor 3): two lanes ahead.
  await page.evaluate(
    '(() => { const g = window.__game; const n = g.run.nodes.find((x) => x.act === 1 && x.floor === 3); g.run.current = n.id; g.run.path = [0, 1, 2]; g.run.cleared = true; g.goJourney(); })()',
  );
  const enter = page.locator('.journey:not(.leaving)').getByRole('button', { name: /choose your path/i });
  await expect(enter).toBeDisabled();
  await page.locator('.journey:not(.leaving) .node.open .dot').last().click();
  await page
    .locator('.journey:not(.leaving)')
    .getByRole('button', { name: /enter floor 4/i })
    .click();
  const at = (await page.evaluate('({ floor: window.__game.run.nodes[window.__game.run.current].floor, path: window.__game.run.path.length })')) as {
    floor: number;
    path: number;
  };
  expect(at).toEqual({ floor: 4, path: 4 });
  expect(problems).toEqual([]);
});

test('map: holding a node explains it, even one out of reach, without picking it', async ({ page }) => {
  const problems = await freshGame(page);
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  const boss = page.locator('.node.boss .dot');
  await boss.scrollIntoViewIfNeeded();
  await boss.hover();
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.up();
  await expect(page.locator('.modal')).toContainText('Boss');
  await expect(page.locator('.node.boss')).not.toHaveClass(/current/);
  expect(problems).toEqual([]);
});

test('closing the pause menu keeps the fight paused while another window is still open', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  // Hold the ability: its info sheet pauses the fight.
  const ability = page.locator('.js-ability');
  await ability.dispatchEvent('pointerdown');
  await page.waitForTimeout(500);
  await ability.dispatchEvent('pointerup');
  await expect(page.locator('.modal .info')).toBeVisible();
  // The app goes to the background: the pause menu opens on top.
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.getByRole('button', { name: /resume/i }).click();
  const clock = () => page.evaluate('window.__combat.time');
  const before = await clock();
  await page.waitForTimeout(400);
  expect(await clock()).toBe(before);
});

test('heroes 2 and 3 start locked: padlock, how to unlock, no start', async ({ page }) => {
  const problems = await freshGame(page, { locked: true });
  await page.getByRole('button', { name: /new run/i }).click();
  await expect(page.locator('.hero-slide.locked')).toHaveCount(2);
  await page.locator('.hero-arrow.next').click();
  await expect(page.locator('.hero-select')).toHaveAttribute('data-hero', 'mage');
  await expect(page.locator('.hero-slide.current .hero-unlock')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Locked' })).toBeDisabled();
  expect(problems).toEqual([]);
});

test('skipping a reward adds max HP', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  await combat(page, "c.damage('hero', 'enemy', 999, { raw: true }, 'hero');");
  await expect(page.locator('.reward')).toBeVisible({ timeout: 5000 });
  const max = (await page.evaluate('window.__game.run.maxHp')) as number;
  await page.locator('.skip-btn').click();
  await expect(page.locator('.journey')).toBeVisible();
  expect(await page.evaluate('window.__game.run.maxHp')).toBe(max + 3);
});

test('debug button: pick a hero and an enemy, the fight starts against it', async ({ page }) => {
  const problems = await freshGame(page);
  await page.getByRole('button', { name: /debug/i }).click();
  await page.locator('.debug-fight .seg button').nth(1).click();
  const foe = page.locator('.debug-foe').last();
  const enemy = await foe.getAttribute('data-enemy');
  await foe.click();
  await expect(page.locator('.combat')).toBeVisible();
  const picked = await page.evaluate('({ hero: window.__game.run.hero, enemy: window.__combat.enemy.def.id })');
  expect(picked).toEqual({ hero: 'mage', enemy });
  expect(problems).toEqual([]);
});

test('debug: Unlock all hires every hero and reveals every card and enemy in the handbook', async ({ page }) => {
  await freshGame(page, { locked: true });
  await page.getByRole('button', { name: /debug/i }).click();
  await page.getByRole('button', { name: /unlock all/i }).click();
  await page.getByRole('button', { name: /handbook/i }).click();
  await expect(page.locator('.card.undiscovered')).toHaveCount(0);
  await page.getByRole('tab', { name: /personnel/i }).click();
  await expect(page.locator('.foe h3', { hasText: '????' })).toHaveCount(0);
  await page.getByRole('button', { name: /back/i }).click();
  await expect(page.locator('.timecard-cta')).toHaveCount(1);
  await page.getByRole('button', { name: /new run/i }).click();
  await expect(page.locator('.hero-dot.locked')).toHaveCount(0);
});

test('handbook: the ? button explains how to read a card', async ({ page }) => {
  await freshGame(page);
  await page.getByRole('button', { name: /handbook/i }).click();
  await page.getByRole('button', { name: /how to read a card/i }).click();
  await expect(page.locator('.anatomy .spot')).toHaveCount(6);
});

test('after the Act 1 boss the map turns to Act 2 (the very first run ends there)', async ({ page }) => {
  const problems = await freshGame(page, { veteran: true });
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  await page.evaluate(
    '(() => { const g = window.__game; const boss = g.run.nodes.find((n) => n.type === "boss" && n.act === 1); g.run.current = boss.id; g.run.path.push(boss.id); g.run.cleared = true; g.goJourney(); })()',
  );
  await expect(page.locator('.journey:not(.leaving) .act-banner .h1')).toHaveText(/act 2/i);
  await expect(page.locator('.journey:not(.leaving) .node.open')).toHaveCount(1);
  await page
    .locator('.journey:not(.leaving)')
    .getByRole('button', { name: /enter floor 1/i })
    .click();
  await expect(page.locator('.combat')).toBeVisible();
  expect(await page.evaluate('window.__combat.enemy.def.act')).toBe(2);
  expect(problems).toEqual([]);
});

test('tapping the hero portrait in a fight shows the deck in play and pauses', async ({ page }) => {
  await freshGame(page);
  await startFight(page);
  await page.locator('.hero-portrait').click();
  // The warrior's 15-card deck, identical copies grouped.
  await expect(page.locator('.modal h2')).toContainText('15');
  await expect(page.locator('.modal .deck-grid .card')).toHaveCount(3);
  const clock = () => page.evaluate('window.__combat.time');
  const before = await clock();
  await page.waitForTimeout(300);
  expect(await clock()).toBe(before);
});

test('once signed, the contract is never shown again: the game opens on the title', async ({ page }) => {
  await freshGame(page);
  await page.reload();
  await expect(page.locator('.title-screen')).toBeVisible();
  await expect(page.locator('.splash')).toHaveCount(0);
});

test('reset progress wipes saves after a confirmation', async ({ page }) => {
  await freshGame(page);
  page.on('dialog', (d) => d.accept());
  await page.getByRole('button', { name: /settings/i }).click();
  await page.getByRole('button', { name: /reset progress/i }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.locator('.splash')).toBeVisible();
  expect(await page.evaluate("Object.keys(localStorage).filter((k) => k.startsWith('cardstone+:')).length")).toBe(0);
});

test('handbook: pressing a status in a move pattern explains it', async ({ page }) => {
  await freshGame(page);
  await page.getByRole('button', { name: /handbook/i }).click();
  await page.getByRole('tab', { name: /personnel/i }).click();
  await page.locator('.foe [data-status]').first().click();
  await expect(page.locator('.modal .info')).toBeVisible();
});

test('the very first fight opens on a tour of the board, one step at a time, before Clock in', async ({ page }) => {
  const problems = await freshGame(page, { tutorial: true });
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  await page.getByRole('button', { name: /enter floor 1/i }).click();
  await expect(page.locator('.coach-count')).toHaveText('1/8');
  for (let i = 0; i < 7; i++) await page.locator('.coach .btn').click();
  await page.getByRole('button', { name: 'Got it!' }).click();
  await expect(page.locator('.coach')).toHaveCount(0);
  await expect(page.locator('.js-start')).toBeVisible();
  expect(await page.evaluate("JSON.parse(localStorage.getItem('cardstone+:settings')).seenTutorial")).toBe(true);
  expect(problems).toEqual([]);
});

test('the first Kamikaze on the belt stops the fight to say where it is safe', async ({ page }) => {
  const problems = await freshGame(page);
  await startFight(page);
  await combat(page, "c.addTempCard('kamikaze', 'belt');");
  await expect(page.locator('.coach')).toBeVisible();
  const clock = () => page.evaluate('window.__combat.time');
  const before = await clock();
  await page.waitForTimeout(300);
  expect(await clock()).toBe(before);
  await page.getByRole('button', { name: 'Got it!' }).click();
  await expect(page.locator('.coach')).toHaveCount(0);
  expect(await page.evaluate("JSON.parse(localStorage.getItem('cardstone+:settings')).seenTips")).toEqual(['kamikaze']);
  expect(problems).toEqual([]);
});

test('releasing the hold that opened a card does not press Close underneath', async ({ page }) => {
  await freshGame(page);
  await page.getByRole('button', { name: 'Handbook' }).click();
  const card = page.locator('.comp-grid .card').first();
  await card.hover();
  await page.mouse.down();
  await expect(page.locator('.modal')).toBeVisible();
  // Phones send the release's click where the finger lifts: on the modal's button, without a press of its own there.
  await page.getByRole('button', { name: 'Close' }).dispatchEvent('click', { detail: 1 });
  await expect(page.locator('.modal')).toBeVisible();
  await page.mouse.up();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('a full mana bar blinks only once the fight has started', async ({ page }) => {
  await freshGame(page);
  await page.getByRole('button', { name: /new run/i }).click();
  await page.getByRole('button', { name: /start shift/i }).click();
  await page.getByRole('button', { name: /enter floor 1/i }).click();
  await combat(page, 'c.hero.mana = c.hero.maxMana;');
  await page.waitForTimeout(200);
  await expect(page.locator('.mana-row')).not.toHaveClass(/full/);
  await page.locator('.js-start').click();
  await combat(page, 'c.hero.mana = c.hero.maxMana;');
  await expect(page.locator('.mana-row')).toHaveClass(/full/);
});
