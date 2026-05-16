import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SeatStatus = "empty" | "taken" | "you" | "winner" | "you-winner";

export interface Seat {
  id: number;
  status: SeatStatus;
  label?: string;
}

export interface HistoryEntry {
  id: string;
  date: number;
  won: boolean;
  amount: number; // net (+/-)
}

interface GameState {
  balance: number;
  roundsPlayed: number;
  roundsWon: number;
  roundsCompletedToday: number;
  history: HistoryEntry[];
  addHistory: (entry: HistoryEntry) => void;
  setBalance: (n: number) => void;
  bumpStats: (won: boolean) => void;
  topUp: (n: number) => void;
}

export const ENTRY_FEE = 500;
export const PRIZE = 1000;
export const SEATS = 10;
export const WINNERS = 3;

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      balance: 5000,
      roundsPlayed: 0,
      roundsWon: 0,
      roundsCompletedToday: 142,
      history: [],
      addHistory: (entry) =>
        set((s) => ({ history: [entry, ...s.history].slice(0, 50) })),
      setBalance: (n) => set({ balance: n }),
      bumpStats: (won) =>
        set((s) => ({
          roundsPlayed: s.roundsPlayed + 1,
          roundsWon: s.roundsWon + (won ? 1 : 0),
          roundsCompletedToday: s.roundsCompletedToday + 1,
        })),
      topUp: (n) => set((s) => ({ balance: s.balance + n })),
    }),
    { name: "urgent2k-store" }
  )
);