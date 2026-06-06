import { AnimatePresence, motion } from "framer-motion";
import type { ActiveSticker, Player } from "@/types";
import { AVATAR_AR } from "@/data/avatars";
import { Avatar } from "./Avatar";
import { PresenceStatus } from "./PresenceStatus";
import { FloatingSticker } from "./FloatingSticker";

export interface SeatPos {
  leftPct: number;
  topPct: number;
  scale: number;
  z: number;
}

interface Props {
  player: Player;
  pos: SeatPos;
  size: number;
  votable: boolean;
  picked: boolean;
  dim: boolean;
  candidate?: boolean;
  onVote: () => void;
  showCount: boolean;
  voteCount?: number;
  isLead?: boolean;
  revealDelay?: number;
  sticker?: ActiveSticker;
  onStickerExpire: (key: string) => void;
}

export function PlayerSeat({
  player,
  pos,
  size,
  votable,
  picked,
  dim,
  candidate,
  onVote,
  showCount,
  voteCount,
  isLead,
  revealDelay = 0,
  sticker,
  onStickerExpire,
}: Props) {
  const variant = !player.isAlive ? (player.isHuman ? "ghost" : "dead") : "alive";
  const dotClass = player.status === "voted" ? "voted" : "pending";
  const avH = size * AVATAR_AR; // oval avatars are taller than wide

  return (
    <motion.div
      className={`qt-seat ${votable ? "votable" : ""} ${picked ? "picked" : ""} ${dim ? "dim" : ""} ${candidate ? "candidate" : ""}`}
      style={{ width: size + 28, marginLeft: -(size + 28) / 2, marginTop: -(avH / 2 + 2), zIndex: pos.z }}
      initial={{ opacity: 0, scale: 0.2, left: `${pos.leftPct}%`, top: `${pos.topPct}%` }}
      animate={{ opacity: 1, scale: pos.scale, left: `${pos.leftPct}%`, top: `${pos.topPct}%` }}
      exit={{ opacity: 0, y: 18, scale: 0.96, filter: "grayscale(1) blur(1px)", transition: { duration: 0.5 } }}
      transition={{ type: "spring", stiffness: 230, damping: 24 }}
    >
      <button
        className="qt-seat-tap"
        onClick={votable ? onVote : undefined}
        disabled={!votable}
        aria-label={votable ? `Vote for ${player.name}` : player.name}
      >
        <Avatar avatarId={player.avatarId} size={size} variant={variant} />

        {/* live presence dot */}
        {player.isAlive && <span className={`qt-live-dot ${dotClass}`} />}

        {/* eliminated marker */}
        {variant === "dead" && (
          <span
            style={{
              position: "absolute",
              top: "46%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: size * 0.5,
              filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.6))",
            }}
          >
            💀
          </span>
        )}

        {/* vote count reveal */}
        <AnimatePresence>
          {showCount && voteCount != null && (
            <motion.span
              className={`qt-votecount ${isLead ? "lead" : ""}`}
              initial={{ scale: 0, y: -4 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 18, delay: revealDelay }}
            >
              {voteCount}
            </motion.span>
          )}
        </AnimatePresence>

        {/* "your vote" flag — unmistakable who you picked */}
        <AnimatePresence>
          {picked && (
            <motion.span
              className="qt-vote-tag"
              initial={{ scale: 0, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 18 }}
            >
              Your vote
            </motion.span>
          )}
        </AnimatePresence>

        {/* floating sticker */}
        <AnimatePresence>
          {sticker && <FloatingSticker key={sticker.key} sticker={sticker} onExpire={onStickerExpire} />}
        </AnimatePresence>
      </button>

      <span className={`qt-name ${player.isHuman ? "you" : ""}`}>{player.name}</span>

      <PresenceStatus status={player.status} />
    </motion.div>
  );
}
