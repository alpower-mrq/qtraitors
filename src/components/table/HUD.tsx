import { formatMoney } from "@/game/util";

interface Props {
  round: number;
  prizePool: number;
  alive: number;
  total: number;
}

export function HUD({ round, prizePool, alive, total }: Props) {
  return (
    <div className="qt-hud">
      <div className="qt-hud-chip">
        <span className="k">Round</span>
        <span className="v">{Math.max(1, round)}</span>
      </div>
      <div className="qt-hud-spacer" />
      <div className="qt-hud-chip qt-hud-pot">
        <span className="k">Prize pool</span>
        <span className="v">{formatMoney(prizePool)}</span>
      </div>
      <div className="qt-hud-chip qt-hud-left">
        <span className="k">Still in</span>
        <span className="v">
          {alive}/{total}
        </span>
      </div>
    </div>
  );
}
