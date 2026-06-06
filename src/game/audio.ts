/* ============================================================
   Audio — looping music per screen + one-shot SFX.
   Browsers block sound until a user gesture, so the first
   interaction calls unlock(); music then follows the screen.
   ============================================================ */

type Track = "lobby" | "dark";
type Sfx = "choose" | "eliminated" | "click" | "cheer";

const MUSIC: Record<Track, string> = {
  lobby: "/audio/lobby.m4a",
  dark: "/audio/dark.m4a",
};
const SFX: Record<Sfx, string> = {
  choose: "/audio/choose.m4a",
  eliminated: "/audio/eliminated.m4a",
  click: "/audio/click.m4a",
  cheer: "/audio/cheer.m4a",
};
const SFX_VOL: Record<Sfx, number> = { choose: 0.5, eliminated: 0.7, click: 0.32, cheer: 0.75 };
const MUSIC_VOL = 0.3;

let unlocked = false;
let muted = false;
let current: Track | null = null;
const musicEls = new Map<Track, HTMLAudioElement>();

function getMusic(t: Track): HTMLAudioElement {
  let el = musicEls.get(t);
  if (!el) {
    el = new Audio(MUSIC[t]);
    el.loop = true;
    el.volume = MUSIC_VOL;
    el.preload = "auto";
    musicEls.set(t, el);
  }
  return el;
}

function playCurrent() {
  if (!unlocked || muted || !current) return;
  getMusic(current)
    .play()
    .catch(() => {});
}

export const audio = {
  /** Call on the first user gesture to satisfy autoplay policies. */
  unlock() {
    if (unlocked) return;
    unlocked = true;
    playCurrent();
  },
  /** Switch the looping background track (or null to stop). */
  setMusic(t: Track | null) {
    if (current === t) {
      playCurrent();
      return;
    }
    if (current) getMusic(current).pause();
    current = t;
    playCurrent();
  },
  /** Fire a one-shot sound effect. */
  sfx(name: Sfx) {
    if (!unlocked || muted) return;
    const node = new Audio(SFX[name]); // fresh node so rapid hits overlap
    node.volume = SFX_VOL[name];
    node.play().catch(() => {});
  },
  toggleMute(): boolean {
    muted = !muted;
    if (muted) musicEls.forEach((el) => el.pause());
    else playCurrent();
    return muted;
  },
  isMuted() {
    return muted;
  },
};
