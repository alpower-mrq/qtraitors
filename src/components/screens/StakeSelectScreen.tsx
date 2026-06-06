import { motion } from "framer-motion";
import type { Stake } from "@/types";
import { STAKES, TABLE_SIZE } from "@/game/constants";
import { formatMoney } from "@/game/util";

export function StakeSelectScreen({ onSelect }: { onSelect: (s: Stake) => void }) {
  return (
    <div className="qt-screen qt-wall">
      <div className="qt-splash">
        <motion.div
          className="qt-title"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <img className="qt-logo" src="/qtraitors-logo.webp" alt="Q-Traitors" />
          <p>
            Read the room. Dodge the vote.
            <br />
            <span className="hl">Split the pot.</span>
          </p>
        </motion.div>

        <div className="qt-stakes-head">
          <div className="eyebrow">Pick your stake</div>
        </div>

        <div className="qt-stake-grid">
          {STAKES.map((s, i) => (
            <motion.button
              key={s}
              className="qt-stake"
              onClick={() => onSelect(s)}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 260, damping: 20 }}
            >
              <span className="face">
                <span className="amt">{formatMoney(s)}</span>
                <span className="pool">Pool {formatMoney(s * TABLE_SIZE)}</span>
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div
          className="qt-howto"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="qt-step">
            <span className="n">1</span>
            <span className="t">Six players take a seat.</span>
          </div>
          <div className="qt-step">
            <span className="n">2</span>
            <span className="t">Each round, the table votes someone out. 10 seconds to choose.</span>
          </div>
          <div className="qt-step">
            <span className="n">3</span>
            <span className="t">Last two standing split the pot.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
