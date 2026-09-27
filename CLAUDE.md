# Punchcard — technical guide

Real-time conveyor-belt deckbuilder for mobile browsers (portrait): a fantasy adventure run as a factory job,
with a bit of social satire. A feature overview lives in
[README.md](README.md) (Italian, the owner's doc; no exact numbers or task lists there, so balancing never touches it).
This file is the technical guide: read it before changing code.

## Working agreement

- Reply to the owner in **Italian**. Game text is **English** (i18n-ready).
- Work task by task; **commit after each task** with a clear message (git history is the task log).
- Official style: **riso pop inks + pixel art, a bit dark/scary**. Never add gradients for shading, glows, fake 3D,
  decorative background circles, emoji or Unicode symbols as icons (use pixel icons). Industrial, robotic and
  steampunk touches grow act by act: act 1 is a factory inside the crypt (bones, candles, a little brass).
- Tone: a run is a **workday**, each act a **shift** (morning, afternoon, night). Cards, enemies, moves, curses and
  UI words use workplace names (*Punch*, *Toxic Coworker*, *Deadline*, *Clock in* to start a fight); satire hits management and
  coworkers alike. Heroes stay fantasy with a light job touch. Statuses and keywords keep plain game names
  (Poison, Block, Rush…) so rules stay readable.
- Before handing over: `npm run check` and `npm run e2e` must pass, then look at the screens you touched
  (Playwright screenshot at 390×844 and at a short height such as 375×620).
- Balance: don't spend long on simulations while design is moving; one quick sim pass is enough.
- Keep this file true: when a change makes a line here stale (a name, a path, a rule), fix it in the same commit.

## Writing code

### Minimal

- Do what the task asks, nothing speculative: no options, flags, abstractions or "for later" hooks without a
  current caller. Three similar lines beat a premature helper.
- Reuse before writing: `h`, `$`, `setText`/`setHtml`/`toggle`, `onPress`/`onTapOrHold` (`ui/dom.ts`), `Rng`,
  `Emitter`, `load`/`store` (`core/save.ts`), existing icons, sfx, modals and CSS tokens. Grep for a similar
  feature first and follow its shape.
- No new dependencies without asking the owner. No framework, no state library, no CSS preprocessor.
- Delete what you replace: dead code, unused CSS rules, i18n keys, icons and tests go in the same commit.
  `noUnusedLocals`/`noUnusedParameters` catch only part of it.
- Match the surrounding code: naming, comment density (short `/** */` on non-obvious fields and functions,
  comments explain *why*), file size. Split a file only when it gains a clear responsibility.

### Correct

- Engine code (`game/`, `data/`) uses `combat.rng` / `Rng` only (never `Math.random`), and simulated time
  (`dt` from `tick`) only (never `Date.now`, timers or `performance.now`), so seeds replay exactly and
  the balance sim stays valid.
- The UI reads `Combat` state and calls its public actions (`playCard`, `stash`, `useAbility`, …); it never
  mutates fighters, piles or statuses directly. Anything a card or enemy does goes through `Combat` helpers
  (`hit`, `gainBlock`, `applyStatus`, `addTempCard`, …) so events, previews and hooks stay in sync.
- No `any`, no unchecked casts of untyped data; `!` only where the DOM element is certain (own template).
  Widen union types (`Keyword`, `IntentType`, …) instead of passing loose strings.
- Every screen undoes in `leave()` what it did in `enter()`: window/document listeners, emitter subscriptions,
  timers, temporary music. Elements inside the screen's own `el` need no cleanup.
- Save data is untrusted: read it through `core/save.ts`, validate on load, and when its shape changes bump
  `version` in `run.ts` (or migrate) instead of letting old saves crash the game.
- Test what you change: engine rule → `combat.test.ts`; new data shape → `content.test.ts`; new flow or screen
  interaction → `smoke.spec.ts`. Fix a bug with a test that fails first when it's cheap to write.

### Future-proof

- Adding a card, enemy, hero, status or relic should touch data, i18n and art only. If it needs an `if (id === …)`
  in the engine or UI, add a generic field or hook instead.
- No hard-coded hero or enemy ids in UI; lists and icons come from data maps (`HEROES`, `ENEMIES`, `CARDS`,
  `STATUSES`, `ABILITY_ICON`). Tunable numbers live in `data/config.ts` or the records, never inline in UI or engine.
- Every player-facing string goes through `t()`; no text concatenation that assumes English word order
  (use `{placeholders}` and plurals).
- Layout must survive phones from 375×620 to tall screens and text that may grow in other languages: no fixed
  widths for text boxes, no absolute positions that depend on string length.

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
  data/        config, statuses, heroes, enemies, perks, hexes, relics (empty, hooks ready), cards/<class>.ts
  game/        combat.ts (engine), run.ts (node graph, rewards, saves), meta.ts (discovery), settings, types
  ui/          app.ts (screens + modals), dom.ts (h, onPress, onTapOrHold, LONG_PRESS_MS)
    art/       icons.ts (64×64 vector icons), creatures.ts (200×200 vector sprites), riso.ts (pixel renderer)
    combat/    view (DOM + refs + shared state), hud, cardLayer (belt/sleeve/input), combatFx (events → FX), combatScreen
    components/cardView (card DOM, face glyphs), modals (settings, deck, card detail, info), moveText (moves, enemy
               pattern and traits), heroSheet (hero features and in-run sheet), decor
    fx/        particles, floating text, shake, haptics
    screens/   title, heroSelect, journey, reward, rest, promotion, end, compendium
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
- **Run as a graph.** `RunNode.next[]` + `lane`: each act is a shared first fight, two lanes (`LANES` in `run.ts`) with
  `LINKS` links between them (diagonal upward, or flat both ways; never on neighbouring floors), and the boss. `advance(run, to)` moves along a link; `run.path` records the nodes entered.
- **Per-frame rendering is diff-based** (`setText`, `setHtml`, `toggle` only write on change). Status chips are
  rebuilt only when the set changes, so presses aren't lost.

## Conventions

### Cards

`CardDef` in `src/data/cards/<class>.ts` plus `card.<id>.name` / `card.<id>.desc` in `en.ts`. That's all
(`cards/index.ts` collects every class array into `CARDS`; a new class file must be added there). Curses live in
`neutral.ts` (`curseCards`, rarity `special`). `pack` marks cards locked behind an unlock pack.

- `face` grammar: `{kind:i}` icon + value i · `{kind}` icon · `{?kind}` condition shown as (icon) · `{i}` bare
  value · `|` new line · other text as is. Kinds live in `GLYPHS` (`ui/components/cardView.ts`).
- `desc`: `{i}` values, `[kw]` keywords (need `kw.<kw>` and `kw.<kw>.d`).
- Art colour comes from the face (attack / defense / utility / curse) unless `cat` is set. Set `dmg: []` only for
  raw damage that ignores modifiers (e.g. `juggernaut`).
- Keyword flags (`Keyword` type, change engine behaviour): exhaust, consume, fleeting, volatile, innate, unique,
  unplayable. Glossary-only keywords (`[rush]`, `[power]`, `[x]`, statuses…) just need their `kw.*` strings.
  Rarity `unique` = hero special.
- `span` (belt widths) makes a card wide: it rides over the cards ahead of it (Gatekeeping).
- Cost, keywords and values of a copy come from `cardCostOf` / `cardKeywordsOf` / `cardValsOf` (`data/cards/index.ts`),
  shared by engine and UI: they include upgrades and **perks** (`data/perks.ts`, permanent per copy, `CardInst.perks`).
- **Hexes** (`data/hexes.ts`) are curses on one combat card (`CombatCard.hex`, cast by a move's `hex`): taps chip them
  through `playCard`, then the card thaws. Curse *cards* are a different thing (temporary cards in `neutral.ts`).
- `tests/content.test.ts` checks texts, glyphs, keywords, enemy moves and starter decks.

### Enemies

`EnemyDef` = `main` (frequent attack) + `specials[]` (rotating) + `every` (mains between specials),
optional `onHalf`, `start` statuses. Add a vector sprite to `creatures.ts` (pixelised automatically),
plus `enemy.<id>.name`, `move.<id>` for every move, and `enemy.<id>.half` if it has `onHalf`.
Global difficulty: `CONFIG.enemyHp` / `CONFIG.enemyDmg`; floor scaling in `run.ts` (`enemyScale`).

### Heroes

`HeroDef` in `data/heroes.ts` (hp, maxMana, regen, blockDecay, `sleeve` slots, starter deck with basic cards only + crystals,
`special`, `ability { id, cost, use }`, hooks), a card file, a sprite, `hero.<id>.*` strings, and entries in
`ABILITY_ICON` / `PASSIVE_ICON` (`ui/combat/view.ts`).

### Statuses

`StatusDef` in `data/statuses.ts` (`kind`: timed / stacks / dot, `good`, `icon`) plus `status.<id>` and
`status.<id>.d` (`{v}` = amount). Their effect is applied where it matters in `combat.ts` (damage, ticks, decay).
Rule statuses carry their own hooks instead: `canPlay` (returns the i18n key of why a card can't be played) and
`onCardPlayed`; `passive: true` marks a permanent enemy trait (no number on the chip).

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
- Icons: every card has its own art; rule icons (glyphs, statuses, intents, tags, map nodes) are shared only within
  one concept. `content.test.ts` enforces the card side.
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
rasterised at boot by `ui/art/riso.ts` (~26 ms total); `main.ts` passes the sources to `preloadArt` (the renderer
imports no art module, so there is no import cycle). `icon(id)` returns a pixel icon tinted by `color` and
`--ink2`; `creature(id)` returns stacked ink layers (kept in register; no offsets).

### Audio

`sfx(id)` (throttled per id). Music: `playMusic(track)`, `playTemporaryMusic` / `endTemporaryMusic` (pause theme).
Tracks are data in `music.ts` (chords, bass, arp, lead, drums, pad). Audio unlocks on the first gesture.

## Testing

- **Unit** (`tests/combat.test.ts`): engine rules. Add a test for every new mechanic.
- **Content** (`tests/content.test.ts`): data integrity.
- **Balance** (`tests/balance.sim.test.ts` + `bot.ts`): heuristic bot win rates; treat them as relative.
- **E2E** (`tests/e2e/smoke.spec.ts`): title, hero carousel, fight → reward swap, layout stability, Start gate,
  pause (music, backdrop tap, main menu), break room upgrade, map lane choice, compendium, title props. Use real touch
  (`page.touchscreen.tap`) when the behaviour differs on phones.
- Ad-hoc screenshot scripts live in the git-ignored `screenshots/` folder. `dev/art.html` (open it on the dev
  server) previews every creature sprite and icon after pixelisation.

## Known technical debt

- Pixel-art caching (deferred: generation is fast).
- ESLint not available with TS 7: Biome covers lint and format.
- The balance bot underplays the Mage's spell chaining and spends abilities as soon as it can.
