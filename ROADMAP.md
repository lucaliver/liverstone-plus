# Liverstone — Roadmap

## In 1.1

- **Real-time belt combat**: Start gate (hold anything to read it), fixed draw cadence, tap/drag to play,
  two sleeve slots, long press to inspect cards, statuses, ability, passive, enemy moves and mana.
- **Mana crystals**: low base cap, Innate crystal cards that grow it during the fight.
- **Enemies**: frequent main attack plus a special every N attacks; threat bar with countdown and next-special
  chip, unblocked-damage preview on the HP bar, danger edge flash, blood-splat damage numbers.
- **3 heroes**, each with a passive, a mana-cost active ability and a once-per-run special card:
  Warrior (Block), Mage (Spellweave/Chill), Necromancer (Poison). Basic-only starter decks.
- **~76 cards**: class (with archetype synergy cards), neutral, crystal and 5 curses (Slime, Hex, Bomb, Leech, Toxin).
- **Act 1**: 10 linear floors (fights, 2 campfires, elite, boss); 5 enemies, Bone Knight elite, Lich boss.
- **Rewards**: always a swap (whole deck vs 4 offers); campfire heal or upgrade.
- **Compendium**: every card (discovery tracked) and every enemy with main attack and specials.
- **Presentation**: riso-pixel art generated at boot, dark theme, animated title with pixel candles,
  game-style hero carousel, 6 procedural music tracks (menu, combat, elite, boss, rest, pause), SFX, haptics.
- **Quality of life**: saves at every floor, pause (Main menu keeps the run), auto-pause in background,
  1×/1.5×/2× speed, reduced motion, i18n-ready (English).

## Next steps (suggested order)

1. **Balance pass with real playtests.** Bot win rates for Act 1 are now Warrior ~64%, Mage ~43%,
   Necromancer ~67%.
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

## Technical debt

Done in 1.1: combat screen split into `ui/combat/`, CSS split into ordered partials, Biome lint + format
(`npm run check`), Playwright smoke tests in the repo (`npm run e2e`), typed i18n keys, dead code removed.

Remaining:

1. **Pixel-art caching**: deferred, since generation takes ~26 ms at boot. Revisit if the art set grows a lot.
2. **ESLint**: typescript-eslint doesn't support TypeScript 7 yet; Biome covers linting and formatting for now.
3. **Balance bot**: it uses simple heuristics (it underplays the Mage's spell chaining and uses abilities as soon
   as it can afford them). Treat its numbers as relative.
