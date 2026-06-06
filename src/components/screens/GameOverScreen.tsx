import { motion } from "framer-motion";
import type { GameState } from "@/types";
import { HUMAN_ID } from "@/game/constants";
import { formatMoney } from "@/game/util";
import { Avatar } from "@/components/table/Avatar";

const CONFETTI = ["var(--yellow)", "var(--green)", "var(--pink)", "var(--sky)", "#fff"];

export function GameOverScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const finalists = state.players.filter((p) => p.isAlive);
  const youWon = finalists.some((p) => p.id === HUMAN_ID);
  const share = state.prizePool / Math.max(1, finalists.length);

  return (
    <div className="qt-screen qt-wall">
      {youWon &&
        Array.from({ length: 18 }).map((_, i) => (
          <motion.span
            key={i}
            className="qt-confetti"
            style={{ left: `${(i * 5.6 + 4) % 100}%`, background: CONFETTI[i % CONFETTI.length] }}
            initial={{ y: -20, opacity: 0, rotate: 0 }}
            animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 360 * (i % 2 ? 1 : -1) }}
            transition={{ duration: 2.4 + (i % 5) * 0.3, delay: (i % 6) * 0.15, ease: "easeIn" }}
          />
        ))}

      <div className="qt-over">
        <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="eyebrow">{youWon ? "Winner, winner" : "Game over"}</div>
        </motion.div>

        <motion.h1
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
        >
          {youWon ? (
            <>
              You split the <span className="hl">pot</span>
            </>
          ) : (
            <>
              Pipped at the <span className="hl">post</span>
            </>
          )}
        </motion.h1>

        <p className="sub">
          {youWon
            ? `${formatMoney(share)} is yours. The other ${finalists.length - 1 || 1} got the rest. That's the deal.`
            : `The pot went to the final two. You'll read them better next time.`}
        </p>

        <div className="qt-finalists">
          {finalists.map((p, i) => (
            <motion.div
              key={p.id}
              className="qt-finalist"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.12, type: "spring", stiffness: 260, damping: 18 }}
            >
              <Avatar avatarId={p.avatarId} size={132} />
              <span className="nm">{p.id === HUMAN_ID ? "You" : p.name}</span>
              <span className="pay">{formatMoney(share)}</span>
            </motion.div>
          ))}
        </div>

        <div className="qt-over-actions">
          <motion.button className="qt-btn" onClick={onRestart}>
            <span className="face">Play again</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
