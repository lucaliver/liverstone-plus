import { describe, expect, it } from 'vitest';
import { simulateRun } from './bot';
import type { HeroId } from '../src/game/types';

/**
 * Balance smoke test: a decent bot should often clear Act 1, a sloppy one should usually not.
 * Prints a report so tuning changes can be compared run to run.
 */
const N = 120;

function report(hero: HeroId, reaction: number, sloppiness: number) {
  let wins = 0;
  const floors: number[] = [];
  const times: number[] = [];
  for (let i = 0; i < N; i++) {
    const r = simulateRun(hero, 1000 + i, { reaction, sloppiness });
    if (r.won) wins++;
    floors.push(r.floor);
    times.push(...r.combatTimes);
  }
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
  const res = { hero, reaction, sloppiness, winRate: wins / N, avgFloor: avg(floors), avgCombatSec: avg(times) };
  console.log(JSON.stringify(res));
  return res;
}

describe('balance', () => {
  it('good bot clears act 1 most of the time, sloppy bot rarely', () => {
    for (const hero of ['warrior', 'mage'] as HeroId[]) {
      const good = report(hero, 0.35, 0.1);
      const sloppy = report(hero, 0.9, 0.5);
      expect(good.winRate).toBeGreaterThanOrEqual(sloppy.winRate);
    }
  }, 120_000);
});
