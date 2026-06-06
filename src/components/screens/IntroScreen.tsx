import { useEffect } from "react";
import { motion } from "framer-motion";
import { BRAND_LOGO_ID } from "@/game/constants";

/**
 * First-load splash. A large logo + tagline holds for a beat, then the
 * logo pans into its homepage spot via a shared `layoutId` (the matching
 * logo lives in StakeSelectScreen) while the backdrop fades away.
 * Tap anywhere to skip.
 */
export function IntroScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div className="qt-intro" onPointerDown={onDone}>
      {/* dark backdrop fades out to reveal the homepage wall underneath */}
      <motion.div
        className="qt-intro-bg"
        exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      />

      <div className="qt-intro-inner">
        <motion.img
          layoutId={BRAND_LOGO_ID}
          className="qt-intro-logo"
          src="/qtraitors-logo.webp"
          alt="Q-Traitors"
          draggable={false}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ opacity: { duration: 0.5 }, scale: { type: "spring", stiffness: 140, damping: 15 } }}
        />
        <motion.p
          className="qt-intro-tag"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6, transition: { duration: 0.25 } }}
          transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          Two survive.
          <br />
          <span className="hl">Everyone else cries.</span>
        </motion.p>
      </div>
    </motion.div>
  );
}
