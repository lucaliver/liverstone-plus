# Liverstone — Design Document (v1.1)

A real-time, conveyor-belt deckbuilding roguelike for mobile browsers (portrait), inspired by
*Cardstone* (Running Pillow, 2015). Official look: **risograph pop inks + pixel art, a bit dark/scary**.

## 1. Core loop

A run is a sequence of floors (v1: one act of 10 linear floors). Each fight is real time:

- **Start gate**: a fight waits for the Start button. Meanwhile the player can hold anything (cards, statuses,
  the ability, the portrait for the passive, the threat bar, mana) to read what it does.
- **The belt** carries cards right → left. Tap a card to play it, drag it up onto the enemy to play it,
  drag it down into a **sleeve** slot to keep it. A card that reaches the left edge is lost
  (it goes to the discard pile) and may trigger its *volatile* effect (Hex, Bomb, Leech, Toxin).
- **Draw cadence is fixed**: one card every `spacing × beltTime` seconds, whatever the player does.
- **Mana** refills over time up to the cap. Heroes start with a low cap (2–3) and grow it during
  the fight with **Innate crystal cards** (Mana Shard +1, Mana Geode +2, empty crystals, once per fight).
- **Enemies** have a frequent **main attack** and, every N main attacks, a **special move** (slow heavy hits,
  curses, theft); specials rotate. The **threat bar** above the belt shows the move, value, fill, seconds left
  and a countdown chip for the next special. The hero HP bar previews unblocked damage; the screen edges
  flash just before it.
- **Block** absorbs damage and decays over time, so it is played right before the hit.
- **Hero ability**: an expensive active move paid with mana (4–5), so it comes once the crystals have grown.
- **Hero special**: a once-per-run card waiting in the sleeve at the start of every fight.

After a fight the **reward is always a swap**: the whole deck on top, 4 offered cards below; pick one of each
and Swap, or Skip. The deck stays at 10 cards (Cardstone style). Campfires: heal 35% or upgrade a card.
Pause offers Resume, How to play, Settings, **Main menu** (keeps the run; the fight restarts) and Abandon run.

## 2. Heroes

| | Warrior | Mage | Necromancer |
| --- | --- | --- | --- |
| HP / base mana / regen | 72 / 3 / 1.5 s | 74 / 3 / 1.0 s | 62 / 2 / 1.25 s |
| Passive | Iron Hide: Block decays 2× slower | Spellweave: chained spells stack +1 dmg (max 5) | Virulence: Poison +1 per tick |
| Ability (mana) | Berserk (5): attacks ×2 for 6 s | Time Warp (5): freeze enemy 4 s, slow belt | Pandemic (4): double enemy Poison |
| Special (once per run) | Last Stand: 20 Block, 3 Strength | Meteor: 25 dmg, 5 Burn | Death's Door: heal 15, 12 Poison |
| Starter deck | 5 Strike, 4 Defend, Mana Geode | 5 Arcane Bolt, 3 Ward, Shard, Geode | 3 Bone Spike, 3 Grave Ward, 2 Toxic Dart, Shard, Geode |

Starter decks hold only basic cards; everything else comes from rewards. Each hero has archetype synergy cards
(Warrior: Counterstrike, Bulwark, Juggernaut; Mage: Flurry, Arcane Echo, Shatter; Necromancer: Contagion,
Siphon Rot). Card pool: ~21 per hero + 10 neutral + 5 curses.

## 3. Enemies (Act 1 — The Forgotten Crypt)

Crypt Rat, Skeleton (Bone Crush), Ooze (slime/toxin curses), Cultist (Dark Ritual), Goblin Thief (steals cards,
lights bombs), Bone Knight (elite: Rend, Shield Wall, enrages at half HP), The Lich (boss: hexes, bombs, a 10 s
DOOM charge, 50% faster below half HP). Each enemy is `main + specials + every` in `data/enemies.ts`.
Global knobs: `CONFIG.enemyHp` / `CONFIG.enemyDmg`.

## 4. Meta

Card **discovery** (seen in a deck, reward or fight) is stored across runs; the **Compendium** shows every
card (undiscovered ones flagged) and every enemy with its moves. Settings: music, SFX, speed, reduced
motion, vibration. Runs are saved at every floor and can be resumed.

## 5. Visual & audio direction

- Night-violet background printed with a faint halftone; cards, buttons and labels are paper "prints".
- Four inks (fluo pink, blue, yellow, dark ink) plus their overprints. No gradients for shading, no glows,
  no soft shadows, no fake 3D, no decorative background circles.
- Pixel sprites are generated at boot from vector sources (`ui/art/riso.ts`): rasterised, quantised to ink
  swatches with checkerboard halftones, outlined, split into ink layers printed on a paper base.
- Motion is stepped (`steps()`), hits flash inverted, particles are square ink pixels.
- Type: Silkscreen (display), Jersey 10 (UI and numbers), Space Grotesk (long text).
- Procedural chiptune soundtrack (menu, combat, elite, boss, rest, pause) and synthesised SFX (WebAudio).

## 6. Architecture

```text
src/
  core/        rng (seeded), emitter, i18n, save (safe localStorage), util
  i18n/        en.ts — every player-facing string
  data/        config, cards/ (per class), heroes, enemies, statuses, relics (empty, hooks ready)
  game/        combat (pure engine), run (node graph, rewards, saves), meta (discovery), settings, types
  ui/          app (screens + modals), dom helpers, art (icons, creatures, riso renderer),
               components (card view, modals, decor), fx (particles, floaters), screens/*
  ui/combat/   combat screen: view, hud, cardLayer (belt/sleeve/input), combatFx, combatScreen
  styles/      index.css imports ordered partials (tokens → components → screens → responsive last)
  audio/       sfx.ts (synth), music.ts (sequencer)
tests/         engine unit tests, content integrity, balance bot + simulation
```

Principles: the combat engine is UI-agnostic and deterministic for a given seed (fixed 1/60 s steps) and
emits typed events that the UI turns into animation and sound. Content is data (cards, enemies, heroes)
with small `play` functions. The run is a node graph (`RunNode.next[]`), so a branching map can replace the
straight line without touching the rest.
