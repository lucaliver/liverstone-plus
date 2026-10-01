# Punchcard — technical guide

Real-time conveyor-belt deckbuilder for mobile browsers (portrait): a fantasy adventure run as a factory job, with a bit
of social satire. [README.md](README.md) is the owner's feature overview (Italian, no numbers: balancing never touches it).
This file is the technical guide: read it before changing code. Field-by-field details live in the doc comments of
`src/game/types.ts`; read those, not a copy here.

## Working agreement

- Reply to the owner in **Italian**. Game text is **English** (i18n-ready).
- One task, one commit (git history is the task log). Small tweaks can share a commit.
- Style: **riso pop inks + pixel art, a bit dark/scary**. No gradients for shading, glows, fake 3D, decorative background
  circles, emoji or Unicode symbols as icons (pixel icons only). Industrial/robotic/steampunk touches grow act by act
  (act 1: a factory inside a crypt: bones, candles, a little brass).
- Tone: a run is a **workday**, each act a **shift**. Cards, enemies, moves, curses and UI words use workplace names
  (*Punch*, *Toxic Coworker*, *Deadline*, *Clock in*); satire hits management and coworkers alike. Heroes stay fantasy with a
  light job touch. Statuses and keywords keep plain game names (Poison, Block, Rush…).
- Before handing over: `npm run check` and `npm run e2e` pass; look at the screens you touched (Playwright screenshot at
  390×844 and 375×620).
- Balance: one quick `npm run sim` pass is enough while design moves.
- Bump `version` in `package.json` after every big batch (shown in Settings).
- Keep this file true: fix any line a change makes stale, in the same commit.

## Writing code

### Minimal

- Do what the task asks: no speculative options, flags, abstractions or hooks without a caller. Three similar lines beat a
  premature helper.
- Reuse first: `h`, `$`, `setText`/`setHtml`/`toggle`, `onPress`/`onTapOrHold`, `retrigger` (`ui/dom.ts`), `roomOption`/`closeRoom`
  (`ui/components/room.ts`), `statusIcon`, `Rng`, `Emitter`, `load`/`store`, existing icons, sfx, modals, CSS tokens.
- No new dependencies without asking. No framework, state library or CSS preprocessor.
- Delete what you replace (dead code, CSS, i18n keys, icons, tests) in the same commit.
- Match the surrounding code: naming, comment density (short `/** */` on non-obvious things; comments say *why*).
- Relics are deliberately kept as unused hooks for the future.

### Correct

- Engine (`game/`, `data/`): only `combat.rng`/`Rng` (never `Math.random`) and simulated `dt` (never `Date.now`, timers) so
  seeds replay and the sim stays valid.
- The UI reads `Combat` state and calls its public actions; it never mutates fighters, piles or statuses. Card/enemy effects
  go through `Combat` helpers (`hit`, `gainBlock`, `applyStatus`, `addTempCard`…) so events and previews stay in sync.
- No `any`, no unchecked casts of untyped data, `!` only for DOM elements the template guarantees. Widen union types
  (`Keyword`, `IntentType`…) rather than passing loose strings.
- A screen undoes in `leave()` what `enter()` did: listeners, emitter subscriptions, timers, temporary music.
- **Save data is untrusted.** `loadRun` (`run.ts`), `settings.ts` and `meta.ts` validate every field on load and drop or reset
  what is wrong. Changing a saved shape (or the number of acts) → bump `SAVE_VERSION` or migrate.
- Ids follow English names. Renaming = rename the id + add the old one to `game/renamed.ts` (saves, discoveries, met enemies).
- Test what you change: engine rule → `combat.test.ts`; data shape → `content.test.ts`; flow/screen → `smoke.spec.ts`.

### Future-proof

- Adding a card, enemy, hero, status or relic touches data, i18n and art only. If it needs `if (id === …)` in engine or UI,
  add a generic field or hook instead. Statuses already work this way (`StatusDef`: `timeMul`, `beltMul`, `dealtMul`,
  `takenMul`, `holdsBlock`, `immune`, `ignoresRules`, `autoplay`, `heals`, `strength`, `cutsHits`, `regenMul`, `manaCap`, hooks…).
- No hard-coded hero/enemy ids in UI; lists and icons come from data maps (`HEROES`, `ENEMIES`, `CARDS`, `STATUSES`,
  `ABILITY_ICON`). Tunable numbers live in `data/config.ts` or the records, never inline in UI or engine.
- Every player-facing string goes through `t()`; use `{placeholders}` and plurals, never English word order.
- Layout survives phones from 375×620 up and longer text: no fixed text widths, no positions that depend on string length.

## Stack and commands

Vite + TypeScript (strict), plain DOM through `h()`, CSS, one canvas for particles. Vitest (unit, content, balance sim),
Playwright (mobile viewport, touch), Biome (width 150, single quotes). Fonts: `@fontsource` (Silkscreen, Jersey 10, Space
Grotesk). Audio is WebAudio only. Static build, `localStorage` (prefix `cardstone+:`: keep it).

```bash
npm run dev      # dev server on the LAN
npm run check    # tsc + biome + vitest (before every commit)
npm run e2e      # Playwright smoke tests (own server on :5174)
npm run sim      # balance bot win rates
npm run build    # typecheck + production build
```

Deploy: a push to `master` publishes to GitHub Pages (`.github/workflows/pages.yml`), which also builds the frozen `beta`
branch under `/beta/` (save prefix `cardstone-beta:`; never give another build a prefix starting with `cardstone+:`, `clearAll`
would wipe it). Refresh the beta: commit on `beta`, re-run the workflow.

## Architecture

```text
src/
  core/        rng (seeded), emitter, i18n (typed keys), save (safe localStorage), util
  i18n/en.ts   every player-facing string
  data/        config (all tuning), acts, statuses, heroes, enemies, perks, hexes, relics, cards/<class>.ts
  game/        combat (engine), run (map graph, rewards, save), meta (discoveries, unlocks, records), renamed, settings, types
  ui/          app (screens, modals), dom
    art/       icons (64×64), creatures (200×200), riso (pixel renderer)
    combat/    view, hud, cardLayer, mop, combatFx, combatScreen
    components/ cardView, cardShow, coach, modals, debugMenu, room, moveText, heroSheet, shareSlip, decor
    fx/        particles, floating text, shake, haptics
    screens/   title, heroSelect, journey, reward, rest, promotion, copyRoom, end, compendium
  audio/       sfx (synth), music (sequencer + tracks)
  styles/      index.css imports partials in order; responsive.css stays last
tests/         combat, content, balance.sim (+ bot), e2e/
```

- **The engine is pure and deterministic.** `Combat` never touches the DOM: fixed 1/60 s ticks from a seed, typed
  `CombatEvent`s out. The UI subscribes (`combatFx.ts`) and renders state each frame (`hud.ts`, `cardLayer.ts`).
- **Content is data.** Cards, enemies, heroes, statuses are declarative records with small functions; `HeroHooks` and
  `RelicHooks` extend behaviour. Card numbers live once in `vals`/`upVals`; face, text, previews and logic all read them.
- **A run is a graph drawn as an office floor plan.** `RunNode.next[]` + `lane`; per act (`ACT_DEFS`): a shared opening, two
  lanes linked a couple of times (`LANES`, `LINKS` in `run.ts`), then the boss, which leads to the next act. Rooms beyond
  `VISION` doors are fogged. The first run is scripted (`newRun(…, scripted)`, `FIRST_RUN_*`). Room types (`NodeType`):
  fight, elite, boss, rest, promotion, copy, each a screen in `ROOMS` (`main.ts`). A new room = `NodeType`, `LANES` entry,
  `ROOMS` screen, `NODE_ICON`, `journey.node.*`/`journey.info.*` strings.
- **Rendering is diff-based**: `setText`/`setHtml`/`toggle` write only on change; status chips rebuild only when the set changes.

## Conventions

### Cards (`data/cards/<class>.ts` + `card.<id>.name`/`.desc` in `en.ts`)

- `face` grammar: `{kind:i}` icon + value · `{kind}` icon · `{?kind}` condition · `{i}` bare value · `|` new line. Kinds in
  `GLYPHS` (`cardView.ts`). `desc`: `{i}` values, `[kw]` keywords (need `kw.<kw>` and `kw.<kw>.d`).
- Keywords that change the engine are in `Keyword` (`types.ts`); glossary-only ones just need `kw.*` strings.
- Cost, keywords and values of a copy always come from `cardCostOf`/`cardKeywordsOf`/`cardValsOf` (upgrades and **perks**
  included). Set `dmg: []` only for raw damage that ignores modifiers.
- Special mechanics (`ride`, `onOverflow`, `tip`, `wind`, `costDrop`, `inSleeve`, `anchor`, `span`/`tall`/`lockRow`, `pack`) are
  documented on `CardDef`. Curse *cards* live in `neutral.ts`; **hexes** (`hexes.ts`) are a different thing (a curse on one
  belt card, chipped away by taps).
- Every card has its own art; rule icons (glyphs, statuses, intents, map nodes) are shared only within one concept.

### Enemies, heroes, statuses

- `EnemyDef` (`enemies.ts`): `act`, `main` + `specials[]` + `every`, optional `onHalf`, `start`, `block`, belt/virus/rust
  options (all documented on the type). Needs a sprite in `creatures.ts`, `enemy.<id>.name`, `move.<id>` per move,
  `enemy.<id>.half` if it has `onHalf`. Global difficulty: `CONFIG.enemyHp`/`enemyDmg`; floor scaling `CONFIG.floorHp`/`floorDmg`.
- `HeroDef` (`heroes.ts`): hp, mana, sleeve, starter deck (`startUpgraded`: one attack and one defense copy start upgraded), `ability`, hooks, optional `unlock` (checked by `progress()` in
  `meta.ts`), a card file, a sprite, `hero.<id>.*` strings, `ABILITY_ICON`/`PASSIVE_ICON` entries (`ui/combat/view.ts`).
- `StatusDef` (`statuses.ts`) + `status.<id>` and `status.<id>.d` (`{v}` = amount). Effects are fields or hooks on the def;
  `combat.ts` never names a status for a new effect. `passive: true` marks a permanent enemy trait.

### i18n

`t(key)` is typed: literal ids must exist in `en.ts`. Runtime-built keys use known prefixes (`card.`, `enemy.`, `move.`,
`status.`, `kw.`, `hero.`…), covered by the content test. Plurals: `{n|one|other}`. New language: copy `en.ts`, register in `core/i18n.ts`.

### UI and interaction

- Screens: `show(screen)`, a screen is `{ el, enter?, leave?, frame? }`. Modals: `openModal`, `openInfo`, `openCardDetail`, `openDeck`.
- Tap = act, **hold = inspect** (`onPress`, `onTapOrHold`, `LONG_PRESS_MS`); inspecting pauses the fight (`view.inspect`). Tap
  targets ≥ 44 px. Modals close on a full tap on the backdrop, never on pointerdown.
- An uncaught error opens the *Machine jam* window (`catchCrashes` in `main.ts`); catch expected rejections yourself.
- Dev hooks (dev server only): `window.__combat`, `window.__game`; e2e and screenshot scripts use them.
- Debug menus (`ui/components/debugMenu.ts`) show only with the Settings switch `debugMenus`; they are temporary.
- Move descriptions (`moveEffect`) tag curses, statuses, hexes and rules with `data-*`; `bindMoveDetails` makes them pressable.
- The belt has two rows by default (`CONFIG.beltRows`); tests needing one pass `beltRows: 1`.

### CSS

- Partials in cascade order via `styles/index.css`; **`responsive.css` stays last**. Shared decor in `decor.css`.
- Tokens in `tokens.css` (inks `--p --b --y --k`, `--paper`, night `--bg --bg2 --void`, brass/paper helpers). Use a token,
  not a raw hex. Paper panels: `--line` borders, hard `--off` shadows.
- Fonts: `--font-display` (Silkscreen) for title words only; numbers use `--font-ui` (Jersey 10); long text `--font`.
- Motion is stepped (`steps(n)`); modals are the exception. Respect `reduce-motion`. Shared keyframes live once.
- `.card` sets its own `--cw`; resize by setting `--cw` on the card selector. Never let the combat layout change height
  mid-fight. Keep CSS to what Safari 16 supports (no `color-mix`).

### Pixel art and audio

Icons (`ICONS`) and creatures (`CREATURES`) are SVG written for the ink palette and rasterised at boot by `art/riso.ts`;
`icon(id)` / `creature(id)` return the pixel versions. `dev/art.html` (dev server) previews them all. Audio: `sfx(id)`,
`playMusic(track)`, `playTemporaryMusic`/`endTemporaryMusic`; tracks are data in `music.ts`.

## Testing

- `combat.test.ts`: engine rules (add one per mechanic). `content.test.ts`: data integrity. `balance.sim.test.ts` + `bot.ts`:
  bot win rates, relative only. `tests/e2e/smoke.spec.ts`: flows on a mobile viewport with real touch where it matters;
  `freshGame` unlocks every hero unless `locked`.
- Other browsers: `npx playwright test --browser=webkit` passes; Firefox needs a config without `isMobile`.
- Screenshot scripts go in the git-ignored `screenshots/`.

## Known technical debt

- Pixel-art caching (deferred: generation is fast).
- Biome covers lint and format (no ESLint with TS 7).
- The balance bot underplays the Mage's chaining and spends abilities as soon as it can.
- Status look in the UI (`hud.ts` CSS classes per status, `combatFx.ts` bursts) still names a few status ids.
- The reward choice is not saved: closing the game on the reward screen loses it.
- `z-index` values have no shared scale.
