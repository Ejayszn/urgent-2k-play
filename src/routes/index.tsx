import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ENTRY_FEE, PRIZE, SEATS, WINNERS, formatNaira, useGame } from "@/lib/game-store";
import { Zap, Trophy, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Urgent 2k — Win ₦1,000 every round" },
      { name: "description", content: "Join a round for ₦500. 3 of 10 players win ₦1,000 instantly. Fast, fair, urgent." },
    ],
  }),
  component: Index,
});

type SeatState = "empty" | "taken" | "you" | "winner" | "you-winner";
type Phase = "idle" | "filling" | "revealing" | "done";

interface Seat {
  state: SeatState;
  name: string;
}

const BOT_NAMES = ["Tunde", "Amaka", "Chinedu", "Femi", "Zainab", "Kemi", "Bola", "Ifeanyi", "Ngozi", "Seun", "Tobi", "Hauwa"];

function makeEmpty(): Seat[] {
  return Array.from({ length: SEATS }, () => ({ state: "empty" as SeatState, name: "" }));
}

function Index() {
  const game = useGame();
  const [seats, setSeats] = useState<Seat[]>(makeEmpty);
  const [phase, setPhase] = useState<Phase>("idle");
  const [roundNo, setRoundNo] = useState(1842);
  const [showResult, setShowResult] = useState(false);
  const [youWon, setYouWon] = useState(false);
  const timeouts = useRef<number[]>([]);

  // Pre-fill ambient seats when idle for "live" feel
  useEffect(() => {
    if (phase !== "idle") return;
    const seed = makeEmpty();
    const initialFill = 5 + Math.floor(Math.random() * 3);
    const idxs = shuffle(Array.from({ length: SEATS }, (_, i) => i)).slice(0, initialFill);
    idxs.forEach((i) => (seed[i] = { state: "taken", name: pickName([]) }));
    setSeats(seed);
  }, [phase, roundNo]);

  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  const filled = seats.filter((s) => s.state !== "empty").length;

  function join() {
    if (phase !== "idle") return;
    if (game.balance < ENTRY_FEE) return;
    game.setBalance(game.balance - ENTRY_FEE);

    // Place "you" in first empty seat
    const next = [...seats];
    const yourIdx = next.findIndex((s) => s.state === "empty");
    if (yourIdx === -1) return;
    next[yourIdx] = { state: "you", name: "You" };
    setSeats(next);
    setPhase("filling");

    // Fill remaining empties one-by-one
    const emptyIdxs = next.map((s, i) => (s.state === "empty" ? i : -1)).filter((i) => i >= 0);
    const shuffled = shuffle(emptyIdxs);
    const usedNames: string[] = [];
    shuffled.forEach((idx, k) => {
      const t = window.setTimeout(() => {
        setSeats((cur) => {
          const n = [...cur];
          const nm = pickName(usedNames);
          usedNames.push(nm);
          n[idx] = { state: "taken", name: nm };
          return n;
        });
        if (k === shuffled.length - 1) {
          const t2 = window.setTimeout(reveal, 600);
          timeouts.current.push(t2);
        }
      }, 220 + k * (180 + Math.random() * 120));
      timeouts.current.push(t);
    });
  }

  function reveal() {
    setPhase("revealing");
    setSeats((cur) => {
      const winners = shuffle(Array.from({ length: SEATS }, (_, i) => i)).slice(0, WINNERS);
      const yourIdx = cur.findIndex((s) => s.state === "you");
      const won = winners.includes(yourIdx);
      const next = cur.map((s, i) => {
        if (winners.includes(i)) {
          return { ...s, state: (s.state === "you" ? "you-winner" : "winner") as SeatState };
        }
        return s;
      });
      const t = window.setTimeout(() => {
        setYouWon(won);
        setShowResult(true);
        setPhase("done");
        game.bumpStats(won);
        if (won) game.topUp(PRIZE);
        game.addHistory({
          id: String(Date.now()),
          date: Date.now(),
          won,
          amount: won ? PRIZE - ENTRY_FEE : -ENTRY_FEE,
        });
      }, 900);
      timeouts.current.push(t);
      return next;
    });
  }

  function nextRound() {
    setShowResult(false);
    setRoundNo((r) => r + 1);
    setPhase("idle");
    setSeats(makeEmpty());
  }

  function rejoin() {
    nextRound();
    // small delay to allow ambient fill then join
    const t = window.setTimeout(() => join(), 250);
    timeouts.current.push(t);
  }

  const oddsPct = Math.round((WINNERS / SEATS) * 100);

  return (
    <AppShell>
      <div className="flex items-center justify-between mt-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-red bg-accent px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
              Live · Round #{roundNo}
            </span>
          </div>
          <h1 className="mt-3 text-[34px] leading-none text-display">
            Win <span className="text-brand-red">{formatNaira(PRIZE)}</span>
            <br />in seconds.
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            10 seats. 3 winners. {formatNaira(ENTRY_FEE)} to play.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mt-5">
        <Stat icon={<Trophy className="w-3.5 h-3.5" />} label="Odds" value={`${WINNERS}/${SEATS}`} sub={`${oddsPct}%`} />
        <Stat icon={<Zap className="w-3.5 h-3.5" />} label="Payout" value="2×" sub="instant" />
        <Stat icon={<TrendingUp className="w-3.5 h-3.5" />} label="Today" value={String(game.roundsCompletedToday)} sub="rounds" />
      </div>

      {/* Seats */}
      <div className="mt-6 rounded-3xl bg-white border border-border p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold">
            {filled}/{SEATS} seats filled
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            {formatNaira(ENTRY_FEE)} entry · {formatNaira(PRIZE)} prize
          </div>
        </div>
        <div className="h-1.5 rounded-full bg-secondary overflow-hidden mb-5">
          <div
            className="h-full bg-brand-red transition-all duration-500"
            style={{ width: `${(filled / SEATS) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-5 gap-2.5">
          {seats.map((s, i) => (
            <SeatChip key={i} index={i} seat={s} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6">
        <button
          onClick={join}
          disabled={phase !== "idle" || game.balance < ENTRY_FEE}
          className="w-full h-16 rounded-2xl bg-brand-red text-white text-display font-black text-lg shadow-red disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          {phase === "idle" && game.balance >= ENTRY_FEE && `Join — ${formatNaira(ENTRY_FEE)}`}
          {phase === "idle" && game.balance < ENTRY_FEE && "Top up wallet to play"}
          {phase === "filling" && "Seats filling up…"}
          {phase === "revealing" && "Picking winners…"}
          {phase === "done" && "Round complete"}
        </button>
        <p className="text-[11px] text-center text-muted-foreground mt-3 px-6">
          Skill-based competition. 18+. Play responsibly.
        </p>
      </div>

      {showResult && (
        <ResultOverlay
          won={youWon}
          onClose={nextRound}
          onRejoin={rejoin}
        />
      )}
    </AppShell>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-white border border-border p-3">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-xl text-display mt-1">{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function SeatChip({ index, seat }: { index: number; seat: Seat }) {
  const base = "aspect-square rounded-2xl flex flex-col items-center justify-center text-[10px] font-bold transition-all duration-300";
  if (seat.state === "empty") {
    return (
      <div className={`${base} border-2 border-dashed border-border text-muted-foreground/60`}>
        {index + 1}
      </div>
    );
  }
  if (seat.state === "you") {
    return (
      <div className={`${base} bg-brand-red text-white animate-pop-in shadow-red animate-pulse-red`}>
        <span className="text-[10px] uppercase tracking-wider opacity-90">You</span>
        <span className="text-[10px] mt-0.5 opacity-80">#{index + 1}</span>
      </div>
    );
  }
  if (seat.state === "you-winner") {
    return (
      <div className={`${base} bg-brand-red text-white animate-pop-in shadow-red ring-4 ring-brand-red/30`}>
        <Trophy className="w-4 h-4" />
        <span className="text-[9px] mt-0.5">YOU WIN</span>
      </div>
    );
  }
  if (seat.state === "winner") {
    return (
      <div className={`${base} bg-accent text-brand-red animate-pop-in border-2 border-brand-red`}>
        <Trophy className="w-4 h-4" />
        <span className="text-[9px] mt-0.5 truncate w-full text-center px-1">{seat.name}</span>
      </div>
    );
  }
  // taken
  return (
    <div className={`${base} bg-secondary text-foreground/70 animate-pop-in`}>
      <span className="text-[10px] truncate w-full text-center px-1">{seat.name}</span>
      <span className="text-[9px] opacity-50 mt-0.5">#{index + 1}</span>
    </div>
  );
}

function ResultOverlay({ won, onClose, onRejoin }: { won: boolean; onClose: () => void; onRejoin: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-pop-in">
      {won && <Confetti />}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {won ? (
          <>
            <div className="w-24 h-24 rounded-full bg-brand-red flex items-center justify-center shadow-red mb-6 animate-pulse-red">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-red">You Won</div>
            <div className="text-display text-[64px] leading-none mt-3">
              {formatNaira(PRIZE)}
            </div>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              Credited to your wallet instantly. Withdraw anytime.
            </p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Round Closed</div>
            <div className="text-display text-[40px] leading-tight mt-3">
              Better luck<br />next round.
            </div>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs">
              3 winners every round. The next one starts now.
            </p>
          </>
        )}
      </div>
      <div className="p-5 space-y-3 mx-auto max-w-md w-full">
        <button
          onClick={onRejoin}
          className="w-full h-14 rounded-2xl bg-brand-red text-white text-display font-black shadow-red active:scale-[0.98] transition-transform"
        >
          {won ? `Play again — ${formatNaira(ENTRY_FEE)}` : `Rejoin instantly — ${formatNaira(ENTRY_FEE)}`}
        </button>
        <button
          onClick={onClose}
          className="w-full h-12 rounded-2xl border border-border text-sm font-bold"
        >
          Back to rounds
        </button>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2 + Math.random() * 1.5,
        red: i % 2 === 0,
        size: 6 + Math.random() * 8,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.red ? "var(--brand-red)" : "#111",
            animation: `confetti-fall ${p.dur}s ${p.delay}s linear forwards`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickName(used: string[]): string {
  const pool = BOT_NAMES.filter((n) => !used.includes(n));
  const base = pool.length ? pool[Math.floor(Math.random() * pool.length)] : "Player";
  return base;
}
