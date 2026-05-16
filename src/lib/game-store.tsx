import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const ENTRY_FEE = 500;
export const PRIZE = 1000;
export const SEATS = 10;
export const WINNERS = 3;

export interface HistoryEntry {
  id: string;
  date: number;
  won: boolean;
  amount: number;
}

interface State {
  balance: number;
  roundsPlayed: number;
  roundsWon: number;
  roundsCompletedToday: number;
  history: HistoryEntry[];
}

interface Ctx extends State {
  addHistory: (e: HistoryEntry) => void;
  bumpStats: (won: boolean) => void;
  setBalance: (n: number) => void;
  topUp: (n: number) => void;
}

const KEY = "urgent2k-v1";
const initial: State = {
  balance: 5000,
  roundsPlayed: 0,
  roundsWon: 0,
  roundsCompletedToday: 142,
  history: [],
};

const GameCtx = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial, ...JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value: Ctx = {
    ...state,
    addHistory: (e) => setState((s) => ({ ...s, history: [e, ...s.history].slice(0, 50) })),
    bumpStats: (won) =>
      setState((s) => ({
        ...s,
        roundsPlayed: s.roundsPlayed + 1,
        roundsWon: s.roundsWon + (won ? 1 : 0),
        roundsCompletedToday: s.roundsCompletedToday + 1,
      })),
    setBalance: (n) => setState((s) => ({ ...s, balance: n })),
    topUp: (n) => setState((s) => ({ ...s, balance: s.balance + n })),
  };

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export function useGame() {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
}

export function formatNaira(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}