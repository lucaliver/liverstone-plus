import { Combat } from '../src/game/combat';
import { CARDS } from '../src/data/cards';
import { addCard, advance, applyCombat, canUpgrade, combatSetup, currentNode, newRun, rest, rollRewards, upgradeCard, type RunState } from '../src/game/run';
import type { CombatCard, HeroId } from '../src/game/types';

export interface BotOpts {
  /** Seconds between bot decisions (human reaction time). */
  reaction: number;
  /** Probability per decision of doing nothing (distraction / misreads). */
  sloppiness: number;
}

const DT = 1 / 30;

/** A heuristic player: blocks before telegraphed hits, otherwise spends mana on damage. */
export function botDecide(c: Combat, rnd: () => number, opts: BotOpts): void {
  if (rnd() < opts.sloppiness) return;
  if (c.abilityReady()) c.useAbility();

  const cards: { card: CombatCard; pos: number }[] = [
    ...c.belt.map((b) => ({ card: b.card, pos: b.pos })),
    ...c.sleeve.filter((x): x is CombatCard => !!x).map((card) => ({ card, pos: -1 })),
  ];
  const e = c.enemy;
  const rate = c.enemyTimeRate();
  const timeToHit = rate > 0 ? (e.move.windup - e.timer) / rate : Infinity;
  const incoming = c.intentDamage(e.move) * (e.move.hits ?? 1);
  const affordable = cards.filter(({ card }) => c.isPlayable(card) && c.canAfford(card));

  const score = ({ card, pos }: { card: CombatCard; pos: number }): number => {
    const def = CARDS[card.id];
    const v = c.cardVals(card);
    const cost = Math.max(1, c.cardCost(card));
    const urgency = pos > 0.75 ? 1.5 : 1;
    switch (def.type) {
      case 'curse':
        return card.id === 'hex' && pos > 0.6 ? 50 : c.hero.mana >= c.hero.maxMana - 1 ? 2 : -1;
      case 'potion':
        if (card.id === 'healingPotion') return c.hero.hp < c.hero.maxHp * 0.5 ? 40 : -1;
        return 8;
      case 'power':
        return 30;
      case 'skill': {
        if (/manaShard|manaGeode/.test(card.id)) return 40;
        const blockish = /defend|ward|Ward|boneWall|ironWall|frostArmor|unbreakable|parry|secondWind|mirrorImage/.test(card.id);
        if (blockish) {
          const need = incoming > c.hero.block && timeToHit < 1.6;
          return need ? 25 * urgency : c.hero.mana >= c.hero.maxMana ? 1.5 : -1;
        }
        return 6 * urgency;
      }
      default: {
        if (/rot|frailty|noxiousCloud|wither|blackDeath|epidemic/.test(card.id)) return 9;
        if (card.id === 'blightBurst') return c.stacks('enemy', 'poison') * 0.8;
        const dmg = def.dmg?.length ? c.previewHeroDamage(v[def.dmg[0]], def) * (card.id === 'arcaneMissiles' ? v[1] : 1) : 8;
        return (dmg / cost) * urgency;
      }
    }
  };

  const best = affordable.map((x) => ({ x, s: score(x) })).filter((o) => o.s > 0).sort((a, b) => b.s - a.s)[0];
  if (best) {
    c.playCard(best.x.card.uid);
    return;
  }
  // Stash a strong card that's about to leave and can't be afforded yet.
  const leaving = c.belt.find((b) => b.pos > 0.8 && c.cardCost(b.card) >= 2 && CARDS[b.card.id].type !== 'curse');
  if (leaving && c.sleeve.includes(null)) c.stash(leaving.card.uid);
}

export function simulateCombat(c: Combat, rnd: () => number, opts: BotOpts, maxTime = 300): void {
  let acc = 0;
  while (!c.result && c.time < maxTime) {
    c.tick(DT);
    acc += DT;
    if (acc >= opts.reaction) {
      acc = 0;
      botDecide(c, rnd, opts);
    }
  }
}

export interface RunOutcome {
  won: boolean;
  floor: number;
  hp: number;
  combatTimes: number[];
}

export function simulateRun(hero: HeroId, seed: number, opts: BotOpts): RunOutcome {
  let s = seed;
  const rnd = (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
  const run: RunState = newRun(hero, seed);
  const combatTimes: number[] = [];
  for (;;) {
    const node = currentNode(run);
    if (node.type === 'rest') {
      if (run.hp < run.maxHp * 0.65) rest(run);
      else {
        const up = run.deck.find((c) => canUpgrade(c) && CARDS[c.id].type !== 'skill') ?? run.deck.find(canUpgrade);
        if (up) upgradeCard(run, up.uid);
        run.cleared = true;
      }
    } else {
      const c = new Combat(combatSetup(run));
      simulateCombat(c, rnd, opts);
      combatTimes.push(c.time);
      applyCombat(run, c);
      if (c.result === 'lose' || !c.result) return { won: false, floor: node.floor, hp: 0, combatTimes };
      if (c.result === 'win' && node.type !== 'boss') {
        const picks = rollRewards(run, node.type === 'elite' ? 'elite' : 'fight');
        const pick = picks.find((p) => p.rarity !== 'common') ?? picks[0];
        if (pick) addCard(run, pick.id);
      }
    }
    if (!advance(run)) return { won: true, floor: node.floor, hp: run.hp, combatTimes };
  }
}
