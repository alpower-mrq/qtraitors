import type { Badge } from "@/types";

/** Tiny status badge shown under a player (placeholder stats for now). */
export function SurvivorBadge({ badge }: { badge: Badge }) {
  return (
    <span className="qt-badge">
      <span className="ic">{badge.icon}</span>
      {badge.label}
    </span>
  );
}
