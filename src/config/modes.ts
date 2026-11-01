// Game modes (addendum section 2). Same sim and save format; a mode only changes
// what the player controls. All modes share one set of flags, so a save loads in any mode.

export type ModeId = "life" | "builder" | "politics" | "spectator";

export interface Mode {
  id: ModeId;
  label: string;
  blurb: string;
  /** Starts as mayor, skipping the resident path. */
  startsAsMayor: boolean;
  /** Political pressure: 1 is the full scenario, lower means fewer votes and campaigns asked of the player. */
  politicalPressure: number;
  /** Whether the player places zones and buildings. */
  playerBuilds: boolean;
  /** Whether the player runs votes, campaigns and the feed. */
  playerPolitics: boolean;
  /** Whether AI mayors run the city and the player only watches. */
  aiRuns: boolean;
}

export const MODES: Record<ModeId, Mode> = {
  life: {
    id: "life",
    label: "Life",
    blurb: "Resident to mayor. The full career (default).",
    startsAsMayor: false,
    politicalPressure: 1,
    playerBuilds: false,
    playerPolitics: true,
    aiRuns: false,
  },
  builder: {
    id: "builder",
    label: "Builder",
    blurb: "Start as mayor with political pressure turned down. Focus on the city and the lake.",
    startsAsMayor: true,
    politicalPressure: 0.3,
    playerBuilds: true,
    playerPolitics: false,
    aiRuns: false,
  },
  politics: {
    id: "politics",
    label: "Politics",
    blurb: "The city builds itself from staff proposals. You work the votes, the campaign and the media.",
    startsAsMayor: false,
    politicalPressure: 1,
    playerBuilds: false,
    playerPolitics: true,
    aiRuns: false,
  },
  spectator: {
    id: "spectator",
    label: "Spectator",
    blurb: "Watch the city evolve for decades under AI mayors.",
    startsAsMayor: true,
    politicalPressure: 0,
    playerBuilds: false,
    playerPolitics: false,
    aiRuns: true,
  },
};

export const MODE_ORDER: ModeId[] = ["life", "builder", "politics", "spectator"];
export const DEFAULT_MODE: ModeId = "life";
