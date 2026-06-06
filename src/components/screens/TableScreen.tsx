import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GameApi } from "@/game/useGame";
import { HUMAN_ID, TABLE_SIZE } from "@/game/constants";
import { HUD } from "@/components/table/HUD";
import { GameTable } from "@/components/table/GameTable";
import { VoteBar } from "@/components/table/VoteBar";
import { StickerTray } from "@/components/table/StickerTray";
import { EliminationOverlay, ResultOverlay } from "@/components/overlays/DramaOverlays";

// Shown once per session — first time the player reaches the table.
let onboardingSeen = false;

export function TableScreen({ api }: { api: GameApi }) {
  const { state } = api;
  const { players, phase, round, prizePool, votes, votedOrder, lastResult, runoffIds, tension } = state;

  const human = players.find((p) => p.id === HUMAN_ID);
  const alive = players.filter((p) => p.isAlive).length;
  const nameOf = (id: string) => (id === HUMAN_ID ? "You" : players.find((p) => p.id === id)?.name ?? "Someone");

  const humanVoteTarget = votes[HUMAN_ID] ?? null;
  const humanVoteName = humanVoteTarget ? (humanVoteTarget === HUMAN_ID ? "yourself" : nameOf(humanVoteTarget)) : null;

  const humanIsCandidate = phase === "tiebreak" && runoffIds.includes(HUMAN_ID);
  const runoffEligible =
    phase === "tiebreak" ? players.filter((p) => p.isAlive && !runoffIds.includes(p.id)).length : 0;

  const eliminated = lastResult ? players.find((p) => p.id === lastResult.eliminatedId) : undefined;

  // First-time onboarding hint.
  const [showOnboard, setShowOnboard] = useState(!onboardingSeen);
  useEffect(() => {
    if (phase === "voting" && round === 1 && showOnboard) onboardingSeen = true;
  }, [phase, round, showOnboard]);
  useEffect(() => {
    if (humanVoteTarget) setShowOnboard(false); // dismiss once they've voted
  }, [humanVoteTarget]);
  // shows through the whole first vote until they pick someone
  const onboarding = showOnboard && phase === "voting" && round === 1 && !!human?.isAlive;

  return (
    <div className="qt-screen qt-table-screen">
      <HUD round={round} prizePool={prizePool} alive={alive} total={TABLE_SIZE} />

      <AnimatePresence>
        {onboarding && (
          <motion.div
            className="qt-onboard"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: [0, -5, 0] }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ y: { repeat: Infinity, duration: 1.4, ease: "easeInOut" }, opacity: { duration: 0.3 } }}
          >
            Choose someone to vote out
          </motion.div>
        )}
      </AnimatePresence>

      <GameTable
        state={state}
        humanVote={humanVoteTarget}
        onVote={api.castVote}
        onStickerExpire={api.removeSticker}
      />

      <div className="qt-dock">
        <VoteBar
          phase={phase}
          humanAlive={!!human?.isAlive}
          humanVoteName={humanVoteName}
          votedCount={votedOrder.length}
          aliveCount={alive}
          timeLeftMs={state.timeLeftMs}
          humanIsCandidate={humanIsCandidate}
          runoffEligible={runoffEligible}
          onLeave={api.restart}
        />
        <StickerTray onThrow={(s) => api.throwSticker(HUMAN_ID, s)} />
      </div>

      <AnimatePresence>
        {phase === "elimination" && eliminated && (
          <EliminationOverlay
            key="elim"
            player={eliminated}
            wasTie={lastResult?.wasTie ?? false}
            onStay={api.staySpectating}
            onLeave={api.restart}
          />
        )}
        {phase === "result" && (
          <ResultOverlay
            key="result"
            round={round}
            tension={tension}
            nameOf={nameOf}
            alive={alive}
            humanAlive={!!human?.isAlive}
            onNext={api.nextRound}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
