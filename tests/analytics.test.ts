import { afterEach, describe, expect, it, vi } from 'vitest';
import { fightPaths, rewardPaths, runPaths, trackFight } from '../src/analytics';
import { MODIFIER_LIST } from '../src/data/modifiers';
import { newRun } from '../src/game/run';
import { settings } from '../src/game/settings';

const V = __APP_VERSION__;

describe('analytics', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    settings.analytics = true;
  });

  it('names fights, rewards and run ends as versioned paths', () => {
    const run = newRun('warrior', 1);
    expect(fightPaths(run, 'boss1', true)).toEqual([`${V}/fight/boss1/warrior/win`]);
    expect(rewardPaths(run, ['a', 'b'], 'a', 'x')).toEqual([`${V}/offered/a`, `${V}/offered/b`, `${V}/pick/a`, `${V}/cut/x`]);
    expect(rewardPaths(run, ['a'], null, null)).toEqual([`${V}/offered/a`, `${V}/skip`]);
    expect(runPaths(run, 'abandon')).toEqual([`${V}/run/warrior/abandon`]);
    expect(runPaths(run, 'lose')[1]).toMatch(/\/death\/act1-floor\d+$/);
  });

  it('keeps memo runs apart: only the tagged run result is sent', () => {
    const run = newRun('warrior', 1, false, [MODIFIER_LIST[0].id]);
    expect(fightPaths(run, 'boss1', true)).toEqual([]);
    expect(rewardPaths(run, ['a'], null, null)).toEqual([]);
    expect(runPaths(run, 'lose')).toEqual([`${V}/run/warrior/lose-memo`]);
  });

  it('sends nothing without an endpoint or with the switch off, and spaces hits out otherwise', () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(() => Promise.resolve(new Response()));
    vi.stubGlobal('fetch', fetchMock);
    const run = newRun('warrior', 1);

    trackFight(run, 'boss1', true);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv('VITE_STATS_URL', 'https://example.goatcounter.com/count');
    settings.analytics = false;
    trackFight(run, 'boss1', true);
    expect(fetchMock).not.toHaveBeenCalled();

    settings.analytics = true;
    trackFight(run, 'boss1', true);
    trackFight(run, 'boss1', false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const first = new URL((fetchMock.mock.calls[0] as unknown as [string])[0]);
    expect(first.searchParams.get('p')).toBe(`${V}/fight/boss1/warrior/win`);
    expect(first.searchParams.get('e')).toBe('true');
    vi.runAllTimers();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
