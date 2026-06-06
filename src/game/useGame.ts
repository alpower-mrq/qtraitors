import { useCallback, useEffect, useReducer, useRef } from "react";
import type { GameState, Player, Sticker, Stake } from "@/types";
import { BOT_STICKER_IDS, getSticker } from "@/data/stickers";
import { audio } from "./audio";
import { HUMAN_ID, TIMINGS } from "./constants";
import { aliveCount, initialState, reducer } from "./reducer";
import { assemblePlayers, chooseBotTarget, randomLivingBot } from "./simulation";
import { pick, randInt, randRange, uid } from "./util";

/** Phases during which the table shows ambient social life. */
const AMBIENT_PHASES = new Set<GameState["phase"]>(["seating", "tally", "result"]);

export interface GameApi {
  state: GameState;
  selectStake: (stake: Stake) => void;
  selectAvatar: (avatarId: number, bots: Player[]) => void;
  castVote: (targetId: string) => void;
  throwSticker: (playerId: string, sticker: Sticker) => void;
  removeSticker: (key: string) => void;
  nextRound: () => void;
  staySpectating: () => void;
  backToStake: () => void;
  restart: () => void;
}

export function useGame(): GameApi {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Keep a live ref so timer callbacks read fresh state without re-subscribing.
  const ref = useRef(state);
  ref.current = state;

  const throwSticker = useCallback((playerId: string, sticker: Sticker) => {
    dispatch({
      t: "ADD_STICKER",
      sticker: { key: uid("stk"), playerId, emoji: sticker.emoji, label: sticker.label },
    });
  }, []);

  const removeSticker = useCallback((key: string) => dispatch({ t: "REMOVE_STICKER", key }), []);

  const selectStake = useCallback((stake: Stake) => dispatch({ t: "SELECT_STAKE", stake }), []);

  const selectAvatar = useCallback((avatarId: number, bots: Player[]) => {
    dispatch({ t: "START_SEATING", players: assemblePlayers(avatarId, bots) });
  }, []);

  const castVote = useCallback((targetId: string) => {
    const s = ref.current;
    const human = s.players.find((p) => p.id === HUMAN_ID);
    if (!human?.isAlive || targetId === HUMAN_ID) return;
    if (s.phase === "voting") {
      audio.sfx("choose");
      dispatch({ t: "CAST_VOTE", voterId: HUMAN_ID, targetId });
    } else if (s.phase === "tiebreak") {
      // runoff: only non-tied survivors vote, only for a tied candidate
      if (s.runoffIds.includes(human.id) || !s.runoffIds.includes(targetId)) return;
      audio.sfx("choose");
      dispatch({ t: "CAST_VOTE", voterId: HUMAN_ID, targetId });
    }
  }, []);

  // Resolve a tie-break runoff: most votes among the tied players goes
  // (a fresh tie inside the runoff falls back to a coin-flip).
  const resolveRunoff = useCallback(() => {
    const s = ref.current;
    if (s.phase !== "tiebreak") return;
    const candidates = s.runoffIds;
    if (!candidates.length) return;
    const counts: Record<string, number> = {};
    candidates.forEach((c) => (counts[c] = 0));
    Object.values(s.votes).forEach((t) => {
      if (t in counts) counts[t] += 1;
    });
    const max = Math.max(...candidates.map((c) => counts[c]));
    const top = candidates.filter((c) => counts[c] === max);
    dispatch({ t: "ELIMINATE", playerId: top.length === 1 ? top[0] : pick(top) });
  }, []);

  const nextRound = useCallback(() => {
    if (ref.current.phase !== "result") return;
    dispatch({ t: "NEXT_ROUND", endsAt: Date.now() + TIMINGS.voteDuration });
  }, []);

  // Player chose to stay and watch after being voted out.
  const staySpectating = useCallback(() => {
    if (ref.current.phase === "elimination") dispatch({ t: "ADVANCE" });
  }, []);

  // Back out of avatar select to the stake screen.
  const backToStake = useCallback(() => dispatch({ t: "BACK_TO_STAKE" }), []);

  const restart = useCallback(() => dispatch({ t: "RESTART" }), []);

  /* ---------------------------------------------------------------
     SEATING — bots arrive one at a time, then the first round opens.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (state.phase !== "seating") return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const incoming = ref.current.players.filter((p) => !p.seated);

    let t = TIMINGS.seatFirstDelay;
    incoming.forEach((p) => {
      timers.push(setTimeout(() => dispatch({ t: "SEAT_PLAYER", playerId: p.id }), t));
      t += randInt(TIMINGS.seatGapMin, TIMINGS.seatGapMax);
    });
    // Once everyone's in, let it breathe, then open round 1.
    timers.push(
      setTimeout(
        () => dispatch({ t: "START_VOTING", endsAt: Date.now() + TIMINGS.voteDuration }),
        t + TIMINGS.seatSettle
      )
    );

    return () => timers.forEach(clearTimeout);
  }, [state.phase]);

  /* ---------------------------------------------------------------
     VOTING — countdown + each bot votes after its own delay.
     Re-runs every round (keyed on round).
     --------------------------------------------------------------- */
  useEffect(() => {
    if (state.phase !== "voting") return;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Smooth-ish numeric countdown (the ring animates declaratively).
    const ticker = setInterval(() => dispatch({ t: "TICK", now: Date.now() }), 200);

    const aliveBots = ref.current.players.filter((p) => p.isAlive && !p.isHuman);
    aliveBots.forEach((bot) => {
      const base = randRange(TIMINGS.botVoteMin, TIMINGS.botVoteMax);
      const delay = Math.min(base * (1.2 - 0.4 * bot.speed), TIMINGS.voteDuration - 500);
      const choosingAt = Math.max(200, delay - randRange(500, 1100));

      timers.push(setTimeout(() => dispatch({ t: "SET_STATUS", playerId: bot.id, status: "choosing" }), choosingAt));
      timers.push(
        setTimeout(() => {
          const target = chooseBotTarget(bot.id, ref.current);
          dispatch({ t: "CAST_VOTE", voterId: bot.id, targetId: target });
        }, delay)
      );
    });

    // Hard close: anyone who didn't vote (incl. the human) auto-votes themselves.
    timers.push(
      setTimeout(() => {
        const s = ref.current;
        s.players
          .filter((p) => p.isAlive && !(p.id in s.votes))
          .forEach((p) => dispatch({ t: "CAST_VOTE", voterId: p.id, targetId: p.id }));
        timers.push(setTimeout(() => dispatch({ t: "TALLY" }), 350));
      }, TIMINGS.voteDuration)
    );

    return () => {
      clearInterval(ticker);
      timers.forEach(clearTimeout);
    };
  }, [state.phase, state.round]);

  /* ---------------------------------------------------------------
     EARLY CLOSE — everyone voted before the clock ran out.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (state.phase !== "voting") return;
    if (state.votedOrder.length < aliveCount(state)) return;
    const t = setTimeout(() => dispatch({ t: "TALLY" }), TIMINGS.allVotedBeat);
    return () => clearTimeout(t);
  }, [state.phase, state.votedOrder.length, state.players]);

  /* ---------------------------------------------------------------
     TALLY → resolve into a tie-break or a straight elimination.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (state.phase !== "tally") return;
    const t = setTimeout(() => {
      const s = ref.current;
      if (s.tiedIds.length > 1) {
        dispatch({ t: "START_RUNOFF", endsAt: Date.now() + TIMINGS.runoffDuration });
      } else if (s.tiedIds.length === 1) {
        dispatch({ t: "ELIMINATE", playerId: s.tiedIds[0] });
      }
    }, TIMINGS.tallyReveal);
    return () => clearTimeout(t);
  }, [state.phase]);

  /* ---------------------------------------------------------------
     TIE-BREAK RUNOFF — the alive, non-tied players re-vote between the
     tied candidates; most votes goes. Countdown + bots + hard close.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (state.phase !== "tiebreak") return;
    const s0 = ref.current;
    const candidates = s0.runoffIds;
    const eligible = s0.players.filter((p) => p.isAlive && !candidates.includes(p.id));

    // Nobody left to decide (everyone alive is tied) — quick coin-flip.
    if (eligible.length === 0) {
      const t = setTimeout(() => dispatch({ t: "ELIMINATE", playerId: pick(candidates) }), 1400);
      return () => clearTimeout(t);
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    const ticker = setInterval(() => dispatch({ t: "TICK", now: Date.now() }), 200);

    eligible
      .filter((p) => !p.isHuman)
      .forEach((bot) => {
        const delay = Math.min(
          randRange(TIMINGS.runoffBotVoteMin, TIMINGS.runoffBotVoteMax),
          TIMINGS.runoffDuration - 500
        );
        timers.push(
          setTimeout(() => dispatch({ t: "CAST_VOTE", voterId: bot.id, targetId: pick(candidates) }), delay)
        );
      });

    timers.push(setTimeout(resolveRunoff, TIMINGS.runoffDuration));

    return () => {
      clearInterval(ticker);
      timers.forEach(clearTimeout);
    };
  }, [state.phase, resolveRunoff]);

  /* Runoff early close — every non-tied survivor has voted. */
  useEffect(() => {
    if (state.phase !== "tiebreak") return;
    const eligible = state.players.filter((p) => p.isAlive && !state.runoffIds.includes(p.id));
    if (eligible.length === 0 || eligible.some((p) => !(p.id in state.votes))) return;
    const t = setTimeout(resolveRunoff, TIMINGS.allVotedBeat);
    return () => clearTimeout(t);
  }, [state.phase, state.votes, state.players, state.runoffIds, resolveRunoff]);

  /* ---------------------------------------------------------------
     ELIMINATION animation → advance to result or game over.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (state.phase !== "elimination") return;
    // If the human was just voted out, pause here and let them choose to
    // leave for the lobby or stay and watch — don't auto-advance.
    if (state.lastResult?.eliminatedId === HUMAN_ID) return;
    const t = setTimeout(() => dispatch({ t: "ADVANCE" }), TIMINGS.elimination);
    return () => clearTimeout(t);
  }, [state.phase]);

  /* ---------------------------------------------------------------
     RESULT — tension card auto-advances to the next round.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (state.phase !== "result") return;
    const t = setTimeout(
      () => dispatch({ t: "NEXT_ROUND", endsAt: Date.now() + TIMINGS.voteDuration }),
      TIMINGS.result
    );
    return () => clearTimeout(t);
  }, [state.phase, state.round]);

  /* ---------------------------------------------------------------
     AMBIENT LIFE — bots throw stickers + shift presence so the table
     never feels static. Self-rescheduling while in an ambient phase.
     --------------------------------------------------------------- */
  useEffect(() => {
    if (!AMBIENT_PHASES.has(state.phase)) return;
    let timer: ReturnType<typeof setTimeout>;

    const tick = () => {
      const s = ref.current;
      const bot = randomLivingBot(s);
      if (bot) {
        if (Math.random() < 0.7) {
          const sticker = getSticker(pick(BOT_STICKER_IDS));
          dispatch({
            t: "ADD_STICKER",
            sticker: { key: uid("stk"), playerId: bot.id, emoji: sticker.emoji, label: sticker.label },
          });
        } else if (s.phase === "result" || s.phase === "seating") {
          // gentle presence churn between the dramatic beats
          const other = randomLivingBot(s);
          if (other) dispatch({ t: "SET_STATUS", playerId: other.id, status: pick(["ready", "idle", "thinking"]) });
        }
      }
      timer = setTimeout(tick, randRange(TIMINGS.ambientStickerMin, TIMINGS.ambientStickerMax));
    };

    timer = setTimeout(tick, randRange(TIMINGS.ambientStickerMin, TIMINGS.ambientStickerMax));
    return () => clearTimeout(timer);
  }, [state.phase]);

  return {
    state,
    selectStake,
    selectAvatar,
    castVote,
    throwSticker,
    removeSticker,
    nextRound,
    staySpectating,
    backToStake,
    restart,
  };
}
