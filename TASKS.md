# Liverstone — Task list (post 1.0)

Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` deferred (with reason)

## TECH — technical debt (safest order first, no regressions)

- [x] T1. Remove the leftover `mem.echo` branch in `Combat.playCard`
- [x] T2. Move the Playwright checks into the repo (`tests/e2e`, `npm run e2e`) as a safety net for the refactors
- [ ] T3. Add ESLint (typescript-eslint) + Prettier, fix the findings
- [ ] T4. Split `ui/screens/combat.ts` into belt/drag, HUD and FX modules
- [ ] T5. Split `styles/main.css` into ordered partials (same cascade order)
- [ ] T6. Type the static i18n keys so typos fail the build
- [ ] T7. Pixel-art caching

## FIX

- [ ] F1. Floating damage text on the enemy ("-3" on a bloody background) must be clearly visible
- [ ] F2. Home candles disappeared: they must be there and animated

## FEATURES

- [ ] FE1. Hero select: horizontal, game-like carousel
- [ ] FE2. Card reward: always a swap. The whole deck on top, 4 reward cards at the bottom; pick one of each, then Swap (or Skip)
- [ ] FE3. Enemy patterns: a frequent main attack plus a special move every X attacks
- [ ] FE4. Quick hero balance: starter decks with only basic cards (duplicates ok); advanced cards only from rewards
- [ ] FE5. Long press on statuses (enemy and own) shows their details
- [ ] FE6. "Start" button at the beginning of each fight; the game waits so the player can inspect things
- [ ] FE7. Elite soundtrack (darker, more epic, same style)
- [ ] FE8. Remove the secondary stat and bar (Rage, Arcana, Decay); active abilities cost a lot of mana instead
- [ ] FE9. Calmer soundtrack while paused
- [ ] FE10. Pause menu: "Main menu" button (keeps the run; only the current fight is lost)
- [ ] FE11. A couple of new cards per hero with strong archetype synergy
- [ ] FE12. Card corner marks: explain or remove the bottom-right square; better Innate symbol

## MISC

- [ ] M1. Consistency pass on style, symbols and wording across the whole game
