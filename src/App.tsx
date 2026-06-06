import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "@/game/useGame";
import { audio } from "@/game/audio";
import { StakeSelectScreen } from "@/components/screens/StakeSelectScreen";
import { AvatarSelectScreen } from "@/components/screens/AvatarSelectScreen";
import { TableScreen } from "@/components/screens/TableScreen";
import { GameOverScreen } from "@/components/screens/GameOverScreen";

import "@/styles/table.css";
import "@/styles/screens.css";
import "@/styles/ui.css";
import "@/styles/overlays.css";

type Route = "stake" | "avatar" | "table" | "gameover";

/** Collapse the play phases into one stable route so the table never
    remounts mid-game (its animations need to persist across phases). */
function routeFor(phase: string): Route {
  if (phase === "stake") return "stake";
  if (phase === "avatar") return "avatar";
  if (phase === "gameover") return "gameover";
  return "table";
}

const MUSIC: Record<Route, "lobby" | "dark"> = {
  stake: "lobby",
  avatar: "lobby",
  table: "dark",
  gameover: "lobby",
};

const CLICK_TARGETS = ".qt-btn, .qt-stake, .qt-back, .qt-vbar .next, .qt-vbar .leave";

export default function App() {
  const api = useGame();
  const { state } = api;
  const route = routeFor(state.phase);
  const [muted, setMuted] = useState(false);

  // Unlock audio on the first gesture + play a click for any button press.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      audio.unlock();
      const el = e.target as Element | null;
      if (el && el.closest(CLICK_TARGETS)) audio.sfx("click");
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  // Background music follows the screen.
  useEffect(() => {
    audio.setMusic(MUSIC[route]);
  }, [route]);

  // Beat-driven SFX — fire once per phase change.
  useEffect(() => {
    if (state.phase === "elimination") audio.sfx("eliminated");
    else if (state.phase === "gameover" && state.players.some((p) => p.isHuman && p.isAlive)) {
      audio.sfx("cheer");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  return (
    <div className="app-frame">
      <button
        className="qt-mute"
        onClick={() => setMuted(audio.toggleMute())}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? "🔇" : "🔊"}
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={route}
          style={{ position: "absolute", inset: 0, display: "flex" }}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {route === "stake" && <StakeSelectScreen onSelect={api.selectStake} />}
          {route === "avatar" && state.stake && (
            <AvatarSelectScreen stake={state.stake} onConfirm={api.selectAvatar} onBack={api.backToStake} />
          )}
          {route === "table" && <TableScreen api={api} />}
          {route === "gameover" && <GameOverScreen state={state} onRestart={api.restart} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
