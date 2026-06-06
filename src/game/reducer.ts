import type {
  ActiveSticker,
  GameState,
  Player,
  PresenceStatus,
  Stake,
  TallyEntry,
} from "@/types";
import { TABLE_SIZE, TIMINGS } from "./constants";

export type Action =
  | { t: "SELECT_STAKE"; stake: Stake }
  | { t: "START_SEATING"; players: Player[] }
  | { t: "SEAT_PLAYER"; playerId: string }
  | { t: "SET_STATUS"; playerId: string; status: PresenceStatus }
  | { t: "START_VOTING"; endsAt: number }
  | { t: "TICK"; now: number }
  | { t: "CAST_VOTE"; voterId: string; targetId: string }
  | { t: "TALLY" }
  | { t: "START_RUNOFF"; endsAt: number }
  | { t: "ELIMINATE"; playerId: string }
  | { t: "ADVANCE" }
  | { t: "NEXT_ROUND"; endsAt: number }
  | { t: "ADD_STICKER"; sticker: ActiveSticker }
  | { t: "REMOVE_STICKER"; key: string }
  | { t: "BACK_TO_STAKE" }
  | { t: "RESTART" };

export const initialState: GameState = {
  phase: "stake",
  stake: null,
  prizePool: 0,
  round: 0,
  players: [],
  votes: {},
  votedOrder: [],
  voteEndsAt: null,
  timeLeftMs: TIMINGS.voteDuration,
  pendingTally: null,
  tiedIds: [],
  runoffIds: [],
  lastResult: null,
  tension: [],
  stickers: [],
};

export const aliveCount = (s: GameState): number => s.players.filter((p) => p.isAlive).length;

const setStatus = (players: Player[], id: string, status: PresenceStatus): Player[] =>
  players.map((p) => (p.id === id ? { ...p, status } : p));

const computeTally = (s: GameState): TallyEntry[] => {
  const counts: Record<string, number> = {};
  for (const target of Object.values(s.votes)) {
    counts[target] = (counts[target] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([playerId, votes]) => ({ playerId, votes }))
    .sort((a, b) => b.votes - a.votes || a.playerId.localeCompare(b.playerId));
};

export function reducer(state: GameState, action: Action): GameState {
  switch (action.t) {
    case "SELECT_STAKE":
      return {
        ...state,
        stake: action.stake,
        prizePool: action.stake * TABLE_SIZE,
        phase: "avatar",
      };

    case "START_SEATING":
      return { ...state, players: action.players, phase: "seating" };

    case "SEAT_PLAYER":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, seated: true, status: "ready" } : p
        ),
      };

    case "SET_STATUS":
      return { ...state, players: setStatus(state.players, action.playerId, action.status) };

    case "START_VOTING":
      return {
        ...state,
        phase: "voting",
        round: state.round === 0 ? 1 : state.round,
        votes: {},
        votedOrder: [],
        voteEndsAt: action.endsAt,
        timeLeftMs: TIMINGS.voteDuration,
        pendingTally: null,
        tiedIds: [],
        runoffIds: [],
        tension: [],
        players: state.players.map((p) =>
          p.isAlive ? { ...p, status: "thinking" } : p
        ),
      };

    case "TICK":
      if (state.voteEndsAt == null) return state;
      return { ...state, timeLeftMs: Math.max(0, state.voteEndsAt - action.now) };

    case "CAST_VOTE": {
      if (state.phase !== "voting" && state.phase !== "tiebreak") return state;
      const already = action.voterId in state.votes;
      return {
        ...state,
        votes: { ...state.votes, [action.voterId]: action.targetId },
        votedOrder: already ? state.votedOrder : [...state.votedOrder, action.voterId],
        players: setStatus(state.players, action.voterId, "voted"),
      };
    }

    case "TALLY": {
      if (state.phase !== "voting") return state;
      const tally = computeTally(state);
      const max = tally.length ? tally[0].votes : 0;
      const tiedIds = tally.filter((e) => e.votes === max).map((e) => e.playerId);
      return { ...state, pendingTally: tally, tiedIds, phase: "tally" };
    }

    case "START_RUNOFF":
      // A tie → the alive, non-tied players re-vote between the tied ones.
      return {
        ...state,
        phase: "tiebreak",
        runoffIds: state.tiedIds,
        votes: {},
        votedOrder: [],
        voteEndsAt: action.endsAt,
        timeLeftMs: TIMINGS.runoffDuration,
        players: state.players.map((p) => (p.isAlive ? { ...p, status: "idle" } : p)),
      };

    case "ELIMINATE": {
      const tally = state.pendingTally ?? computeTally(state);
      const wasTie = state.tiedIds.length > 1;

      const players = state.players.map((p) =>
        p.id === action.playerId
          ? {
              ...p,
              isAlive: false,
              status: (p.isHuman ? "spectating" : "eliminated") as PresenceStatus,
            }
          : p
      );

      // Tension = alive players who still took votes this round.
      const tension = tally
        .filter((e) => e.playerId !== action.playerId)
        .filter((e) => players.find((p) => p.id === e.playerId)?.isAlive)
        .filter((e) => e.votes >= 1);

      return {
        ...state,
        players,
        phase: "elimination",
        lastResult: {
          round: state.round,
          tally,
          eliminatedId: action.playerId,
          wasTie,
          tiedIds: state.tiedIds,
        },
        tension,
        runoffIds: [],
        stickers: state.stickers.filter((s) => s.playerId !== action.playerId),
      };
    }

    case "ADVANCE":
      return { ...state, phase: aliveCount(state) <= 2 ? "gameover" : "result" };

    case "NEXT_ROUND":
      return {
        ...state,
        phase: "voting",
        round: state.round + 1,
        votes: {},
        votedOrder: [],
        voteEndsAt: action.endsAt,
        timeLeftMs: TIMINGS.voteDuration,
        pendingTally: null,
        tiedIds: [],
        runoffIds: [],
        tension: [],
        players: state.players.map((p) => (p.isAlive ? { ...p, status: "thinking" } : p)),
      };

    case "ADD_STICKER":
      // Keep at most one sticker per player on screen at a time.
      return {
        ...state,
        stickers: [...state.stickers.filter((s) => s.playerId !== action.sticker.playerId), action.sticker],
      };

    case "REMOVE_STICKER":
      return { ...state, stickers: state.stickers.filter((s) => s.key !== action.key) };

    case "BACK_TO_STAKE":
      // Leaving avatar select before the table is built — nothing to tear down.
      return { ...initialState };

    case "RESTART":
      return { ...initialState };

    default:
      return state;
  }
}
