import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BettingHistoryItem {
  amount: number;
  dice: number[];
  win: boolean;
  payout: number;
}

interface BettingState {
  totalPoints: number;
  bettingHistory: BettingHistoryItem[];
  
  // Actions
  addPoints: (amount: number) => void;
  subtractPoints: (amount: number) => void;
  resetPoints: () => void;
  addBettingHistory: (item: BettingHistoryItem) => void;
  clearHistory: () => void;
}

// Initial points for new players
const INITIAL_POINTS = 1000;

export const useBetting = create<BettingState>()(
  persist(
    (set) => ({
      totalPoints: INITIAL_POINTS,
      bettingHistory: [],
      
      addPoints: (amount) => 
        set((state) => ({ totalPoints: state.totalPoints + amount })),
        
      subtractPoints: (amount) => 
        set((state) => ({ totalPoints: state.totalPoints - amount })),
        
      resetPoints: () => 
        set({ totalPoints: INITIAL_POINTS }),
        
      addBettingHistory: (item) => 
        set((state) => ({ 
          bettingHistory: [item, ...state.bettingHistory].slice(0, 20) // Keep last 20 bets
        })),
        
      clearHistory: () => 
        set({ bettingHistory: [] })
    }),
    {
      name: "dice-betting-storage",
      partialize: (state) => ({ 
        totalPoints: state.totalPoints,
        bettingHistory: state.bettingHistory
      })
    }
  )
);
