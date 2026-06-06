import { motion } from "framer-motion";
import type { GamePhase } from "@/types";
import { TIMINGS } from "@/game/constants";

interface Props {
  phase: GamePhase;
  round: number;
  timeLeftMs: number;
  seatedCount: number;
  totalSeats: number;
}

const R = 36; // tight ring, hugs the number
const C = 2 * Math.PI * R;

export function CenterStage({ phase, round, timeLeftMs, seatedCount, totalSeats }: Props) {
  if (phase === "voting" || phase === "tiebreak") {
    const runoff = phase === "tiebreak";
    const secs = Math.max(0, Math.ceil(timeLeftMs / 1000));
    const danger = timeLeftMs <= 3000;
    const dur = runoff ? TIMINGS.runoffDuration : TIMINGS.voteDuration;
    return (
      <div className={`qt-timer ${danger ? "danger" : ""}`}>
        <svg viewBox="0 0 100 100" aria-hidden>
          <circle className="qt-timer-track" cx="50" cy="50" r={R} />
          <motion.circle
            key={`${phase}-${round}`}
            className="qt-timer-prog"
            cx="50"
            cy="50"
            r={R}
            style={{ stroke: danger || runoff ? "var(--danger)" : "var(--sky)", transition: "stroke .35s ease" }}
            strokeDasharray={C}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: C }}
            transition={{ duration: dur / 1000, ease: "linear" }}
          />
        </svg>
        <div className="qt-timer-stack">
          {runoff && <div className="qt-timer-tie">Tie-break</div>}
          <motion.div
            className="qt-timer-num"
            key={secs}
            initial={{ scale: danger ? 1.3 : 1.12, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
          >
            {secs}
          </motion.div>
        </div>
      </div>
    );
  }

  if (phase === "seating") {
    return (
      <div className="qt-brandmark">
        <img className="qt-coin" src="/coin-logo.webp" alt="" draggable={false} />
        <div className="qt-center-sub">
          {seatedCount}/{totalSeats} seated
        </div>
      </div>
    );
  }

  if (phase === "tally") {
    return (
      <motion.div className="qt-brandmark" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <img className="qt-coin sm" src="/coin-logo.webp" alt="" draggable={false} />
        <div className="qt-center-msg">Votes in</div>
        <div className="qt-center-sub">Counting…</div>
      </motion.div>
    );
  }

  // idle / drama beats — quiet coin mark
  return (
    <div className="qt-brandmark" style={{ opacity: 0.5 }}>
      <img className="qt-coin sm" src="/coin-logo.webp" alt="" draggable={false} />
      <div className="qt-center-sub">Round {Math.max(1, round)}</div>
    </div>
  );
}
