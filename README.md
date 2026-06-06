# Q-Traitors

A mobile-first social elimination game for MrQ. Six players sit around a table,
vote someone out every round, and the **last two standing split the pot**. No chat —
the whole social layer is built from stickers, presence and timing, so it *feels*
like real people are sitting at the table with you.

This prototype uses **simulated players** with realistic delays and behaviour. The
architecture is built so the bots can later be swapped for a real multiplayer backend
without touching the UI.

> Read the room, dodge the vote, split the pot.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build      # typecheck + production build
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
```

Designed for mobile portrait. In a desktop browser, open dev tools and emulate a
phone (the app is capped to a 480px-wide frame and centred).

---

## How a game flows

1. **Pick a stake** — £2 / £5 / £10 / £20. The prize pool is `stake × 6`.
2. **Pick a face** — 20 placeholder avatars.
3. **Take your seat** — the other five players *arrive one by one* with join animations.
4. **Vote** — 10 seconds per round. Tap a player (never yourself). Miss the clock and
   you auto-vote yourself. Bots vote after realistic, staggered delays.
5. **Reveal** — only the **counts** are shown, popped onto each seat (`Paul 3`, `Sarah 2`…).
   Who voted for who is never revealed.
6. **Elimination** — most votes is out. A tie triggers *"The Traitors have decided…"*
   and one of the tied players is removed at random.
7. **Repeat** — survivors reposition around the table; tension warnings flag who took heat.
8. **Final two** split the pool. If *you* get voted out, you stay on as a ghost spectator
   and watch it play out.

---

## Social presence — the whole point

There is no chat. Presence is everything, so it's built from several always-on signals:

- **Stickers** — tap the bottom tray to float 👀 / 😂 / 😱 / ❤️ / 👑 / 🐍 / ☠️ above your
  seat for a couple of seconds. Bots throw them too, as banter and reactions.
- **Live presence** — every seat shows `Thinking…`, `Choosing…`, `Ready` or `Voted ✓`,
  plus a coloured "live" dot, so the table is never static.
- **Gradual arrivals** — seats fill one at a time; nobody pops in instantly.
- **Ambient life** — between the dramatic beats, bots quietly shift status and react.
- **Survivor badges** — 🏆 Won 2, 🔥 Hot Streak, ⭐ Veteran… (placeholder stats).
- **Anticipation** — staggered count reveals, a danger-red final 3 seconds, the tie-break
  spotlight, dramatic eliminations and near-miss warnings all build round-to-round tension.

---

## Architecture

```
src/
  types.ts                 # domain model (GameState, Player, phases…)
  game/
    constants.ts           # table size, stakes, all timings
    reducer.ts             # pure state machine — every transition lives here
    simulation.ts          # player generation + bot voting behaviour
    useGame.ts             # orchestration: timers/effects that drive the sim
    util.ts                # rng, money formatting, ids
  data/
    avatars.ts             # 50 avatar definitions (gradient + glyph)
    names.ts  badges.ts  stickers.ts
  components/
    table/                 # GameTable, PlayerSeat, Avatar, CenterStage, HUD, VoteBar…
    overlays/              # tie-break / elimination / result drama
    screens/               # stake select, avatar select, table, game over
  styles/                  # design tokens live in index.css; the rest is grouped CSS
```

### State management

A single `useReducer` holds the whole `GameState`. The **reducer is pure** — it only
computes the next state. All *time* (countdowns, bot delays, dramatic beats) lives in
`useGame`, in `useEffect` blocks keyed on the current phase, each of which schedules
`setTimeout`s and cleans them up. This keeps game logic testable and the simulation
swappable.

### The game is a phase machine

`stake → avatar → seating → voting → tally → (tiebreak) → elimination → result → … → gameover`

### Why it animates well

[Framer Motion](https://www.framer.com/motion/) drives everything: `AnimatePresence` for
joins / eliminations / overlays, and `layout`-style position animation so survivors
**slide to new seats** when the table shrinks. Seats are laid out around an ellipse by
angle, with the human pinned to the bottom — recomputed whenever the alive set changes.

---

## Built to be replaced

This is a prototype with two deliberate seams:

**Avatars are real art.**
The 20 avatars are oval character badges (transparent corners) served from
`public/avatars/1.png … 20.png`. `components/table/Avatar.tsx` is the *only* place
that knows how an avatar is drawn — it renders an `<img>` at the art's aspect ratio.
To swap the set, drop new files into `public/avatars` using the same filenames; to
change the count or wiring, edit `data/avatars.ts`. (Source masters live in `/assets`.)

**Swap the simulated players for a real backend.**
All bot behaviour is isolated in `game/simulation.ts` and the effect blocks in
`game/useGame.ts`. To go live: keep the reducer and components, and instead of scheduling
bot votes/stickers on timers, dispatch the same actions (`CAST_VOTE`, `ADD_STICKER`,
`SET_STATUS`, `SEAT_PLAYER`, …) from socket/server events. The UI already treats every
player identically — it doesn't know or care which are human.

---

## Tech

React 18 · TypeScript · Vite · Framer Motion. No external assets — avatars, table and
effects are all CSS/SVG. Type set in a condensed display face (Oswald, standing in for
MrQ's Formula Condensed) over Inter for UI.

## Brand

Built to MrQ's brand: MrQ Blue leads, white supports, yellow / green / pink as sparing
accents, and a dry, confident tone throughout. The "Q" in Q-Traitors is the MrQ Q.
