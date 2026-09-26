# Cardstone+ — Design Document

A real-time, conveyor-belt deckbuilding roguelike for mobile browsers (portrait),
inspired by *Cardstone* (Running Pillow, 2015).

## 1. What we keep from Cardstone
| Original | Cardstone+ |
|---|---|
| Cards drawn automatically, "waft across the screen like sushi boats" | **The Belt**: cards scroll right→left; tap to play before they fall off |
| Mana regenerates over time; some cards raise the mana cap | Same, with a visible regen tick on the mana bar |
| One enemy per floor, each with its own attack rate & abilities | Same, plus **telegraphed intents** with a countdown ring |
| Deck auto-reshuffles when exhausted | Same, with a "Reshuffle" callout |
| Swap a card after each battle | Reward: **Add** a card, or **Swap** it for one in your deck, or Skip |
| "Sleeve": hold up to 3 cards (v2.2) | **Sleeve**: 2 slots (relics add a 3rd); drag a card down to stash it |
| Heroes with unique abilities | Warrior & Mage, each with a passive, a class resource and an active ability |
| Gold unlocks cards permanently | **Soul Shards** unlock card & relic packs (light meta) |
| Food/energy timer | Removed |

## 2. What we improve
- **Timing-based defence**: Block decays over time, so you play it *just before* the telegraphed hit.
- **Belt keywords**: *Swift* cards move fast, *Heavy* ones slow; curses clog the belt or explode when they leave.
- **Real-time control effects**: Stun (enemy timer paused), Chill (timer at half speed), belt slow/haste.
- **Relics, shop, rest sites, events, card upgrades** between floors.
- **Pause + game speed** (1×/1.5×/2×), auto-pause when the tab is hidden, and long-press any card to read it.
- **Run resume**: progress is saved at every floor.

## 3. Core combat rules
- Time runs at `speed × dt` and freezes while paused.
- **Mana**: `mana` regenerates by 1 every `regen` seconds, up to `maxMana` (cap 10).
- **Belt**: a card crosses the belt in `BELT_TIME` s. A new card spawns when the gap behind the last one is ≥ `SPACING`.
  *Draw N* makes N cards spawn at once, overlapping at half spacing. A card that reaches the left edge is discarded.
- **Sleeve**: stashed cards stay there until played. Only one card is stashed per drag.
- **Piles**: draw → belt → discard. When the draw pile is empty, the discard pile is shuffled in.
  *Exhaust* removes a card for the rest of the fight; *Consume* (potions) removes it from the deck permanently.
- **Enemy**: runs a move pattern. Each move has a wind-up (seconds) shown as an intent icon, a value and a ring timer.
- **Damage**: `(base + strength) × (weak ? 0.75 : 1) × (vulnerable ? 1.5 : 1)`. Block absorbs damage first.
- **Block decay**: lose 1 block every 0.6 s (Warrior: every 1.2 s).
- **Statuses** are time-based (seconds) or stack-based (DoTs tick every 1.5 s and lose 1 stack per tick).

## 4. Heroes
| | Warrior | Mage |
|---|---|---|
| HP / Mana cap / Regen | 80 / 5 / 1.4 s | 60 / 7 / 1.2 s |
| Passive | **Iron Hide**: Block decays half as fast | **Spellweave**: spells played within 2.5 s of each other build Weave (max 5); +1 spell damage per Weave |
| Resource | **Rage** (0–10): +1 per hit taken, +1 per attack played | **Arcana**: fills with mana spent (12) |
| Ability | **Berserk**: attacks deal double damage for 6 s | **Time Warp**: freezes the enemy for 4 s and halves belt speed |

Adding a hero means adding one entry in `data/heroes.ts`, a card file and its i18n strings.

## 5. Run structure (v1 = linear)
3 acts × 10 floors. The run is modelled as a **node graph** (`RunNode.next[]`); v1 builds a straight line, so a
branching map can reuse it later. Floor pattern:
`fight, fight, event, fight, rest, elite, shop, fight, rest, boss`.
After a boss you heal 50% of missing HP.

Rewards: gold, plus a pick of 3 cards (Add / Swap / Skip). Elites also drop a relic; bosses offer a pick of 3 relics.

## 6. Meta progression (light)
Soul Shards = floors cleared + 5 per elite + 15 per boss. They buy unlock packs (new cards/relics join the pools).
Stored in `localStorage` together with stats and settings.

## 7. UX principles
- Portrait-first: 16 px gutters, safe-area insets, tap targets ≥ 44 px, no hover-only info.
- Every action gets immediate feedback: sound, particles, floating numbers, haptics (when supported).
- Telegraph everything dangerous: intent + timer ring, glow on cards about to leave the belt.
- Unaffordable cards are dimmed and shake when tapped, and a brief hint explains why.
- First-run tutorial overlay (skippable) and an in-game "How to play".
- Respect `prefers-reduced-motion`, plus an in-game toggle.

## 8. Architecture
```
src/
  core/      rng, events, i18n, save, util
  i18n/      en.ts (all player-facing text)
  data/      cards/, heroes, enemies, relics, events, config
  game/      combat engine (pure, UI-agnostic, deterministic with a seed), run state, meta
  ui/        screens, components, art (SVG), fx (particles, floaters)
  audio/     sfx (WebAudio synth), music (procedural sequencer)
```
The combat engine emits typed events; the UI subscribes to them for animation, so gameplay logic stays testable
without a DOM (Vitest + a balance simulation bot).
