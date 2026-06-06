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
// Each SFX keeps a small pool of preloaded nodes so hits fire instantly
// and can overlap, instead of fetching a fresh element on every play.
const sfxPool = new Map<Sfx, HTMLAudioElement[]>();
const POOL_SIZE = 3;

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

function getSfxPool(name: Sfx): HTMLAudioElement[] {
  let pool = sfxPool.get(name);
  if (!pool) {
    pool = Array.from({ length: POOL_SIZE }, () => {
      const a = new Audio(SFX[name]);
      a.preload = "auto";
      a.volume = SFX_VOL[name];
      a.load();
      return a;
    });
    sfxPool.set(name, pool);
  }
  return pool;
}

function playCurrent() {
  if (!unlocked || muted || !current) return;
  getMusic(current)
    .play()
    .catch(() => {});
}

export const audio = {
  /** Call on every user gesture. The first one warms the SFX; every call
      (re)attempts the current track, so a play() the browser blocked on an
      earlier tap recovers on the next one instead of waiting for a route change. */
  unlock() {
    if (!unlocked) {
      unlocked = true;
      (Object.keys(SFX) as Sfx[]).forEach(getSfxPool); // warm up the SFX
    }
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
    if (t) getMusic(t); // create the element now so it preloads before the first gesture
    playCurrent();
  },
  /** Fire a one-shot sound effect (reuses a preloaded node from the pool). */
  sfx(name: Sfx) {
    if (!unlocked || muted) return;
    const pool = getSfxPool(name);
    // pick a node that's free (ended/paused), else the first one
    const node = pool.find((a) => a.paused || a.ended) ?? pool[0];
    try {
      node.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
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
