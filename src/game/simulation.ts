import type { GameState, Player } from "@/types";
import { AVATAR_COUNT } from "@/data/avatars";
import { NAME_POOL, HUMAN_NAME } from "@/data/names";
import { HUMAN_ID, HUMAN_SEAT_INDEX, TABLE_SIZE } from "./constants";
import { pick, randRange, shuffle } from "./util";

/**
 * Generate the 5 simulated opponents — names and personality
 * knobs, but NO avatar yet (avatarId = -1). They claim their faces live
 * on the avatar-select screen; whatever they've grabbed is then carried
 * to the table by `assemblePlayers`.
 */
export function createBots(): Player[] {
  const names = shuffle(NAME_POOL).slice(0, TABLE_SIZE - 1);
  return names.map((name, i) => ({
    id: `bot_${i}`,
    name,
    avatarId: -1, // chosen during avatar select
    isHuman: false,
    isAlive: true,
    seated: false,
    status: "idle",
    speed: randRange(0.35, 1),
    aggression: randRange(0.2, 0.9),
  }));
}

/**
 * Build the seated table: the human in their fixed seat plus the bots.
 * Any bot that didn't lock a face in time gets a remaining one assigned,
 * so every avatar around the table is unique.
 */
export function assemblePlayers(humanAvatarId: number, bots: Player[]): Player[] {
  const human: Player = {
    id: HUMAN_ID,
    name: HUMAN_NAME,
    avatarId: humanAvatarId,
    isHuman: true,
    isAlive: true,
    seated: true,
    status: "ready",
    speed: 1,
    aggression: 0,
  };

  const taken = new Set<number>([humanAvatarId, ...bots.map((b) => b.avatarId).filter((id) => id >= 0)]);
  const freeAvatars = shuffle(
    Array.from({ length: AVATAR_COUNT }, (_, i) => i).filter((id) => !taken.has(id))
  );
  let f = 0;
  const filledBots = bots.map((b) => (b.avatarId >= 0 ? b : { ...b, avatarId: freeAvatars[f++] }));

  const players: Player[] = [];
  players[HUMAN_SEAT_INDEX] = human;
  let b = 0;
  for (let i = 0; i < TABLE_SIZE; i++) {
    if (i === HUMAN_SEAT_INDEX) continue;
    players[i] = filledBots[b++];
  }
  return players;
}

/**
 * Decide who a bot votes for. Alive, never themselves. Weighted so bots
 * lean toward whoever is already trending (bandwagon) — scaled by how
 * aggressive they are — which makes tallies cluster and ties happen.
 */
export function chooseBotTarget(botId: string, state: GameState): string {
  const bot = state.players.find((p) => p.id === botId);
  const candidates = state.players.filter((p) => p.isAlive && p.id !== botId);
  if (candidates.length === 0) return botId; // shouldn't happen

  // Partial tally of votes cast so far this round.
  const soFar: Record<string, number> = {};
  for (const target of Object.values(state.votes)) {
    soFar[target] = (soFar[target] ?? 0) + 1;
  }

  const aggression = bot?.aggression ?? 0.5;
  const weights = candidates.map((c) => {
    const trending = soFar[c.id] ?? 0;
    // base 1, plus bandwagon pull, plus a slight, occasional lean on the human
    // (enough to feel watched, not so much they're doomed every round).
    const humanBias = c.isHuman ? 0.2 : 0;
    return 1 + trending * (1 + aggression * 2.5) + humanBias;
  });

  const total = weights.reduce((a, w) => a + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) return candidates[i].id;
  }
  return candidates[candidates.length - 1].id;
}

/** Pick a random living bot (for ambient stickers/reactions). */
export function randomLivingBot(state: GameState): Player | null {
  const bots = state.players.filter((p) => p.isAlive && !p.isHuman);
  return bots.length ? pick(bots) : null;
}
