// Commitments ledger (addendum section 5). Every promise Tim makes in a
// conversation becomes a record. The sim decides kept or broken, never the model.
export type CommitmentStatus = "open" | "kept" | "broken";

export interface Commitment {
  id: string;
  npcId: string;
  text: string;
  madeOnDay: number;
  dueDay: number;
  status: CommitmentStatus;
}

export interface Ledger {
  items: Commitment[];
}

export function createLedger(): Ledger {
  return { items: [] };
}

export function addCommitment(ledger: Ledger, c: Omit<Commitment, "status" | "id">): Ledger {
  const id = `c${ledger.items.length + 1}`;
  return { items: [...ledger.items, { ...c, id, status: "open" }] };
}

/** The sim marks a commitment kept when the world action happens. */
export function markKept(ledger: Ledger, id: string): Ledger {
  return setStatus(ledger, id, "kept");
}

/** On each day, any open commitment past its due day becomes broken. */
export function settleDay(ledger: Ledger, day: number): Ledger {
  return {
    items: ledger.items.map((c) => (c.status === "open" && day > c.dueDay ? { ...c, status: "broken" as const } : c)),
  };
}

export function brokenFor(ledger: Ledger, npcId: string): Commitment[] {
  return ledger.items.filter((c) => c.npcId === npcId && c.status === "broken");
}

function setStatus(ledger: Ledger, id: string, status: CommitmentStatus): Ledger {
  if (!ledger.items.some((c) => c.id === id)) throw new Error(`no commitment ${id}`);
  return { items: ledger.items.map((c) => (c.id === id ? { ...c, status } : c)) };
}
