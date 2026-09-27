# Liverstone — technical guide

Real-time conveyor-belt deckbuilder for mobile browsers (portrait). Game design, features and roadmap live in
[README.md](README.md) (Italian, the owner's doc). This file is the technical guide: read it before changing code.

## Working agreement

- Reply to the owner in **Italian**. Game text is **English** (i18n-ready).
- Work task by task; track tasks in the README "Task in corso" section; **commit after each task** with a clear message.
- Official style: **riso pop inks + pixel art, a bit dark/scary**. Never add gradients for shading, glows, fake 3D,
  decorative background circles, industrial motifs, emoji or Unicode symbols as icons (use pixel icons).
- Before handing over: `npm run check` and `npm run e2e` must pass, then look at the screens you touched
  (Playwright screenshot at 390×844 and at a short height such as 375×620).
- Balance: don't spend long on simulations while design is moving; one quick sim pass is enough.

## Stack

- **Vite 8 + TypeScript 7** (strict), no framework: plain DOM through a tiny `h()` helper, CSS, one canvas for particles.
- **Vitest** (unit, content, balance sim), **Playwright** (`tests/e2e`, mobile viewport, touch).
- **Biome** for lint and format (typescript-eslint doesn't support TS 7 yet). Width 150, single quotes.
- Fonts via `@fontsource` (Silkscreen, Jersey 10, Space Grotesk). Audio is pure WebAudio (no assets).
- Static build, no backend; storage is `localStorage` (prefix `cardstone+:`, legacy name: keep it or migrate).

## Commands

```bash
npm run dev      # dev server on the LAN (phone testing)
npm run check    # tsc + biome check + vitest (run before every commit)
npm run e2e      # Playwright smoke tests (starts its own server on :5174)
npm run sim      # balance simulation (prints bot win rates)
npm run format   # biome format --write
npm run build    # typecheck + production build to dist/
```

## Architecture

```text
src/
  core/        rng (seeded), emitter, i18n (typed keys), save (safe localStorage), util
  i18n/en.ts   every player-facing string (key → text)
  data/        config, statuses, heroes, enemies, relics (empty, hooks ready), cards/<class>.ts
  game/        combat.ts (engine), run.ts (node graph, rewards, saves), meta.ts (discovery), settings, types
  ui/          app.ts (screens + modals), dom.ts (h, onPress, onTapOrHold, LONG_PRESS_MS)
    art/       icons.ts (64×64 vector icons), creatures.ts (200×200 vector sprites), riso.ts (pixel renderer)
    combat/    view (DOM + refs + shared state), hud, cardLayer (belt/sleeve/input), combatFx (events → FX), combatScreen
    components/cardView (card DOM, face glyphs), modals (settings, deck, card detail, info), moveText, decor
    fx/        particles, floating text, shake, haptics
    screens/   title, heroSelect, journey, reward, rest, end, compendium
  audio/       sfx.ts (synth), music.ts (sequencer + tracks)
  styles/      index.css imports ordered partials; responsive.css must stay last
tests/         combat, content, balance.sim (+ bot.ts), e2e/
```

### Principles

- **The engine is pure and deterministic.** `Combat` never touches the DOM; it runs fixed 1/60 s ticks from a
  seed and emits typed `CombatEvent`s. The UI subscribes (`combatFx.ts`) and renders state each frame (`hud.ts`,
  `cardLayer.ts`). Gameplay rules belong in the engine or data, never in the UI.
- **Content is data.** Cards, enemies, heroes and statuses are declarative records with small functions.
  Hooks (`HeroHooks`, `RelicHooks`) extend behaviour without touching the engine loop.
- **One source of truth.** Card numbers live in `vals`/`upVals`. The face, the rules text, damage previews and
  the logic all read them. Damage indices are derived from the `{dmg:i}` glyphs of the face.
- **Run as a graph.** `RunNode.next[]`: v1 is a straight line; a branching map needs no model change.
- **Per-frame rendering is diff-based** (`setText`, `setHtml`, `toggle` only write on change). Status chips are
  rebuilt only when the set changes, so presses aren't lost.

## Conventions

### Cards

`CardDef` in `src/data/cards/<class>.ts` plus `card.<id>.name` / `card.<id>.desc` in `en.ts`. That's all.

- `face` grammar: `{kind:i}` icon + value i · `{kind}` icon · `{?kind}` condition shown as (icon) · `{i}` bare
  value · `|` new line · other text as is. Kinds live in `GLYPHS` (`ui/components/cardView.ts`).
- `desc`: `{i}` values, `[kw]` keywords (need `kw.<kw>` and `kw.<kw>.d`).
- Art colour comes from the face (attack / defense / utility / curse) unless `cat` is set. Set `dmg: []` only for
  raw damage that ignores modifiers (e.g. Juggernaut).
- Keywords: exhaust, consume, fleeting, volatile, innate, unique, unplayable. Rarity `unique` = hero special.
- `tests/content.test.ts` checks texts, glyphs, keywords, enemy moves and starter decks.

### Enemies

`EnemyDef` = `main` (frequent attack) + `specials[]` (rotating) + `every` (mains between specials),
optional `onHalf`, `start` statuses. Add a vector sprite to `creatures.ts` (pixelised automatically),
plus `enemy.<id>.name`, `move.<id>` for every move, and `enemy.<id>.half` if it has `onHalf`.
Global difficulty: `CONFIG.enemyHp` / `CONFIG.enemyDmg`; floor scaling in `run.ts` (`enemyScale`).

### Heroes

`HeroDef` in `data/heroes.ts` (hp, maxMana, regen, blockDecay, starter deck with basic cards only + crystals,
`special`, `ability { id, cost, use }`, hooks), a card file, a sprite, `hero.<id>.*` strings, and entries in
`ABILITY_ICON` / `PASSIVE_ICON` (`ui/combat/view.ts`).

### i18n

`t(key)` is typed: literal ids must exist in `en.ts` (a typo fails `tsc`). Keys built at runtime use known
prefixes (`card.`, `enemy.`, `move.`, `status.`, `kw.`, `hero.`, …) and are covered by the content test.
Plurals: `{n|one|other}`. New language: copy `en.ts`, register it in `core/i18n.ts`.

### UI and interaction

- Screens: `show(screen)`; a screen is `{ el, enter?, leave?, frame? }`. Modals: `openModal`, `openInfo` (statuses,
  abilities, moves), `openCardDetail`, `openDeck` (browse, or select-then-confirm with `onPick`).
- Input: tap = act, **hold = inspect** (`onPress`, `onTapOrHold`, shared `LONG_PRESS_MS`). Inspecting pauses the fight
  through `view.inspect(open)`. Tap targets ≥ 44 px.
- Modals close on a full tap on the backdrop (press + release), never on pointerdown.
- Dev hooks (dev server only): `window.__combat` (current `Combat`) and `window.__game` (`run`, `nextNode`,
  `goJourney`, `musicTrack`). E2E tests and screenshot scripts rely on them.

### CSS

- Partials are imported in cascade order by `styles/index.css`; **`responsive.css` must stay last** (short-screen
  overrides). Put shared decor in `decor.css`.
- Tokens in `tokens.css`: inks `--p --b --y --k`, `--paper`, night `--bg --bg2 --void --shadow`, `--fg`.
  Paper panels use `--line` borders and hard `--off` shadows.
- Fonts: `--font-display` (Silkscreen) for title **words** only; anything with **numbers** uses `--font-ui`
  (Jersey 10); long text uses `--font` (Space Grotesk).
- Motion is stepped (`steps(n)`); modals are the exception (fast, smooth). Respect `reduce-motion`.
- Cards: `.card` sets its own `--cw`; to resize, set `--cw` on the card selector itself (e.g. `.x .card { --cw: … }`).
  `cqw` units inside a card refer to the card; the card's own border and shadow use `--cw` maths instead.
- Never let the combat layout change height mid-fight: fixed rows, the enemy sprite size is measured once.

### Pixel art

Icons (`ICONS`, 64×64) and creatures (`CREATURES`, 200×200) are written as SVG with the ink palette in mind and
rasterised at boot by `ui/art/riso.ts` (~26 ms total). `icon(id)` returns a pixel icon tinted by `color` and
`--ink2`; `creature(id)` returns stacked ink layers (kept in register; no offsets).

### Audio

`sfx(id)` (throttled per id). Music: `playMusic(track)`, `playTemporaryMusic` / `endTemporaryMusic` (pause theme).
Tracks are data in `music.ts` (chords, bass, arp, lead, drums, pad). Audio unlocks on the first gesture.

## Testing

- **Unit** (`tests/combat.test.ts`): engine rules. Add a test for every new mechanic.
- **Content** (`tests/content.test.ts`): data integrity.
- **Balance** (`tests/balance.sim.test.ts` + `bot.ts`): heuristic bot win rates; treat them as relative.
- **E2E** (`tests/e2e/smoke.spec.ts`): title, hero carousel, fight → reward swap, layout stability, Start gate,
  pause (music, backdrop tap, main menu), campfire upgrade, compendium, title candles. Use real touch
  (`page.touchscreen.tap`) when the behaviour differs on phones.
- Ad-hoc screenshot scripts live in the git-ignored `screenshots/` folder.

## Known technical debt

- Pixel-art caching (deferred: generation is fast).
- ESLint not available with TS 7: Biome covers lint and format.
- The balance bot underplays the Mage's spell chaining and spends abilities as soon as it can.
