import { HALF } from './enemies';
import { CONFIG } from './config';
import { JUST_CAUSE_HP } from './cards/warrior';
import { OVERTIME_MULT, OVERTIME_TIME, TIME_THEFT, VIRULENCE_AT, VIRULENCE_BONUS } from './heroes';
import { PERKS } from './perks';
import { CLOCK_BLOCK, MUG_MANA, STAPLER_DAMAGE } from './relics';
import {
  ASLEEP,
  AWAKE,
  CHILL_GAP,
  CHIRP_EVERY,
  CREEP_EVERY,
  IDLE_LIMIT,
  LANE_WINDOW,
  LEARN_EVERY,
  PARADIGM_TURNS,
  POLICY_WINDOW,
  PRESSURE_EVERY,
  PRESSURE_LIMIT,
  PRESSURE_STEP,
  SPENDING_FREEZE_CAP,
  STATUSES,
  WAKE_PER_CARD,
  WEAK_SPOT_TIME,
} from './statuses';

const pct = (x: number): number => Math.round(x * 100);
const mul = (id: string, key: 'dealtMul' | 'takenMul' | 'timeMul'): number => STATUSES[id][key] ?? 1;

/**
 * The numbers rules text quotes, as `{$name}` in `i18n/en.ts`. Each one is read from the constant, status or record that makes the rule work
 * (never typed twice), so a balance change reaches the text by itself; a test checks every `{$name}` has an entry here and every entry is used.
 */
export const VALUES = {
  // Statuses and keywords
  dotEvery: CONFIG.dotInterval,
  weakPct: pct(1 - mul('weak', 'dealtMul')),
  vulnPct: pct(mul('vulnerable', 'takenMul') - 1),
  hastePct: pct(mul('haste', 'timeMul') - 1),
  hurryPct: pct(CONFIG.beltHurry - 1),
  policyWindow: POLICY_WINDOW,
  laneWindow: LANE_WINDOW,
  chillGap: CHILL_GAP,
  idleLimit: IDLE_LIMIT,
  spendingCap: SPENDING_FREEZE_CAP,
  sleepCycle: AWAKE + ASLEEP,
  asleep: ASLEEP,
  creepEvery: CREEP_EVERY,
  chirpEvery: CHIRP_EVERY,
  learnEvery: LEARN_EVERY,
  pressureStep: PRESSURE_STEP,
  pressureEvery: PRESSURE_EVERY,
  pressureLimit: PRESSURE_LIMIT,
  paradigmPct: pct(1 / PARADIGM_TURNS),
  weakSpotTime: WEAK_SPOT_TIME,
  wakePerCard: WAKE_PER_CARD,
  // Rules on cards
  virusDelay: CONFIG.virusDelay,
  // Half-HP moves (the Paper Cuts it starts with count 1)
  paperCutsX: 1 + HALF.paperCuts,
  securityBlock: HALF.securityBlock,
  slavesStall: HALF.slavesStall,
  complianceSlow: HALF.complianceSlow,
  // Heroes
  overtimeMult: OVERTIME_MULT,
  overtimeTime: OVERTIME_TIME,
  timeTheft: TIME_THEFT,
  virulenceAt: VIRULENCE_AT,
  virulenceBonus: VIRULENCE_BONUS,
  // Relics, perks, cards
  mugMana: MUG_MANA,
  clockBlock: CLOCK_BLOCK,
  staplerDamage: STAPLER_DAMAGE,
  budgetCut: -(PERKS.budgetCut.costDelta ?? 0),
  justCausePct: pct(JUST_CAUSE_HP),
};
