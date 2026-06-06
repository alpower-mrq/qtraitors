import { motion } from "framer-motion";
import type { Player, TallyEntry } from "@/types";
import { TIMINGS } from "@/game/constants";
import { Avatar } from "@/components/table/Avatar";

/* ----------------------------------------------------------------
   TIE-BREAK — "The Traitors have decided…"
   ---------------------------------------------------------------- */
export function TieBreakerOverlay({ tied }: { tied: Player[] }) {
  return (
    <motion.div
      className="qt-overlay scrim"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="qt-tie-kicker"
        initial={{ scale: 0.7, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
      >
        The Traitors have decided…
      </motion.div>
      <div className="qt-tie-sub">A tie. One of them won't see the next round.</div>

      <div className="qt-tie-row">
        {tied.map((p, i) => (
          <motion.div
            key={p.id}
            className="qt-tie-cand"
            animate={{ rotate: [0, -7, 7, -5, 0], y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.12 }}
          >
            <Avatar avatarId={p.avatarId} size={78} />
            <span className="nm">{p.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   ELIMINATION — the verdict lands.
   ---------------------------------------------------------------- */
interface ElimProps {
  player: Player;
  wasTie: boolean;
  onStay?: () => void;
  onLeave?: () => void;
}

export function EliminationOverlay({ player, wasTie, onStay, onLeave }: ElimProps) {
  const isYou = player.isHuman;
  return (
    <motion.div
      className={`qt-overlay scrim ${isYou ? "tap" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="qt-elim">
        {/* shows the player active, then visibly drops/fades them out */}
        <motion.div
          className="qt-elim-avatar-wrap"
          initial={{ scale: 0.2, rotate: -20, opacity: 0 }}
          animate={{ scale: [0.2, 1, 1], rotate: [-20, 0, 0], opacity: [0, 1, 0.35], y: [0, 0, 16] }}
          transition={{ duration: 1.5, times: [0, 0.4, 1], ease: "easeOut" }}
        >
          <Avatar avatarId={player.avatarId} size={124} />
        </motion.div>

        <motion.div
          className="qt-elim-name"
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.12 }}
        >
          {isYou ? "You're out" : player.name}
        </motion.div>
        <motion.div
          className="qt-elim-verdict"
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.28, type: "spring", stiffness: 400, damping: 14 }}
        >
          Eliminated
        </motion.div>
        <div className="qt-elim-note">
          {wasTie ? "Lost the tie-break re-vote" : "Most votes at the table"}
        </div>

        {isYou && (
          <motion.div
            className="qt-elim-actions"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button className="qt-btn" onClick={onStay}>
              <span className="face">Stay &amp; watch</span>
            </button>
            <button className="qt-btn ghost" onClick={onLeave}>
              <span className="face">Back to lobby</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ----------------------------------------------------------------
   ROUND RESULT — tension card with near-elimination warnings.
   ---------------------------------------------------------------- */
interface ResultProps {
  round: number;
  tension: TallyEntry[];
  nameOf: (id: string) => string;
  alive: number;
  humanAlive: boolean;
  onNext: () => void;
}

export function ResultOverlay({ round, tension, nameOf, alive, humanAlive, onNext }: ResultProps) {
  const finalTwoNext = alive <= 3;
  return (
    <motion.div
      className="qt-overlay scrim-2 tap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="qt-result"
        initial={{ y: 40, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
      >
        <h3>Round {round} done</h3>
        <div className="lead">
          {humanAlive ? "You're still in." : "You're out, but the table plays on."} {alive} left
          {finalTwoNext ? " — almost the final two." : "."}
        </div>

        {tension.length > 0 ? (
          <div className="qt-tension-list">
            {tension.map((t, i) => (
              <motion.div
                key={t.playerId}
                className={`qt-tension ${t.votes >= 2 ? "hot" : ""}`}
                initial={{ x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <span className="ic">⚠️</span>
                <span className="tx">
                  <b>{nameOf(t.playerId)}</b> {t.votes >= 2 ? "is in the firing line" : "caught a vote"}
                </span>
                <span className="vt">
                  {t.votes} {t.votes === 1 ? "vote" : "votes"}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="qt-result-safe">The table's playing it close. No clear target… yet.</div>
        )}

        <motion.button className="qt-btn" onClick={onNext}>
          <span className="face">Next round →</span>
        </motion.button>
        <div className="qt-result-progress">
          <motion.span
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: TIMINGS.result / 1000, ease: "linear" }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
