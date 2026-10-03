# Punchcard — technical guide

Real-time conveyor-belt deckbuilder for mobile browsers (portrait): a fantasy adventure run as a factory job, with a bit
of social satire. [README.md](README.md) is the owner's feature overview (Italian, no numbers: balancing never touches it).
This file is the technical guide: read it before changing code. Field-by-field details live are in the doc comments of
`src/game/types.ts`.

## Working agreement

- Reply to the owner in **Italian**. Game text is **English** (i18n-ready).
- One task, one commit (git history is the task log). Small tweaks can share a commit.
- Style: **riso pop inks + pixel art, a bit dark/scary**. NO gradients for shading, glows, fake 3D, decorative background
  circles, emoji or Unicode symbols as icons (pixel icons only). Industrial/robotic/steampunk/chill/strange vibes change act by act.
- Tone: a run is a **workday**, each act a **shift**. Cards, enemies, moves, curses and UI words use workplace names, media or pop or history or political references; satire hits management and coworkers alike. Heroes stay fantasy with a
  light job touch. Statuses and keywords keep plain game names (Poison, Block, Rush…).
- Before handing over: `npm run check` and `npm run e2e` pass. Only for important UI changes, look at the screens you touched with one
  Playwright screenshot at 390×844 (375×620 only if the layout is tight), taken once at the end. **Delete every screenshot right after looking at it** (scratchpad ones too): no image is left around, ever.
- Balance: one quick `npm run sim` pass is enough while design moves.
- Bump `version` in `package.json` after every big batch (shown in the home screen's Settings only, with the build time, `__BUILD_TIME__`).
- Keep this file true: fix any line a change makes stale, in the same commit.
- The shell is macOS (BSD tools, zsh): never `sed -i` or other GNU-only flags. Edit files with the Edit tool (or a short Python script), and check that an edit really landed before committing.

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
  `takenMul`, `holdsBlock`, `immune`, `ignoresRules`, `autoplay`, `heals`, `strength`, `cutsHits`, `regenMul`, `manaCap`, `keeps`, hooks…).
- No hard-coded hero/enemy ids in UI; lists and icons come from data maps (`HEROES`, `ENEMIES`, `CARDS`, `STATUSES`,
  `ABILITY_ICON`). Tunable numbers live in `data/config.ts` or the records, never inline in UI or engine.
- Every player-facing string goes through `t()`; use `{placeholders}` and plurals, never English word order.
- Layout survives phones from 375×620 up and longer text: no fixed text widths, no positions that depend on string length.
- Use best practice, centralised stuff, no repetition, no hardcoded.

## Stack and commands

Vite + TypeScript (strict), plain DOM through `h()`, CSS, one canvas for particles. Vitest (unit, content, balance sim),
Playwright (mobile viewport, touch), Biome (width 150, single quotes). Fonts: `@fontsource` (Silkscreen, Jersey 10, Chakra Petch). Audio is WebAudio only. Static build, `localStorage` (prefix `cardstone+:`: keep it).

```bash
npm run dev      # dev server on the LAN
npm run check    # tsc + biome + vitest (before every commit)
npm run e2e      # Playwright smoke tests (own server on :5174)
npm run sim      # balance bot win rates
npm run stats    # static balance numbers from the data (no bot): writes BALANCE.md (git-ignored, not kept in the repo)
npm run build    # typecheck + production build
```

Deploy: a push to `master` publishes to GitHub Pages (`.github/workflows/pages.yml`).

## Architecture

```text
src/
  core/        rng (seeded), emitter, i18n (typed keys), save (safe localStorage), util
  i18n/        en.ts (every player-facing string, the source), it.ts (Italian: `Record<EnKey, string>`, same placeholders)
  data/        config (all tuning), acts, statuses, heroes, enemies, perks, hexes, relics, modifiers, cards/<class>.ts
  game/        combat (engine), run (map graph, rewards, save), meta (discoveries, unlocks, records, act stamps), settings, types
  ui/          app (screens, modals), dom
    art/       icons (64×64), creatures (200×200), relics (200×200 stationery sprites), rooms (200×200 picture of each room, and the props of the contract screen and the studio mark: `PROP_SPRITES`), actArt (the skyline behind each act's map title, and the animated scene of its intro), riso (pixel renderer)
    combat/    view, hud, cardLayer, mop, combatFx, combatScreen
    components/ cardView, cardShow, coach, modals, memos, debugMenu, room, moveText, heroSheet, shareSlip, decor
    fx/        particles, floating text, shake, haptics
    screens/   title, studio (the developer card after the contract), heroSelect, journey, reward, rest, promotion, copyRoom, tailor, lostFound, vending, crossTraining, end, compendium
  analytics/   anonymous play counters: `index.ts` (what is counted and when), `goatcounter.ts` (the only file that knows the service)
  audio/       sfx (synth), music (sequencer + tracks)
  styles/      index.css imports partials in order; responsive.css stays last
tests/         combat, content, balance.sim (+ bot), balance.stats, e2e/
```

- **The engine is pure and deterministic.** `Combat` never touches the DOM: fixed 1/60 s ticks from a seed, typed
  `CombatEvent`s out. The UI subscribes (`combatFx.ts`) and renders state each frame (`hud.ts`, `cardLayer.ts`).
- **Content is data.** Cards, enemies, heroes, statuses are declarative records with small functions; `HeroHooks` and
  `RelicHooks` extend behaviour. Card numbers live once in `vals`/`upVals`; face, text, previews and logic all read them.
- **A run is a graph drawn as an office floor plan.** `RunNode.next[]` + `lane`; per act (`ACT_DEFS`): a shared opening, two
  lanes linked a couple of times and now and then with one road cut (`LANES`, `LINKS`, `CONFIG.roadCut` in `run.ts`), then the boss, which leads to the next act. Rooms beyond
  `VISION` doors are fogged. The first run has a scripted act 1 (`newRun(…, scripted)`, `FIRST_RUN_*`); its later acts are dealt like any run's. Only the rooms reachable next are in sight (`VISION`, `journey.ts`; the boss always is). Room types (`NodeType`):
  fight, elite, boss, rest, promotion, copy, each a screen in `ROOMS` (`main.ts`). A new room = `NodeType`, `LANES` entry,
  `ROOMS` screen, `NODE_ICON`, `journey.node.*`/`journey.info.*` strings, and a picture: a sprite `room.<type>` in `art/rooms.ts` plus a `ROOM_SCENE` entry (its motion is a class in `rooms.css`) that the screen shows with `roomScene(type)`.
- **Beg to stay**: the first time a run's hero would lose a fight (`CombatSetup.canBeg`, once per run through the saved `relicFlags[BEG_FLAG]`) the engine freezes (`Combat.begging`, event `beg`) and the UI asks; `Combat.beg(accept)` answers (`CONFIG.beg`). The balance bot never begs.
- **Run history**: `meta.history` (`RunLog`, newest `CONFIG.historyMax`), written by `finishRun`/`abandonRun`; the handbook's History page lists it. The handbook turns pages with a sideways swipe (`PAGES` in `compendium.ts`).
- **Rewards**: `rollRewards` deals each card from `rewardOdds`, but the first `rewardGuarantee(kind, act)` cards come from that rarity or above (a fight: a Rare in act 1, an Epic in act 2, two in act 3); the offer is sorted by rarity, then cost. **Map layouts** are dealt again (`dealLayout`, `run.ts`) until no room offers two choices of the same kind.
- **The reward on offer is saved** (`RunState.reward`, set by `offerReward` after a fight, dropped by `nextNode`): Continue reopens the reward screen with the same cards instead of the map.
- **Rendering is diff-based**: `setText`/`setHtml`/`toggle` write only on change; status chips rebuild only when the set changes.

## Conventions

### Cards (`data/cards/<class>.ts` + `card.<id>.name`/`.desc` in `en.ts`)

- `face` grammar: `{kind:i}` icon + value · `{kind}` icon · `{?kind}` condition ("if", in brackets) · `{*kind}` trigger ("every time", a loop icon) · `{i}` bare value · `|` new line. Kinds in
  `GLYPHS` (`cardView.ts`). `desc`: `{i}` values, `[kw]` keywords (need `kw.<kw>` and `kw.<kw>.d`).
- Keywords that change the engine are in `Keyword` (`types.ts`); glossary-only ones just need `kw.*` strings.
- **A card's `type` is the colour of its background**: attack pink, defense blue, skill yellow, power grey, curse green (`--cat-*` tokens, `data-type` on the card). There are no other types (no spell, no potion): rules and effects name a type ("every attack", "every defence card") and the player sees it on the card.
- Cost, keywords and values of a copy always come from `cardCostOf`/`cardKeywordsOf`/`cardValsOf` (upgrades and **perks**
  included). Set `dmg: []` only for raw damage that ignores modifiers.
- Special mechanics (`ride`, `onOverflow`, `tip`, `sweep`, `costDrop`, `inSleeve`, `span`/`tall`/`lockRow`, `pack`) are
  documented on `CardDef`. Curse *cards* live in `neutral.ts` (their rarity is a power level: common = a nuisance, rare = hurts or clogs, epic = shuts down belt space or can't be cleared; they never drop as rewards and can't be upgraded); **hexes** (`hexes.ts`) are a different thing (a curse on one
  belt card, chipped away by taps).
- Every card has its own art; rule icons (glyphs, statuses, intents, map nodes) are shared only within one concept.

### Enemies, heroes, statuses

- `EnemyDef` (`enemies.ts`): `act`, `main` + `specials[]` + `every`, optional `onHalf`, `start`, `block`, belt/virus/rust
  options (all documented on the type). Needs a sprite in `creatures.ts`, `enemy.<id>.name`, `move.<id>` per move,
  `enemy.<id>.half` if it has `onHalf`. Global difficulty: `CONFIG.enemyHp`/`enemyDmg`; floor scaling `CONFIG.floorHp`/`floorDmg`. Elites and bosses climb by act (elite HP 90/115/140, boss 190/220/260). `ruleBreaker` marks enemies that bend belt or play rules: act 2's first fight is always one (`addAct`, `run.ts`).
- `HeroDef` (`heroes.ts`): hp, mana, sleeve, starter deck (`startUpgraded`: one attack and one defense copy start upgraded), `ability`, hooks, optional `unlock` (checked by `progress()` in
  `meta.ts`), a card file, a sprite, `hero.<id>.*` strings, `ABILITY_ICON`/`PASSIVE_ICON` entries (`ui/combat/view.ts`).
- `StatusDef` (`statuses.ts`; `progress` + `cue` draw a status with a trigger as a filling bar and play a sound when `Combat.cue` fires; `look` also tints the hero's portrait) + `status.<id>` and `status.<id>.d` (`{v}` = amount). Its `tone` (required: red force, green poison and healing, teal defence, amber speed and time, purple rules and control, blue mana and tech) is its colour everywhere: chip, drain bar, floater, keyword text, move chips. An enemy move takes its own from what it does (`moveTone`, `moveText.ts`: Snark poisons, so it is green). Inks are `--tone-*` in `tokens.css`, read through `[data-tone]` as `var(--tone)`/`var(--tone-hi)`: tag the element, never name a colour per status or intent. `chip` (`icon`/`short`) says how a move chip names it. Effects are fields or hooks on the def;
  `combat.ts` never names a status for a new effect. `passive: true` marks a permanent enemy trait. `hidden: true` keeps a trait a surprise (no chip, no pre-fight line, no handbook line). A status can also put a window over the belt (`StatusDef.popup`, The Nerd's Update Needed): the engine keeps `Combat.popup` and covers every belt card while it is up (`isCovered`), the HUD shows `.update-popup` and its two buttons call `startUpdate`/`postponeUpdate`; the test bot postpones.

### Act 3 rules (night shift)

New enemy rules are statuses (`statuses.ts`): `microsleep`, `rateLimit` (`capsHits`), `assemblyLine` (`canPlay`), `overtimeCreep`, `lowBattery`, `machineLearning`, `pressure`, `boardroom`, `understudy`, `vipTreatment` (`critOnDrag`: the VIP Client turns an attack the hero drags onto the stage critical, a tap doesn't: `Combat.playCard(uid, 'tap' | 'drag' | 'auto')`; `handsTied` on Stun: no play or ability by hand, stashing still works, while a card slipping off still plays itself under Autopilot: the Factory Siren's song puts both on you); their numbers are constants at the top of the file. `music.ts` has `combat3`/`map3` for the act (act 2's map is the sunny `map2`); its clock runs past midnight (`shift: [22, 30]`).

### Relics

`RelicDef` (`data/relics.ts`): `mods` (sleeve, maxMana, regen, `beltSpeed` a multiplier, `startBelt` how far in the belt has run when the fight opens, `rewardCards` extra cards on offer: the reward grid widens with `--swap-n`) and `hooks` (`onCombatStart`, `onCardPlayed`, `onCardExpired`, `onDeath`…), `n` = the number its text shows. A relic that triggers every so often has `progress` (0..1): the fight shows it as a chip with a filling bar in the hero's status row. A hook shows itself with a `relic` event (floating name). Needs a sprite in `art/relics.ts` (keyed by its id, drawn like a creature, most with a cute face), `relic.<id>.name`/`.d`. Run state: `run.relics` (ids) and `run.relicFlags` (once-per-run flags); the hero sheet lists them.

### Management memos (run modifiers)

`ModifierDef` (`data/modifiers.ts`): optional handicaps, open to a hero once the last act's stamp is theirs (`memosOpen` in `meta.ts`). Fields are multipliers (`enemyHp`, `enemyDmg`, `beltMul`, `heroHp`, `restHeal`) or a sum (`rewardCards`); `resolveMods` combines the active ones and `run.ts`/`combat.ts` read the result, never a memo id. The pinned ones are `run.mods` (saved; unknown ids dropped on load) and `meta.memos` (the choice for the next run, set from the hero select's `openMemos`). A new memo = a record + `memo.<id>.name`/`.d` (`{n}` = its `n`); a new kind of effect = a new field read where it applies. The first (scripted) run never has memos.

### Analytics

`src/analytics/`: anonymous counters (no id, no deck, no seed), sent as GoatCounter events (`<version>/fight/<enemy>/<hero>/win|lose`, `offered/<card>`, `pick/<card>`, `cut/<card>`, `skip`, `run/<hero>/win|lose|abandon[-memo]`, `death/act<N>-floor<M>`). Called only from the flow (`main.ts`, the reward screen), never from the engine. Runs under a memo send only their tagged run result. The endpoint is `VITE_STATS_URL` (repository variable `STATS_URL` in the Pages workflow); unset = nothing is sent (dev, tests). Settings switch `analytics` (on by default) turns it off; turning on the debug menus switches it off too. Sampled data: ad blockers hide some players. To swap the service rewrite `goatcounter.ts`; to remove it delete the folder, the call sites, the setting and its strings.

### i18n

`t(key)` is typed: literal ids must exist in `en.ts`. Runtime-built keys use known prefixes (`card.`, `enemy.`, `move.`,
`status.`, `kw.`, `hero.`…), covered by the content test. Plurals: `{n|one|other}`. Languages: `en` (default) and `it`, picked in Settings (`settings.locale`, reloads the page). A new string goes in **both** files (a test checks same keys and placeholders: `{n}`, `{$name}`, `[kw]`); a new language: copy `en.ts`, register in `core/i18n.ts`. Italian keeps game words translated (Blocco, Veleno, Forza…) and the workplace-satire tone.

**Never type a game number in a string.** A number rules text quotes (a duration, a percentage, a threshold) goes in as `{$name}`, read from `VALUES` in `data/values.ts`, which takes it from the constant, status or record that makes the rule work (export the constant, don't copy it). Card values stay `{0}`/`{1}`, relic/perk numbers `{n}`. A test checks every `{$name}` has a value and every value is used.

NOTE: italian translations may not be litteral english translation, or could keep the international term.

### UI and interaction

- Screens: `show(screen)`, a screen is `{ el, enter?, leave?, frame? }`. Modals: `openModal`, `openInfo`, `openCardDetail`, `openDeck`.
- Tap = act, **hold = inspect** (`onPress`, `onTapOrHold`, `LONG_PRESS_MS`); inspecting pauses the fight (`view.inspect`). Tap
  targets ≥ 44 px. Modals close on a full tap on the backdrop, never on pointerdown.
- Desktop: above 560 px wide the column gets a poster frame (`shell.css`); hover feedback only under `(hover: hover) and (pointer: fine)`. Mouse: right click on a card inspects it. Keys in a fight (`onKey`, `combatScreen.ts`): Space/P/Esc pause (Space/P also resume), Space/Enter start, A ability, D deck, 1-9 sleeve slot; open windows keep their own keys (Esc closes them).
- An uncaught error opens the *Machine jam* window (`catchCrashes` in `main.ts`); catch expected rejections yourself.
- Dev hooks (dev server only): `window.__combat`, `window.__game`; e2e and screenshot scripts use them.
- Debug menus (`ui/components/debugMenu.ts`) show only with the Settings switch `debugMenus`; they are temporary.
- Move descriptions (`moveEffect`) tag curses, statuses, hexes and rules with `data-*`; `bindMoveDetails` makes them pressable.
- The belt has two rows by default (`CONFIG.beltRows`); tests needing one pass `beltRows: 1`.
- `EnemyDef.deepBelt` (the Exaggerated Girl): at that second the engine sets `Combat.lowerHidden` (no stash, no sleeve play, no ability; `lowerSink` event → `.sunk` on the screen: everything under the belt slides down, only the mana bar stays) and `CONFIG.sinkTime` later adds a belt row (`rowAdded` → `.deep`, `--rows` on the belt, the row grows in steps). `Combat.beltRows` is therefore mutable.
- `EnemyDef.beltOff` (the Power Socket, a surprise): at that second the engine sets `Combat.beltDead` (`beltBoost` is 0, `beltDead` event → `.belt-dead` on the combat screen, its speech) and the belt only moves through `Combat.crankBelt(move)`, in belt widths (negative = back, stopped by the rearmost card; new cards still arrive with the travel, `settleBelt`). The `.crank` knob appears in the action row (`crank.ts`): it follows the finger's angle and one full clockwise turn is `CONFIG.crankTurn` belt widths, with a buzz every `CONFIG.crankBuzz` degrees. The track stripes follow `Combat.beltCranked`.

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
  bot win rates, relative only. `balance.stats.test.ts`: per-mana card output and enemy threat computed from the data (`npm run stats` writes a git-ignored `BALANCE.md` to read: generate it when you need the numbers, never commit it). `tests/e2e/smoke.spec.ts`: flows on a mobile viewport with real touch where it matters;
  `freshGame` unlocks every hero unless `locked`.
- Other browsers: `npx playwright test --browser=webkit` passes; Firefox needs a config without `isMobile`.
- Screenshot scripts go in the git-ignored `screenshots/`.

### Running tests without wasting time

- The full `npm run e2e` takes 2-3 minutes: run it **once**, at the very end. While working, loop on `npm run check` (about 10 s) and on the one related e2e test (`npx playwright test -g "<part of the title>"`).
- Read the result with `npx playwright test --reporter=list 2>&1 | grep -E "✘|failed|flaky|passed"`: a `tail` of the default output shows slow tests and misleading counts.
- A test that fails in the full run: run **that test alone** first. If it passes alone it is machine load (many workers, another Playwright or dev server running): rerun the full suite once with `--workers=2`, don't dig into the code and don't loop reruns. Never start two Playwright runs at once (one shared server on :5174).
- Before the first run after a rename or a removed field, `grep` for the old name in `src`, `tests` and `dev`: `tsc` already points at the stale tests, so fix them in the same pass instead of finding them one run at a time.
- A screenshot is a throw-away spec (in `tests/e2e/` if `screenshots/` is not covered by the config) that you **delete before committing** (`git status` must not list it). Pitfalls that cost reruns: never overwrite `c.enemy.move` with a partial move (the HUD throws and the Machine jam window sends the page back to the title); `addTempCard(…, 'belt')` drops the card to the discard pile when the belt has no room, so add the card you want to see first, on an empty belt (`c.belt.length = 0`), and wait before adding the next; when the picture looks wrong, listen to `pageerror` before guessing; clip the shot to the area you changed.
- Unrelated edits of the owner in the working tree (balancing, notes) are theirs: stage your own files by path, never `git add -A` unless they ask for it.

## Known technical debt

- Pixel-art caching (deferred: generation is fast).
- Biome covers lint and format (no ESLint with TS 7).
- The balance bot underplays the Mage's chaining and spends abilities as soon as it can.
