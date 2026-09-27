# Liverstone

Real-time conveyor-belt deckbuilder roguelike for mobile browsers (portrait). Riso pop + pixel art.

## Run

```bash
npm install
npm run dev        # http://localhost:5173 (also on your LAN, for testing on a phone)
npm run build      # typecheck + production build in dist/
npm test           # engine, content and balance tests
npm run e2e        # browser smoke tests (Playwright, starts the dev server)
npm run check      # typecheck + lint/format check (Biome) + unit tests
npm run format     # format the code (Biome)
```

The build is static (`dist/`) and can be hosted anywhere.

## Docs

- [DESIGN.md](DESIGN.md): rules, heroes, enemies, art direction, architecture.
- [ROADMAP.md](ROADMAP.md): what's in 1.0, what's next, known issues and technical debt.

## Adding content

- **Card**: add a `CardDef` to `src/data/cards/<class>.ts` and its `card.<id>.name` / `card.<id>.desc` strings
  in `src/i18n/en.ts`. That's it: `tests/content.test.ts` checks that texts, glyphs and keywords exist.
  - `vals` / `upVals`: the numbers; logic, card face and rules text all read them.
  - `play(c, v)`: the effect, using the engine helpers (`c.hit`, `c.gainBlock`, `c.applyStatus`…).
  - `face`: the language-neutral card face. `{kind:i}` is an icon plus value i, `{kind}` an icon, `{?kind}` a
    condition shown as (icon), `{i}` a bare value, `|` a new line. Glyph kinds live in `GLYPHS` in
    `src/ui/components/cardView.ts`. Damage values are the `{dmg:i}` ones (live previews); the art colour comes
    from the face (attack / defense / utility) unless `cat` is set.
  - `desc`: the full text; `{i}` for values, `[kw]` for glossary keywords.
- **Enemy**: add an `EnemyDef` to `src/data/enemies.ts`, a vector sprite in `src/ui/art/creatures.ts`
  (it is pixelised automatically) and the `enemy.*` / `move.*` strings.
- **Hero**: add a `HeroDef` to `src/data/heroes.ts`, a card file, a sprite and the `hero.*` strings.
- **Language**: copy `src/i18n/en.ts`, translate it and register it in `src/core/i18n.ts`.
