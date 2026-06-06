import { motion } from "framer-motion";
import type { Stake } from "@/types";
import { STAKES, TABLE_SIZE, BRAND_LOGO_ID } from "@/game/constants";
import { formatMoney } from "@/game/util";

interface Props {
  onSelect: (s: Stake) => void;
  /** False while the intro splash is still showing; flips true once the
      logo has landed, cueing the rest of the content to load in. */
  entered: boolean;
}

export function StakeSelectScreen({ onSelect, entered }: Props) {
  // Content holds hidden until the intro logo pans into place, then reveals.
  const reveal = (delay: number) => ({
    initial: false,
    animate: entered ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 },
    transition: { delay: entered ? delay : 0, type: "spring" as const, stiffness: 260, damping: 22 },
  });

  return (
    <div className="qt-screen qt-wall">
      <div className="qt-splash">
        <div className="qt-title">
          <motion.img
            layoutId={BRAND_LOGO_ID}
            className="qt-logo"
            src="/qtraitors-logo.webp"
            alt="Q-Traitors"
            draggable={false}
            transition={{ layout: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
          />
          <motion.p {...reveal(0.32)}>
            Read the room. Dodge the vote.
            <br />
            <span className="hl">Split the pot.</span>
          </motion.p>
        </div>

        <motion.div className="qt-stakes-head" {...reveal(0.36)}>
          <div className="eyebrow">Pick your stake</div>
        </motion.div>

        <div className="qt-stake-grid">
          {STAKES.map((s, i) => (
            <motion.button
              key={s}
              className="qt-stake"
              onClick={() => onSelect(s)}
              {...reveal(0.4 + i * 0.06)}
            >
              <span className="face">
                <span className="amt">{formatMoney(s)}</span>
                <span className="pool">Pool {formatMoney(s * TABLE_SIZE)}</span>
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div className="qt-howto" {...reveal(0.6)}>
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
