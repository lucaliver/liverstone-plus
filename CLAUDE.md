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
- Bump `version` in `package.json` after every big batch (shown in the home screen's Settings only, with the build time, `__BUILD_TIME__`).
- Keep this file true: fix any line a change makes stale, in the same commit.

## Writing code

### Minimal

- Do what the task asks: no speculative options, flags, abstractions or hooks without a caller. Three similar lines beat a
  premature helper.
- Reuse first: `h`, `$`, `setText`/`setHtml`/`toggle`, `onPress`/`onTapOrHold`, `retrigger` (`ui/dom.ts`), `roomOption`/`closeRoom`/`roomScene`
  (`ui/components/room.ts`), `statusIcon`, `Rng`, `Emitter`, `load`/`store`, existing icons, sfx, modals, CSS tokens.
- No new dependencies without asking. No framework, state library or CSS preprocessor.
- Delete what you replace (dead code, CSS, i18n keys, icons, tests) in the same commit.
- Match the surrounding code: naming, comment density (short `/** */` on non-obvious things; comments say *why*).

### Correct

- Engine (`game/`, `data/`): only `combat.rng`/`Rng` (never `Math.random`) and simulated `dt` (never `Date.now`, timers) so
  seeds replay and the sim stays valid.
- The UI reads `Combat` state and calls its public actions; it never mutates fighters, piles or statuses. Card/enemy effects
  go through `Combat` helpers (`hit`, `gainBlock`, `applyStatus`, `addTempCard`…) so events and previews stay in sync.
- No `any`, no unchecked casts of untyped data, `!` only for DOM elements the template guarantees. Widen union types
  (`Keyword`, `IntentType`…) rather than passing loose strings.
- A screen undoes in `leave()` what `enter()` did: listeners, emitter subscriptions, timers, temporary music.
- **Save data is untrusted.** `loadRun` (`run.ts`), `settings.ts` and `meta.ts` validate every field on load and drop or reset
  what is wrong. Changing a saved shape (or adding an act) → bump `SAVE_VERSION`: there are no players on old versions, so saves of another version are simply dropped, never migrated.
- Ids follow English names. Renaming = rename the id everywhere (no alias table: old saves are not kept alive).
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

Deploy: a push to `master` publishes to GitHub Pages (`.github/workflows/pages.yml`).

## Architecture

```text
src/
  core/        rng (seeded), emitter, i18n (typed keys), save (safe localStorage), util
  i18n/en.ts   every player-facing string
  data/        config (all tuning), acts, statuses, heroes, enemies, perks, hexes, relics, modifiers, cards/<class>.ts
  game/        combat (engine), run (map graph, rewards, save), meta (discoveries, unlocks, records, act stamps), settings, types
  ui/          app (screens, modals), dom
    art/       icons (64×64), creatures (200×200), relics (200×200 stationery sprites), rooms (200×200 picture of each room, and the props of the contract screen and the studio mark: `PROP_SPRITES`), actArt (the skyline behind each act's map title, and the animated scene of its intro), riso (pixel renderer)
    combat/    view, hud, cardLayer, mop, combatFx, combatScreen
    components/ cardView, cardShow, coach, modals, memos, debugMenu, room, moveText, heroSheet, shareSlip, decor
    fx/        particles, floating text, shake, haptics
    screens/   title, studio (the developer card after the contract), heroSelect, journey, reward, rest, promotion, copyRoom, tailor, lostFound, vending, crossTraining, end, compendium
  audio/       sfx (synth), music (sequencer + tracks)
  styles/      index.css imports partials in order; responsive.css stays last
tests/         combat, content, balance.sim (+ bot), e2e/
```

- **The engine is pure and deterministic.** `Combat` never touches the DOM: fixed 1/60 s ticks from a seed, typed
  `CombatEvent`s out. The UI subscribes (`combatFx.ts`) and renders state each frame (`hud.ts`, `cardLayer.ts`).
- **Content is data.** Cards, enemies, heroes, statuses are declarative records with small functions; `HeroHooks` and
  `RelicHooks` extend behaviour. Card numbers live once in `vals`/`upVals`; face, text, previews and logic all read them.
- **A run is a graph drawn as an office floor plan.** `RunNode.next[]` + `lane`; per act (`ACT_DEFS`): a shared opening, two
  lanes linked a couple of times and now and then with one road cut (`LANES`, `LINKS`, `CONFIG.roadCut` in `run.ts`), then the boss, which leads to the next act. Rooms beyond
  `VISION` doors are fogged. The first run has a scripted act 1 (`newRun(…, scripted)`, `FIRST_RUN_*`); its later acts are dealt like any run's. Room types (`NodeType`):
  fight, elite, boss, rest, promotion, copy, each a screen in `ROOMS` (`main.ts`). A new room = `NodeType`, `LANES` entry,
  `ROOMS` screen, `NODE_ICON`, `journey.node.*`/`journey.info.*` strings, and a picture: a sprite `room.<type>` in `art/rooms.ts` plus a `ROOM_SCENE` entry (its motion is a class in `rooms.css`) that the screen shows with `roomScene(type)`.
- **Rendering is diff-based**: `setText`/`setHtml`/`toggle` write only on change; status chips rebuild only when the set changes.

## Conventions

### Cards (`data/cards/<class>.ts` + `card.<id>.name`/`.desc` in `en.ts`)

- `face` grammar: `{kind:i}` icon + value · `{kind}` icon · `{?kind}` condition · `{i}` bare value · `|` new line. Kinds in
  `GLYPHS` (`cardView.ts`). `desc`: `{i}` values, `[kw]` keywords (need `kw.<kw>` and `kw.<kw>.d`).
- Keywords that change the engine are in `Keyword` (`types.ts`); glossary-only ones just need `kw.*` strings.
- Cost, keywords and values of a copy always come from `cardCostOf`/`cardKeywordsOf`/`cardValsOf` (upgrades and **perks**
  included). Set `dmg: []` only for raw damage that ignores modifiers.
- Special mechanics (`ride`, `onOverflow`, `tip`, `wind`, `costDrop`, `inSleeve`, `anchor`, `span`/`tall`/`lockRow`, `pack`) are
  documented on `CardDef`. Curse *cards* live in `neutral.ts` (their rarity is a power level: common = a nuisance, rare = hurts or clogs, epic = shuts down belt space or can't be cleared; they never drop as rewards and can't be upgraded); **hexes** (`hexes.ts`) are a different thing (a curse on one
  belt card, chipped away by taps).
- Every card has its own art; rule icons (glyphs, statuses, intents, map nodes) are shared only within one concept.

### Enemies, heroes, statuses

- `EnemyDef` (`enemies.ts`): `act`, `main` + `specials[]` + `every`, optional `onHalf`, `start`, `block`, belt/virus/rust
  options (all documented on the type). Needs a sprite in `creatures.ts`, `enemy.<id>.name`, `move.<id>` per move,
  `enemy.<id>.half` if it has `onHalf`. Global difficulty: `CONFIG.enemyHp`/`enemyDmg`; floor scaling `CONFIG.floorHp`/`floorDmg`.
- `HeroDef` (`heroes.ts`): hp, mana, sleeve, starter deck (`startUpgraded`: one attack and one defense copy start upgraded), `ability`, hooks, optional `unlock` (checked by `progress()` in
  `meta.ts`), a card file, a sprite, `hero.<id>.*` strings, `ABILITY_ICON`/`PASSIVE_ICON` entries (`ui/combat/view.ts`).
- `StatusDef` (`statuses.ts`) + `status.<id>` and `status.<id>.d` (`{v}` = amount). Its `tone` (required: red force, green poison and healing, teal defence, amber speed and time, purple rules and control, blue mana and tech) is its colour everywhere: chip, drain bar, floater, keyword text, move chips. An enemy move takes its own from what it does (`moveTone`, `moveText.ts`: Snark poisons, so it is green). Inks are `--tone-*` in `tokens.css`, read through `[data-tone]` as `var(--tone)`/`var(--tone-hi)`: tag the element, never name a colour per status or intent. `chip` (`icon`/`short`) says how a move chip names it. Effects are fields or hooks on the def;
  `combat.ts` never names a status for a new effect. `passive: true` marks a permanent enemy trait. `hidden: true` keeps a trait a surprise (no chip, no pre-fight line, no handbook line). A status can also put a window over the belt (`StatusDef.popup`, The Nerd's Update Needed): the engine keeps `Combat.popup` and covers every belt card while it is up (`isCovered`), the HUD shows `.update-popup` and its two buttons call `startUpdate`/`postponeUpdate`; the test bot postpones.

### Act 3 rules (night shift)

New enemy rules are statuses (`statuses.ts`): `microsleep`, `rateLimit` (`capsHits`), `assemblyLine` (`canPlay`), `overtimeCreep`, `lowBattery`, `machineLearning`, `pressure`, `boardroom`; their numbers are constants at the top of the file. `music.ts` has `combat3`/`map3` for the act; its clock runs past midnight (`shift: [22, 30]`).

### Relics

`RelicDef` (`data/relics.ts`): `mods` (sleeve, maxMana, beltSpeed, regen) and `hooks` (`onCombatStart`, `onCardPlayed`, `onDeath`…), `n` = the number its text shows. A hook shows itself with a `relic` event (floating name). Needs a sprite in `art/relics.ts` (keyed by its id, drawn like a creature, most with a cute face), `relic.<id>.name`/`.d`. Run state: `run.relics` (ids) and `run.relicFlags` (once-per-run flags); the hero sheet lists them.

### Management memos (run modifiers)

`ModifierDef` (`data/modifiers.ts`): optional handicaps, open to a hero once the last act's stamp is theirs (`memosOpen` in `meta.ts`). Fields are multipliers (`enemyHp`, `enemyDmg`, `beltMul`, `heroHp`, `restHeal`) or a sum (`rewardCards`); `resolveMods` combines the active ones and `run.ts`/`combat.ts` read the result, never a memo id. The pinned ones are `run.mods` (saved; unknown ids dropped on load) and `meta.memos` (the choice for the next run, set from the hero select's `openMemos`). A new memo = a record + `memo.<id>.name`/`.d` (`{n}` = its `n`); a new kind of effect = a new field read where it applies. The first (scripted) run never has memos.

### i18n

`t(key)` is typed: literal ids must exist in `en.ts`. Runtime-built keys use known prefixes (`card.`, `enemy.`, `move.`,
`status.`, `kw.`, `hero.`…), covered by the content test. Plurals: `{n|one|other}`. New language: copy `en.ts`, register in `core/i18n.ts`.

**Never type a game number in a string.** A number rules text quotes (a duration, a percentage, a threshold) goes in as `{$name}`, read from `VALUES` in `data/values.ts`, which takes it from the constant, status or record that makes the rule work (export the constant, don't copy it). Card values stay `{0}`/`{1}`, relic/perk numbers `{n}`. A test checks every `{$name}` has a value and every value is used.

### UI and interaction

- Screens: `show(screen)`, a screen is `{ el, enter?, leave?, frame? }`. Modals: `openModal`, `openInfo`, `openCardDetail`, `openDeck`.
- Tap = act, **hold = inspect** (`onPress`, `onTapOrHold`, `LONG_PRESS_MS`); inspecting pauses the fight (`view.inspect`). Tap
  targets ≥ 44 px. Modals close on a full tap on the backdrop, never on pointerdown.
- An uncaught error opens the *Machine jam* window (`catchCrashes` in `main.ts`); catch expected rejections yourself.
- Dev hooks (dev server only): `window.__combat`, `window.__game`; e2e and screenshot scripts use them.
- Debug menus (`ui/components/debugMenu.ts`) show only with the Settings switch `debugMenus`; they are temporary.
- Move descriptions (`moveEffect`) tag curses, statuses, hexes and rules with `data-*`; `bindMoveDetails` makes them pressable.
- The belt has two rows by default (`CONFIG.beltRows`); tests needing one pass `beltRows: 1`.
- `EnemyDef.deepBelt` (the Exaggerated Girl): at that second the engine sets `Combat.lowerHidden` (no stash, no sleeve play, no ability; `lowerSink` event → `.sunk` on the screen: everything under the belt slides down, only the mana bar stays) and `CONFIG.sinkTime` later adds a belt row (`rowAdded` → `.deep`, `--rows` on the belt, the row grows in steps). `Combat.beltRows` is therefore mutable.

### CSS

- Partials in cascade order via `styles/index.css`; **`responsive.css` stays last**. Shared decor in `decor.css`.
- Tokens in `tokens.css`, act themes in `acts.css` (inks `--p --b --y --k`, `--paper`, night `--bg --bg2 --void`, brass/paper helpers). Use a token,
  not a raw hex: a test fails on any colour written outside `tokens.css`/`acts.css` (scripts read tokens with `cssColor`; the pixel renderer's inks in `art/riso.ts` are checked against them). Paper panels: `--line` borders, hard `--off` shadows.
- **One source for anything two places must agree on.** Durations script waits on are tokens (`--dur-*`, read with `cssMs`); layers above the screens are `--z-*`; a hero's ink is `HeroDef.ink` and a status's look and particles are `StatusDef.look`/`burst` (no hero or status ids in CSS or UI code); numbers in rules text are `{$name}` values.
- Every act has a colour theme (`styles/acts.css`): the night tokens (`--bg`, `--bg2`, `--bg-dot`, `--night-dot`, the belt stream `--belt`) and the map's (`--map-*`) are re-set under `[data-act='N']`. A screen opts in with `data-act`: the map and the fight set it themselves (the fight by its enemy's act), rooms and rewards get it from `inAct` in `main.ts`; a new act needs its block there, an `actArt` scene and a door into its fights (`ActDef.door` sound, `--door-*` colours in its block, a `[data-act]` leaf in `combat-fx.css`).
- Fonts: `--font-display` (Silkscreen) for title words only; numbers use `--font-ui` (Jersey 10); long text `--font`.
- Motion is stepped (`steps(n)`); modals are the exception. Respect `reduce-motion`. Shared keyframes live once.
- `.card` sets its own `--cw`; resize by setting `--cw` on the card selector. Never let the combat layout change height
  mid-fight. Keep CSS to what Safari 16 supports (no `color-mix`).

### Pixel art and audio

Icons (`ICONS`) and creatures (`CREATURES`) are SVG written for the ink palette and rasterised at boot by `art/riso.ts`;
`icon(id)` / `creature(id)` / `relicArt(id)` return the pixel versions. `dev/art.html` (dev server) previews them all; `dev/og.html` composes the link-preview image `public/og.png` (1200×630) from the same sprites and cards: redraw it after art changes (screenshot `#og`). Audio: `sfx(id)`,
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
- The reward choice is not saved: closing the game on the reward screen loses it.
