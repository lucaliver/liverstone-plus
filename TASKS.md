# Liverstone — Task list (post 1.0)

Status: `[ ]` todo · `[~]` in progress · `[x]` done · `[-]` deferred (with reason)

## TECH — technical debt (safest order first, no regressions)

- [x] T1. Remove the leftover `mem.echo` branch in `Combat.playCard`
- [x] T2. Move the Playwright checks into the repo (`tests/e2e`, `npm run e2e`) as a safety net for the refactors
- [x] T3. Lint + format: Biome (typescript-eslint doesn't support TypeScript 7 yet); all findings fixed; `npm run check`
- [x] T4. Split the combat screen into `ui/combat/` (view, hud, cardLayer, combatFx, combatScreen)
- [x] T5. Split `styles/main.css` into 17 ordered partials + `index.css` (identical cascade)
- [x] T6. Typed i18n keys: literal ids from en.ts, dynamic families by prefix (a typo now fails the typecheck)
- [-] T7. Pixel-art caching — deferred: the whole art set is generated in ~26 ms at boot (title shows at ~76 ms); a cache would add invalidation risk for no visible gain. Revisit when the art set grows a lot.

## FIX

- [x] F1. Floating damage text on the enemy ("-3" on a bloody background) must be clearly visible
- [x] F2. Home candles disappeared: they must be there and animated

## FEATURES

- [x] FE1. Hero select: horizontal, game-like carousel
- [x] FE2. Card reward: always a swap. The whole deck on top, 4 reward cards at the bottom; pick one of each, then Swap (or Skip)
- [x] FE3. Enemy patterns: a frequent main attack plus a special move every X attacks
- [x] FE4. Quick hero balance: starter decks with only basic cards (duplicates ok); advanced cards only from rewards
- [x] FE5. Long press on statuses (enemy and own) shows their details
- [x] FE6. "Start" button at the beginning of each fight; the game waits so the player can inspect things
- [x] FE7. Elite soundtrack (darker, more epic, same style)
- [x] FE8. Remove the secondary stat and bar (Rage, Arcana, Decay); active abilities cost a lot of mana instead
- [x] FE9. Calmer soundtrack while paused
- [x] FE10. Pause menu: "Main menu" button (keeps the run; only the current fight is lost)
- [x] FE11. A couple of new cards per hero with strong archetype synergy
- [x] FE12. Card corner marks: explain or remove the bottom-right square; better Innate symbol

## MISC

- [x] M1. Consistency pass on style, symbols and wording across the whole game

### M1 notes
Fixed: emoji shield in the blocked-damage text → pixel icon; Unicode ⇅ on the reward screen → pixel swap icon;
"||" on a frozen enemy's timer → pause icon; the compendium "?" badge covered card names → moved onto the art;
long card names were cut off → auto-smaller font; tutorial wording "hand"/"sleeve" unified; reward layout
centred on tall screens. Checked: pixel fonts everywhere, the ink palette, paper panels with hard shadows,
stepped animations and one icon set.
