/* ============================================================
   Q-TRAITORS — Core domain types
   ============================================================ */

export type Stake = 2 | 5 | 10 | 20;

export type GamePhase =
  | "stake" // choosing a stake level
  | "avatar" // choosing an avatar
  | "seating" // table is filling up with players
  | "voting" // a round is in progress, votes being cast
  | "tally" // revealing vote counts (never who voted for who)
  | "tiebreak" // "The Traitors have decided..." dramatic tie resolve
  | "elimination" // a player is removed from the table
  | "result" // tension card + near-elimination warnings
  | "gameover"; // final two split the pot

export type PresenceStatus =
  | "idle"
  | "thinking"
  | "choosing"
  | "ready"
  | "voted"
  | "eliminated"
  | "spectating";

export interface Badge {
  id: string;
  icon: string;
  label: string;
}

export interface Sticker {
  id: string;
  emoji: string;
  label: string;
}

/** A live sticker instance floating above a seat. */
export interface ActiveSticker {
  key: string; // unique instance key
  playerId: string;
  emoji: string;
  label: string;
}

export interface Player {
  id: string;
  name: string;
  avatarId: number; // index into the avatar set (swappable later)
  isHuman: boolean;
  isAlive: boolean;
  seated: boolean; // has visually joined the table
  status: PresenceStatus;
  badge: Badge | null;
  /** Bot behaviour knobs (0..1). Ignored for the human. */
  speed: number; // how quickly they act
  aggression: number; // how likely to pile onto a leading target
}

/** One entry in a revealed tally — counts only, no voter mapping. */
export interface TallyEntry {
  playerId: string;
  votes: number;
}

export interface RoundResult {
  round: number;
  tally: TallyEntry[]; // sorted desc by votes
  eliminatedId: string;
  wasTie: boolean;
  tiedIds: string[];
}

export interface GameState {
  phase: GamePhase;
  stake: Stake | null;
  prizePool: number;
  round: number;
  players: Player[]; // all 6 — eliminated ones keep isAlive=false
  /** voterId -> targetId for the current round (never surfaced as a mapping). */
  votes: Record<string, string>;
  /** Order in which votes locked, for "n/6 voted". */
  votedOrder: string[];
  /** Timestamp (ms) the current vote closes. */
  voteEndsAt: number | null;
  timeLeftMs: number;
  /** Pre-computed tally for the tally/tiebreak phases. */
  pendingTally: TallyEntry[] | null;
  tiedIds: string[];
  /** Candidates in a tie-break runoff (the tied players being voted on). */
  runoffIds: string[];
  lastResult: RoundResult | null;
  /** Alive players who took heat last round — drives tension UI. */
  tension: TallyEntry[];
  stickers: ActiveSticker[];
}
