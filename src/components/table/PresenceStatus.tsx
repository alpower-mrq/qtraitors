import type { PresenceStatus as Status } from "@/types";

/* Deliberately minimal: the only states worth surfacing are "voted" and,
   for a knocked-out human, "spectating". Everyone else just shows nothing
   (a missing "Voted" pill reads as "hasn't voted yet"). */
const LABELS: Partial<Record<Status, string>> = {
  voted: "Voted",
  spectating: "Spectating",
};

export function PresenceStatus({ status }: { status: Status }) {
  const label = LABELS[status];
  if (!label) return null;
  return (
    <span className={`qt-status ${status}`}>
      {status === "voted" && "✓ "}
      {label}
    </span>
  );
}
