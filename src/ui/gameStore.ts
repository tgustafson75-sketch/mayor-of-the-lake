// Player state for the Life and Council screens. Each action goes through the sim
// (src/sim/*). The store only holds the results. Scenario values are placeholders (D-019).
import { create } from "zustand";
import { createLife, endDay, spendBlock, adjustRelationship, type Block, type LifeState } from "../sim/life";
import { addCommitment, createLedger, settleDay, type Ledger } from "../sim/commitments";
import { runVote, whip, type FitTable } from "../sim/council";
import { Rng } from "../sim/rng";
import { scenarioRoster } from "../sim/politics";
import { createSocial, publish, type LabelSource, type SocialState, type Tone, type Topic } from "../sim/social";
import { answerInterview, openInterview, type Answer, type Interview } from "../sim/press";
import { addCampaignWork, createCampaign, tickCampaign, type Campaign, type ElectionResult } from "../sim/election";

export const COUNCIL_IDS = scenarioRoster().map((m) => m.id);
export const PROPOSAL = { id: "zoning-waterfront", title: "Waterfront zoning change" } as const;
/** Fit of each member with the proposal. SCENARIO placeholder. */
export const FIT: FitTable = {
  "zoning-waterfront": Object.fromEntries(COUNCIL_IDS.map((id, i) => [id, [0.4, 0.2, 0, -0.1, 0.3, 0][i] ?? 0])),
};

export interface VoteRecord {
  yes: number;
  no: number;
  passed: boolean;
  vote: number;
}

export interface GameStore {
  life: LifeState;
  trust: Record<string, number>;
  ledger: Ledger;
  votes: VoteRecord[];
  doBlock: (b: Block) => void;
  sleep: () => void;
  callVote: () => void;
  whipMember: (id: string) => void;
  promise: (npcId: string, text: string, dueDays: number) => void;
  social: SocialState;
  post: (text: string, tone: Tone, topic: Topic, labelSource?: LabelSource) => void;
  interview: Interview | null;
  askReporter: (topic: Topic) => void;
  answerReporter: (answer: Answer) => void;
  campaign: Campaign;
  lastElection: (ElectionResult & { day: number }) | null;
}

export const useGame = create<GameStore>((set, get) => ({
  life: createLife(),
  trust: Object.fromEntries(COUNCIL_IDS.map((id) => [id, 0])),
  ledger: createLedger(),
  votes: [],
  social: createSocial(),
  interview: null,
  askReporter: (topic) => {
    const { social, life } = get();
    set({ interview: openInterview(social, topic, life.day) });
  },
  answerReporter: (answer) => {
    const { social, interview, life } = get();
    if (!interview) return;
    const res = answerInterview(social, interview, answer);
    set({
      social: { ...social, sentiment: res.sentiment, log: [...social.log, ...res.log] },
      life: { ...life, reputation: Math.max(0, Math.min(100, life.reputation + res.reputationDelta)) },
      interview: null,
    });
  },
  campaign: createCampaign(),
  lastElection: null,
  post: (text, tone, topic, labelSource) => {
    const { life, social } = get();
    try {
      set({ social: publish(social, { day: life.day, text, tone, topic, reputation: life.reputation, labelSource }) });
    } catch {
      // Empty text: the composer disables Publish, so this is only a guard.
    }
  },
  doBlock: (b) => {
    try {
      set({
        life: spendBlock(get().life, b),
        campaign: b === "campaign" ? addCampaignWork(get().campaign) : get().campaign,
      });
    } catch {
      // Out of blocks today: the UI disables the buttons, so this is only a guard.
    }
  },
  sleep: () => {
    const life = endDay(get().life);
    const rng = new Rng(`election:${life.day}`);
    const { campaign, result } = tickCampaign(get().campaign, get().social.sentiment, rng);
    set({
      life,
      ledger: settleDay(get().ledger, life.day),
      campaign,
      lastElection: result ? { ...result, day: life.day } : get().lastElection,
    });
  },
  callVote: () => {
    const { trust, votes } = get();
    const rng = new Rng(`council:${votes.length}`);
    const r = runVote(PROPOSAL, trust, FIT, COUNCIL_IDS, rng);
    set({ votes: [...votes, { yes: r.yes, no: r.no, passed: r.passed, vote: votes.length + 1 }] });
  },
  whipMember: (id) => {
    const { trust, life } = get();
    // A whip is a conversation: the outcome comes from the sim (kept simple here: a single seeded roll).
    const roll = new Rng(`whip:${id}:${life.day}:${Object.keys(trust).length}`).next();
    const outcome = roll < 0.5 + (trust[id] ?? 0) * 0.3 ? "agree" : "refuse";
    set({
      trust: whip(trust, id, outcome),
      life: adjustRelationship(life, id, { trust: outcome === "agree" ? 0.1 : -0.05 }),
    });
  },
  promise: (npcId, text, dueDays) => {
    const { life, ledger } = get();
    set({ ledger: addCommitment(ledger, { npcId, text, madeOnDay: life.day, dueDay: life.day + dueDays }) });
  },
}));
