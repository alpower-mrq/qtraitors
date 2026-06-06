import type { Stake } from "@/types";

export const TABLE_SIZE = 6;

export const STAKES: Stake[] = [2, 5, 10, 20];

/** All timings in milliseconds. Tuned for tension and readability. */
export const TIMINGS = {
  voteDuration: 10_000, // players have 10s to vote (per spec)
  tick: 100, // countdown refresh

  // Seating — seats fill gradually, never all at once.
  seatFirstDelay: 500,
  seatGapMin: 650,
  seatGapMax: 1500,
  seatSettle: 1100, // beat after the table is full before round 1

  // Bot voting window (offsets within the vote duration).
  botVoteMin: 1800,
  botVoteMax: 8800,

  // Reveal / drama beats.
  allVotedBeat: 900, // pause after the last vote lands
  tallyReveal: 3000, // time spent revealing counts before resolving
  runoffDuration: 7000, // tie-break re-vote window
  runoffBotVoteMin: 1200,
  runoffBotVoteMax: 6000,
  elimination: 3400, // dramatic removal + reposition
  result: 6000, // tension card (auto-advances, or tap to continue)

  // Ambient social life.
  stickerLife: 2600, // a thrown sticker floats then fades
  ambientStickerMin: 1400,
  ambientStickerMax: 4200,
} as const;

/** The human always sits here; bots fill the rest. */
export const HUMAN_SEAT_INDEX = 0;
export const HUMAN_ID = "you";

/** Shared layoutId so the intro logo morphs into its homepage position. */
export const BRAND_LOGO_ID = "qt-brand-logo";
