import { useCallback, useState } from "react";
import { useBetting } from "../lib/stores/useBetting";

export type GamePhase = "betting" | "rolling" | "result";

interface ScoreData {
  diceValues: number[];
  totalValue: number;
  result: "win" | "loss";
  payout: number;
}

const useGameState = () => {
  const [gamePhase, setGamePhase] = useState<GamePhase>("betting");
  const [betAmount, setBetAmount] = useState(0);
  const [currentScore, setCurrentScore] = useState<ScoreData>({
    diceValues: [],
    totalValue: 0,
    result: "loss",
    payout: 0
  });
  
  const { 
    totalPoints, 
    addPoints, 
    subtractPoints,
    addBettingHistory 
  } = useBetting();
  
  // Place bet and move to rolling phase
  const placeBet = useCallback(() => {
    if (betAmount <= 0 || betAmount > totalPoints) {
      return; // Invalid bet
    }
    
    // Deduct bet amount from total points
    subtractPoints(betAmount);
    console.log(`Bet placed: ${betAmount}`);
    
    // Ready to roll
    setGamePhase("rolling");
  }, [betAmount, totalPoints, subtractPoints]);
  
  // Handle dice roll result
  const handleDiceResult = useCallback((diceValues: number[]) => {
    const totalValue = diceValues.reduce((a, b) => a + b, 0);
    
    let result: "win" | "loss" = "loss";
    let payout = 0;
    
    // Determine win/loss and payout
    // Win conditions:
    // - If sum is 7 or 11 on first roll (natural win)
    // - If dice show doubles (both dice same value)
    // - If sum is 12 (special jackpot)
    
    const isDoubles = diceValues[0] === diceValues[1];
    
    if (totalValue === 7 || totalValue === 11) {
      result = "win";
      payout = betAmount * 2; // 2x payout for 7 or 11
    } else if (isDoubles) {
      result = "win";
      payout = betAmount * 3; // 3x for doubles
    } else if (totalValue === 12) {
      result = "win";
      payout = betAmount * 4; // 4x jackpot for 12
    }
    
    // Update score data
    const scoreData: ScoreData = {
      diceValues,
      totalValue,
      result,
      payout
    };
    
    setCurrentScore(scoreData);
    
    // Add points if player won
    if (result === "win") {
      addPoints(payout);
    }
    
    // Add to betting history
    addBettingHistory({
      amount: betAmount,
      dice: diceValues,
      win: result === "win",
      payout: payout
    });
    
    return scoreData;
  }, [betAmount, addPoints, addBettingHistory]);
  
  // Reset game for a new round
  const resetGame = useCallback(() => {
    setGamePhase("betting");
    setCurrentScore({
      diceValues: [],
      totalValue: 0,
      result: "loss",
      payout: 0
    });
  }, []);
  
  return {
    gamePhase,
    setPhase: setGamePhase,
    betAmount,
    setBetAmount,
    currentScore,
    placeBet,
    handleDiceResult,
    resetGame,
    totalPoints
  };
};

export default useGameState;
