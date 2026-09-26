# Liverstone — Roadmap

## In 1.0

- **Real-time belt combat**: fixed draw cadence, tap/drag to play, two sleeve hands, long-press to inspect.
- **Mana crystals**: low base cap, Innate crystal cards that grow it during the fight.
- **Threat bar** with countdown, unblocked-damage preview on the HP bar, danger edge flash.
- **3 heroes**, each with a passive, a resource plus active ability, and a once-per-run special card:
  Warrior (Block/Rage), Mage (Spellweave/Time Warp), Necromancer (Poison/Pandemic).
- **~68 cards**: class, neutral, crystal and 5 curses (Slime, Hex, Bomb, Leech, Toxin), all with upgrades.
- **Act 1**: 10 linear floors (fights, 2 campfires, elite, boss); 5 enemies, Bone Knight elite, Lich boss.
- **Rewards**: pick 1 of 3 (Swap only after elites); campfire heal or upgrade.
- **Compendium**: every card (discovery tracked) and every enemy with its moves.
- **Presentation**: riso-pixel art generated at boot, dark theme, animated title, 4 procedural music
  tracks plus synthesised SFX, haptics.
- **Quality of life**: saves at every floor, pause with auto-pause in background, 1×/1.5×/2× speed,
  reduced motion, i18n-ready (English).

## Next steps (suggested order)

1. **Rebalance heroes.** Bot win rates for Act 1: Warrior ~47%, Mage ~20%, Necromancer ~7%. The Poison
   rework left the Necromancer weak. Update the bot heuristics too; the Mage is also underplayed by it.
2. **Gold, shop, events.** Gold from fights; a shop to buy cards and remove cards; 5–6 text events.
3. **Relics.** Engine hooks are already in place (`RelicDef`, `onCombatStart`, `onCardPlayed`…); needs content
   (~15 relics), elite and boss relic rewards, and a relic bar in the UI.
4. **Branching map.** The run is already a node graph: generate branches per act and a map screen.
5. **Acts 2 and 3.** New enemies, an elite and a boss each, with new curse and intent mechanics.
6. **Meta progression (light).** Unlockable card and relic packs, per-hero stats, best floor.
7. **Difficulty levels** (ascension-style modifiers) and a **daily seed** run.
8. **Italian localisation** (the i18n system is ready; a language selector appears automatically).
9. **PWA offline**: service worker, PNG icons, install prompt.

## Missing or known issues

- Quitting during a fight restarts that fight from the start on resume (saves happen between floors).
- The run save still uses the legacy storage prefix `cardstone+:`. Changing it needs a small migration.
- Brown doesn't exist in the four-ink palette: brown eyes render amber.
- The balance simulation uses simple heuristics; treat its numbers as relative, not absolute.
- No tutorial for the hero-specific mechanics beyond the hero select screen.

## Technical debt (code review, 1.0)

Overall: the structure is sound. The engine is pure, deterministic and tested; content is data; the
typings are strict and TypeScript is clean. Dead code was removed in the 1.0 cleanup. Priorities:

1. **Split `ui/screens/combat.ts` (~830 lines).** One closure handles markup, input (drag, long-press),
   per-frame rendering and event→FX mapping. Extract `belt.ts` (belt + drag), `hud.ts` (bars, statuses,
   threat, mana) and `combatFx.ts` (event → particles/floaters/sound) before adding relics and shop UI.
2. **Split `styles/main.css` (~2200 lines)** into partials (tokens/base, cards, combat, screens, modals) and
   use `@layer`. A mis-ordered override already caused a bug (short-screen rules had no effect).
3. **Add ESLint (typescript-eslint) + Prettier** and a pre-commit hook. The formatting is consistent today
   but not enforced.
4. **Move the Playwright checks into the repo** (`tests/e2e`, `npm run e2e`): start a run, play cards,
   check that the layout is stable. Today these scripts live in an ignored `screenshots/` folder.
5. **Type the static i18n keys** (`keyof typeof en`) so a typo fails the build. Dynamic keys are already
   covered by `tests/content.test.ts`.
6. **Prebuild or cache pixel art.** Sprites and icons are rasterised at every boot (fast now, but it grows
   with content). Cache them in IndexedDB or generate them at build time.
7. Remove the leftover `mem.echo` branch in `Combat.playCard` or implement it as a relic.
