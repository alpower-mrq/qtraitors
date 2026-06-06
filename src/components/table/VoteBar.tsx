import type { GamePhase } from "@/types";

interface Props {
  phase: GamePhase;
  humanAlive: boolean;
  humanVoteName: string | null;
  votedCount: number;
  aliveCount: number;
  timeLeftMs: number;
  humanIsCandidate: boolean;
  runoffEligible: number;
  onLeave: () => void;
}

export function VoteBar({
  phase,
  humanAlive,
  humanVoteName,
  votedCount,
  aliveCount,
  timeLeftMs,
  humanIsCandidate,
  runoffEligible,
  onLeave,
}: Props) {
  const countChip = (
    <span className="count">
      {votedCount}/{aliveCount} voted
    </span>
  );

  if (phase === "seating") {
    return (
      <div className="qt-vbar">
        <span className="lead">Players are taking their seats…</span>
      </div>
    );
  }

  if (phase === "voting") {
    if (!humanAlive) {
      return (
        <div className="qt-vbar">
          <span className="lead">You're out. Watching the rest unfold.</span>
          <button className="leave" onClick={onLeave}>
            Leave
          </button>
        </div>
      );
    }
    if (humanVoteName == null) {
      const danger = timeLeftMs <= 3000;
      return (
        <div className={`qt-vbar ${danger ? "danger" : ""}`}>
          <span className="lead">{danger ? "Clock's almost out!" : "Tap a player to vote"}</span>
          {countChip}
        </div>
      );
    }
    return (
      <div className="qt-vbar voted">
        <span className="lead">
          ✓ Voted for <b>{humanVoteName}</b>
        </span>
        {countChip}
      </div>
    );
  }

  if (phase === "tally") {
    return (
      <div className="qt-vbar">
        <span className="lead">Votes are in. Counting them up…</span>
      </div>
    );
  }

  if (phase === "tiebreak") {
    const runoffChip = (
      <span className="count">
        {votedCount}/{runoffEligible} voted
      </span>
    );
    if (!humanAlive) {
      return (
        <div className="qt-vbar">
          <span className="lead">Votes tied. The table re-votes who goes.</span>
          <button className="leave" onClick={onLeave}>
            Leave
          </button>
        </div>
      );
    }
    if (humanIsCandidate) {
      return (
        <div className="qt-vbar danger">
          <span className="lead">You're in the tie. The others vote one out.</span>
          {runoffChip}
        </div>
      );
    }
    if (humanVoteName) {
      return (
        <div className="qt-vbar voted">
          <span className="lead">
            ✓ Voted out <b>{humanVoteName}</b>
          </span>
          {runoffChip}
        </div>
      );
    }
    return (
      <div className="qt-vbar danger">
        <span className="lead">Votes tied. Tap one to vote out.</span>
        {runoffChip}
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="qt-vbar">
        <span className="lead">{humanAlive ? "You survived the round." : "Still watching…"}</span>
      </div>
    );
  }

  // elimination — overlay carries the moment
  return (
    <div className="qt-vbar danger">
      <span className="lead">Someone's leaving the table…</span>
    </div>
  );
}
