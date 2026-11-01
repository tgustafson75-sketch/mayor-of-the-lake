// Life sim: the resident's needs, daily blocks, and relationships with named
// characters. Pure and deterministic. Passive drift is deterministic and never
// changes relationships. Only actions do. Magnitudes are TUNABLE placeholders.

export type Block = "work" | "family" | "meeting" | "event" | "campaign" | "social_media" | "rest";
export const BLOCKS: readonly Block[] = ["work", "family", "meeting", "event", "campaign", "social_media", "rest"];

export interface Needs {
  energy: number; // 0..100
  social: number; // 0..100
  stress: number; // 0..100, higher is worse
  money: number; // USD thousands, scenario
}

export interface Relationship {
  trust: number; // -1..1
  favorOwed: number; // positive: Tim owes them
  rivalry: number; // 0..1
}

export interface LifeState {
  day: number;
  needs: Needs;
  reputation: number; // 0..100
  relationships: Record<string, Relationship>;
  /** Blocks used today. Reset each morning. */
  blocksToday: Block[];
  log: { day: number; kind: string; detail: Record<string, string | number> }[];
}

export function createLife(): LifeState {
  return {
    day: 0,
    needs: { energy: 80, social: 60, stress: 20, money: 50 },
    reputation: 30,
    relationships: {},
    blocksToday: [],
    log: [],
  };
}

/** What one block costs and gives. TUNABLE. */
const EFFECTS: Record<Block, { needs: Partial<Needs>; reputation?: number }> = {
  work: { needs: { energy: -20, stress: 6, money: 4 } },
  family: { needs: { energy: -4, social: 14, stress: -8 } },
  meeting: { needs: { energy: -8, stress: 4 }, reputation: 2 },
  event: { needs: { energy: -10, social: 10, stress: -2 }, reputation: 1 },
  campaign: { needs: { energy: -18, stress: 8 }, reputation: 3 },
  social_media: { needs: { energy: -4, social: 3, stress: 2 } },
  rest: { needs: { energy: 30, stress: -12 } },
};

const MAX_BLOCKS_PER_DAY = 4;

/** Spend one block. The only way needs and reputation change, apart from passive drift. */
export function spendBlock(life: LifeState, block: Block): LifeState {
  if (life.blocksToday.length >= MAX_BLOCKS_PER_DAY) throw new RangeError(`only ${MAX_BLOCKS_PER_DAY} blocks a day`);
  const e = EFFECTS[block];
  const needs = applyNeeds(life.needs, e.needs);
  return {
    ...life,
    needs,
    reputation: clamp(life.reputation + (e.reputation ?? 0), 0, 100),
    blocksToday: [...life.blocksToday, block],
    log: [...life.log, { day: life.day, kind: "block", detail: { block } }],
  };
}

/** Relationship change from a conversation outcome. Called by the AI layer after the sim resolves it. */
export function adjustRelationship(life: LifeState, npcId: string, change: Partial<Relationship>): LifeState {
  const cur = life.relationships[npcId] ?? { trust: 0, favorOwed: 0, rivalry: 0 };
  const next: Relationship = {
    trust: clamp(cur.trust + (change.trust ?? 0), -1, 1),
    favorOwed: cur.favorOwed + (change.favorOwed ?? 0),
    rivalry: clamp(cur.rivalry + (change.rivalry ?? 0), 0, 1),
  };
  return {
    ...life,
    relationships: { ...life.relationships, [npcId]: next },
    log: [...life.log, { day: life.day, kind: "relationship", detail: { npcId, trust: round2(next.trust) } }],
  };
}

/** End of day: passive drift. Needs drift toward baseline. Relationships are not touched here. */
export function endDay(life: LifeState): LifeState {
  const n = life.needs;
  const needs: Needs = {
    energy: clamp(n.energy + 6, 0, 100), // energy recovers overnight
    social: clamp(n.social - 4, 0, 100), // social need builds up unless met
    stress: clamp(n.stress - 2, 0, 100), // stress eases slowly
    money: n.money,
  };
  const burnout = needs.stress >= 85 && needs.energy <= 15;
  return {
    ...life,
    day: life.day + 1,
    needs,
    blocksToday: [],
    log: burnout ? [...life.log, { day: life.day, kind: "burnout", detail: { stress: round2(needs.stress) } }] : life.log,
  };
}

/** Plays n days, each with the same block plan. Used by the 30-day test. */
export function playDays(life: LifeState, plan: Block[][]): LifeState {
  let s = life;
  for (const day of plan) {
    for (const b of day) s = spendBlock(s, b);
    s = endDay(s);
  }
  return s;
}

function applyNeeds(n: Needs, d: Partial<Needs>): Needs {
  return {
    energy: clamp(n.energy + (d.energy ?? 0), 0, 100),
    social: clamp(n.social + (d.social ?? 0), 0, 100),
    stress: clamp(n.stress + (d.stress ?? 0), 0, 100),
    money: n.money + (d.money ?? 0),
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
