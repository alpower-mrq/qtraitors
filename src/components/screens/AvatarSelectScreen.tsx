import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Player, Stake } from "@/types";
import { AVATARS, AVATAR_COUNT } from "@/data/avatars";
import { TABLE_SIZE } from "@/game/constants";
import { createBots } from "@/game/simulation";
import { audio } from "@/game/audio";
import { formatMoney, pick, randInt, shuffle } from "@/game/util";
import { Avatar } from "@/components/table/Avatar";

interface Props {
  stake: Stake;
  onConfirm: (avatarId: number, bots: Player[]) => void;
  onBack: () => void;
}

type ClaimStatus = "choosing" | "picked";
type Claims = Record<string, { avatarId: number; status: ClaimStatus }>;

export function AvatarSelectScreen({ stake, onConfirm, onBack }: Props) {
  // The five opponents for this table, generated once.
  const [bots] = useState(() => createBots());

  // Reshuffle the gallery order on every visit so the faces never come up
  // in the same arrangement twice.
  const [ordered] = useState(() => shuffle(AVATARS));

  // Tints the top bar once the grid scrolls away from the top.
  const [scrolled, setScrolled] = useState(false);

  const [selected, setSelected] = useState(() => Math.floor(Math.random() * AVATAR_COUNT));
  const selectedRef = useRef(selected);

  // botId -> the face they've grabbed (and whether they're still deciding).
  const [claims, setClaims] = useState<Claims>({});

  const choose = (id: number) => {
    selectedRef.current = id;
    setSelected(id);
    audio.sfx("choose");
  };

  // Opponents claim faces live, on staggered delays. They won't grab the
  // one you're sitting on, and a face someone's grabbed is locked to you.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    bots.forEach((bot, i) => {
      const eyeAt = 500 + i * randInt(750, 1400) + randInt(0, 350);
      const lockAfter = randInt(650, 1200);

      timers.push(
        setTimeout(() => {
          // reserve a free face (not yours, not already taken)
          setClaims((prev) => {
            if (prev[bot.id]) return prev;
            const used = new Set(Object.values(prev).map((c) => c.avatarId));
            const free = AVATARS.map((a) => a.id).filter(
              (id) => id !== selectedRef.current && !used.has(id)
            );
            if (!free.length) return prev;
            return { ...prev, [bot.id]: { avatarId: pick(free), status: "choosing" } };
          });
          // lock it in a beat later
          timers.push(
            setTimeout(() => {
              setClaims((prev) =>
                prev[bot.id] ? { ...prev, [bot.id]: { ...prev[bot.id], status: "picked" } } : prev
              );
            }, lockAfter)
          );
        }, eyeAt)
      );
    });
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // avatarId -> { picker name, status } for quick lookup while rendering.
  const claimByAvatar: Record<number, { name: string; status: ClaimStatus }> = {};
  for (const [botId, c] of Object.entries(claims)) {
    const name = bots.find((b) => b.id === botId)?.name ?? "Player";
    claimByAvatar[c.avatarId] = { name, status: c.status };
  }
  const pickedCount = Object.values(claims).filter((c) => c.status === "picked").length;

  const confirm = () => {
    const withFaces = bots.map((b) => ({ ...b, avatarId: claims[b.id]?.avatarId ?? -1 }));
    onConfirm(selected, withFaces);
  };

  return (
    <div className="qt-screen">
      <div className={`qt-avatar-screen ${scrolled ? "scrolled" : ""}`}>
        <motion.button
          className="qt-back"
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
          aria-label="Back to stake selection"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>

        <div
          className="qt-avatar-scroll qt-scroll"
          onScroll={(e) => {
            const s = e.currentTarget.scrollTop > 6;
            setScrolled((prev) => (prev === s ? prev : s));
          }}
        >
          <header>
            <div className="eyebrow">
              {formatMoney(stake)} table · pool {formatMoney(stake * TABLE_SIZE)}
            </div>
            <h2>Pick your face</h2>
            <p>Grab a face before it's taken.</p>
          </header>

          <div className="qt-avatar-grid">
            {ordered.map((a, i) => {
              const claim = claimByAvatar[a.id];
              const taken = !!claim;
              const isSel = !taken && selected === a.id;
              return (
                <motion.button
                  key={a.id}
                  className={`qt-avatar-cell ${isSel ? "sel" : ""} ${taken ? `taken ${claim.status}` : ""}`}
                  onClick={() => !taken && choose(a.id)}
                  disabled={taken}
                  aria-label={taken ? `${claim.name} took this face` : `Avatar ${a.id + 1}`}
                  initial={{ opacity: 0, scale: 0.82 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5), type: "spring", stiffness: 420, damping: 26 }}
                >
                  <Avatar
                    avatarId={a.id}
                    size={138}
                    variant={taken && claim.status === "picked" ? "dead" : "alive"}
                  />
                  {taken && (
                    <motion.span
                      className={`qt-taken-tag ${claim.status}`}
                      initial={{ scale: 0, y: 8 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 520, damping: 20 }}
                    >
                      {claim.status === "choosing" ? `${claim.name}…` : `🔒 ${claim.name}`}
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="qt-avatar-foot">
          {pickedCount > 0 && (
            <div className="qt-pick-live">
              <span className="dot" />
              {pickedCount} of {TABLE_SIZE - 1} players have picked
            </div>
          )}
          <motion.button className="qt-btn" onClick={confirm}>
            <span className="face">Take my seat →</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
