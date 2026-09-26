# Liverstone

Real-time conveyor-belt deckbuilder roguelike for mobile browsers (portrait). Riso pop + pixel art.

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN, for testing on a phone)
npm run build      # typecheck + production build in dist/
npm test           # engine, content and balance tests
```

The build is static (`dist/`) and can be hosted anywhere.

## Docs

- [DESIGN.md](DESIGN.md): rules, heroes, enemies, art direction, architecture.
- [ROADMAP.md](ROADMAP.md): what's in 1.0, what's next, known issues and technical debt.

## Adding content

- **Card**: add a `CardDef` to `src/data/cards/<class>.ts` (a `face` of icon glyphs plus a `play` function)
  and its `card.<id>.name` / `card.<id>.desc` strings in `src/i18n/en.ts`. `tests/content.test.ts`
  checks that the texts, glyphs and keywords exist.
- **Enemy**: add an `EnemyDef` to `src/data/enemies.ts`, a vector sprite in `src/ui/art/creatures.ts`
  (it is pixelised automatically) and the `enemy.*` / `move.*` strings.
- **Hero**: add a `HeroDef` to `src/data/heroes.ts`, a card file, a sprite and the `hero.*` strings.
- **Language**: copy `src/i18n/en.ts`, translate it and register it in `src/core/i18n.ts`.
