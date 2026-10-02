import { settings } from '../game/settings';
import type { RunState } from '../game/run';
import { currentNode } from '../game/run';
import { send } from './goatcounter';

/**
 * Anonymous play stats: counters only (no player id, no deck, no seed), off with the Settings switch `analytics`.
 * The game calls the three `track*` functions below from its flow (`main.ts`, the reward screen), never the engine. Names
 * are paths: `<build>/<what>/<ids…>`, with data ids (English, stable). Runs under a memo are tagged apart, as their fights are harder.
 * To remove the whole thing: delete this folder, the three call sites, `settings.analytics` and its strings.
 */
export type RunResult = 'win' | 'lose' | 'abandon';

const path = (...parts: string[]): string => [__APP_VERSION__, ...parts].join('/');
const count = (p: string): void => {
  if (settings.analytics) send(p);
};
const plain = (run: RunState): boolean => run.mods.length === 0;

/** Paths of a fight's result: how each enemy fares against each hero. */
export const fightPaths = (run: RunState, enemy: string, won: boolean): string[] =>
  plain(run) ? [path('fight', enemy, run.hero, won ? 'win' : 'lose')] : [];

/** Paths of a reward screen: every card offered, and the one picked (and the deck card it cut) or the skip. */
export const rewardPaths = (run: RunState, offered: string[], picked: string | null, cut: string | null): string[] =>
  plain(run) ? [...offered.map((id) => path('offered', id)), ...(picked && cut ? [path('pick', picked), path('cut', cut)] : [path('skip')])] : [];

/** Paths of a run's end: the result by hero, and where a lost run died. */
export const runPaths = (run: RunState, result: RunResult): string[] => {
  const node = currentNode(run);
  return [
    path('run', run.hero, run.mods.length ? `${result}-memo` : result),
    ...(result === 'lose' && plain(run) ? [path('death', `act${node.act}-floor${node.floor}`)] : []),
  ];
};

export const trackFight = (run: RunState, enemy: string, won: boolean): void => fightPaths(run, enemy, won).forEach(count);
export const trackReward = (run: RunState, offered: string[], picked: string | null, cut: string | null): void =>
  rewardPaths(run, offered, picked, cut).forEach(count);
export const trackRun = (run: RunState, result: RunResult): void => runPaths(run, result).forEach(count);
