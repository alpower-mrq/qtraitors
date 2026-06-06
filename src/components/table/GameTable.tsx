import { useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import type { GameState, Player } from "@/types";
import { HUMAN_ID, TABLE_SIZE, TIMINGS } from "@/game/constants";
import { CenterStage } from "./CenterStage";
import { PlayerSeat, type SeatPos } from "./PlayerSeat";

// Ellipse geometry, in % of the stage box.
const CX = 50;
const CY = 45;
const RX = 36;
const RY = 38;

function computePositions(members: Player[]): Record<string, SeatPos> {
  const k = members.length;
  const out: Record<string, SeatPos> = {};
  members.forEach((p, i) => {
    const theta = Math.PI / 2 + (i * (2 * Math.PI)) / k; // human (i=0) sits at the bottom
    const sinv = Math.sin(theta);
    const cosv = Math.cos(theta);
    const sizeBoost = k <= 3 ? 0.12 : 0;
    out[p.id] = {
      leftPct: CX + RX * cosv,
      topPct: CY + RY * sinv,
      scale: 0.82 + 0.2 * ((sinv + 1) / 2) + sizeBoost,
      z: 10 + Math.round((sinv + 1) * 50),
    };
  });
  return out;
}

interface Props {
  state: GameState;
  humanVote: string | null;
  onVote: (targetId: string) => void;
  onStickerExpire: (key: string) => void;
}

export function GameTable({ state, humanVote, onVote, onStickerExpire }: Props) {
  const { phase, players, stickers, pendingTally, round, timeLeftMs, lastResult, runoffIds } = state;

  // Keep an eliminated bot on the table briefly so its exit reads, then
  // drop it from the layout so the survivors slide in to close the gap.
  const leavingId = phase === "elimination" ? lastResult?.eliminatedId ?? null : null;
  const [showLeaving, setShowLeaving] = useState(false);
  useEffect(() => {
    if (leavingId) {
      setShowLeaving(true);
      const t = setTimeout(() => setShowLeaving(false), TIMINGS.elimination * 0.45);
      return () => clearTimeout(t);
    }
    setShowLeaving(false);
  }, [leavingId]);

  const human = players.find((p) => p.id === HUMAN_ID);

  // Members that occupy a slot in the ring (drives angles). The human always
  // holds the bottom seat — even as a ghost. During seating, all six count so
  // seats drop into their final spots instead of reflowing as each joins.
  const positionMembers = useMemo(() => {
    if (!human) return [];
    const seatedOrComing = phase === "seating";
    const bots = players.filter(
      (p) =>
        !p.isHuman &&
        (p.isAlive || (showLeaving && p.id === leavingId)) &&
        (seatedOrComing || p.seated || (showLeaving && p.id === leavingId))
    );
    return [human, ...bots];
  }, [players, human, phase, showLeaving, leavingId]);

  const positions = useMemo(() => computePositions(positionMembers), [positionMembers]);

  // Only render members that have actually taken their seat.
  const rendered = positionMembers.filter(
    (p) => p.isHuman || p.seated || (showLeaving && p.id === leavingId)
  );

  // Vote-count reveal data.
  const countMap = useMemo(() => {
    const m = new Map<string, { count: number; lead: boolean; delay: number }>();
    if (pendingTally && pendingTally.length) {
      const max = pendingTally[0].votes;
      const n = pendingTally.length;
      pendingTally.forEach((e, descIdx) => {
        const ascRank = n - 1 - descIdx; // reveal smallest first, leader last
        m.set(e.playerId, { count: e.votes, lead: e.votes === max, delay: ascRank * 0.22 });
      });
    }
    return m;
  }, [pendingTally]);

  const showCounts = phase === "tally" || phase === "elimination";
  const seatedCount = players.filter((p) => p.seated).length;
  const seatSize = positionMembers.length <= 2 ? 138 : positionMembers.length <= 3 ? 116 : 90;
  const hasVoted = phase === "voting" && humanVote != null;

  // Tie-break runoff context.
  const isRunoff = phase === "tiebreak";
  const humanCanRunoff = isRunoff && !!human?.isAlive && !runoffIds.includes(HUMAN_ID);

  return (
    <div className="qt-stage-wrap">
      <div className="qt-stage">
        <div className="qt-center">
          <CenterStage
            phase={phase}
            round={round}
            timeLeftMs={timeLeftMs}
            seatedCount={seatedCount}
            totalSeats={TABLE_SIZE}
          />
        </div>

        <AnimatePresence>
          {rendered.map((p) => {
            const cm = countMap.get(p.id);
            const candidate = isRunoff && runoffIds.includes(p.id);
            const votable = isRunoff
              ? humanCanRunoff && candidate
              : phase === "voting" && !!human?.isAlive && p.isAlive && !p.isHuman;
            const picked = (phase === "voting" || isRunoff) && humanVote === p.id;
            const dim = isRunoff
              ? p.isAlive && !candidate && !p.isHuman
              : hasVoted && p.isAlive && !p.isHuman && p.id !== humanVote;
            return (
              <PlayerSeat
                key={p.id}
                player={p}
                pos={positions[p.id]}
                size={seatSize}
                votable={votable}
                picked={picked}
                dim={dim}
                candidate={candidate}
                onVote={() => onVote(p.id)}
                showCount={showCounts && cm != null}
                voteCount={cm?.count}
                isLead={cm?.lead}
                revealDelay={cm?.delay}
                sticker={stickers.find((s) => s.playerId === p.id)}
                onStickerExpire={onStickerExpire}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
