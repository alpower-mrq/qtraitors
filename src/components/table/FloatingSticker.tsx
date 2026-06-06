import { useEffect } from "react";
import { motion } from "framer-motion";
import type { ActiveSticker } from "@/types";
import { TIMINGS } from "@/game/constants";

interface Props {
  sticker: ActiveSticker;
  onExpire: (key: string) => void;
}

/** A sticker that pops above a seat, hangs for a beat, then floats away.
    Owns its own lifespan so it survives phase changes cleanly. */
export function FloatingSticker({ sticker, onExpire }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onExpire(sticker.key), TIMINGS.stickerLife);
    return () => clearTimeout(t);
  }, [sticker.key, onExpire]);

  return (
    <motion.div
      className="qt-sticker"
      initial={{ opacity: 0, scale: 0.4, x: "-50%", y: 8 }}
      animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
      exit={{ opacity: 0, scale: 0.7, x: "-50%", y: -22 }}
      transition={{ type: "spring", stiffness: 520, damping: 22 }}
    >
      <span className="em">{sticker.emoji}</span>
      {sticker.label}
    </motion.div>
  );
}
