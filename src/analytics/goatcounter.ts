import { CONFIG } from '../data/config';

/**
 * The only file that knows GoatCounter: `send(path)` counts one event. To change service, rewrite this file; the
 * rest of the game only calls `src/analytics/index.ts`.
 *
 * `VITE_STATS_URL` is the site's count endpoint (`https://<code>.goatcounter.com/count`). Unset (dev, tests, forks) = nothing leaves the page.
 * Hits go out one at a time, `CONFIG.statsGap` apart, so a burst (a reward screen) never trips a rate limit.
 */
const queue: string[] = [];
let draining = false;

export const enabled = (): boolean => !!import.meta.env.VITE_STATS_URL;

function drain(): void {
  const url = import.meta.env.VITE_STATS_URL;
  const path = queue.shift();
  if (!url || path === undefined) {
    draining = false;
    return;
  }
  // GoatCounter event: `e` marks it as an event (its path is the name), `t` is the title shown in the dashboard.
  const query = new URLSearchParams({ p: path, e: 'true', t: path });
  // Fire and forget: a blocked or failed hit is simply lost (the game never waits for it).
  fetch(`${url}?${query}`, { mode: 'no-cors', keepalive: true, cache: 'no-store' }).catch(() => {});
  setTimeout(drain, CONFIG.statsGap * 1000);
}

export function send(path: string): void {
  if (!enabled()) return;
  queue.push(path);
  if (draining) return;
  draining = true;
  drain();
}
