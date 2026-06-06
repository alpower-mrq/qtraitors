import type { Sticker } from "@/types";
import { STICKERS } from "@/data/stickers";

/** The whole social vocabulary — tap to float a sticker over your seat. */
export function StickerTray({ onThrow }: { onThrow: (s: Sticker) => void }) {
  return (
    <div className="qt-tray">
      <span className="qt-tray-label">React</span>
      <div className="qt-tray-scroll qt-scroll">
        {STICKERS.map((s) => (
          <button key={s.id} className="qt-sticker-btn" onClick={() => onThrow(s)} aria-label={s.label}>
            <span className="em">{s.emoji}</span>
            <span className="lb">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
