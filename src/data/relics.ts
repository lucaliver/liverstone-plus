import type { RelicDef } from '../game/types';

/** Relics arrive after the MVP; the engine already supports their hooks and modifiers. */
const defs: RelicDef[] = [];

export const RELICS: Record<string, RelicDef> = Object.fromEntries(defs.map((r) => [r.id, r]));
