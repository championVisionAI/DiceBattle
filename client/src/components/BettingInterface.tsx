import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import useGameState from "../hooks/useGameState";
import { useBetting } from "../lib/stores/useBetting";

const BettingInterface = () => {
  const { betAmount, setBetAmount, placeBet, totalPoints } = useGameState();
  const [customBet, setCustomBet] = useState("");
  const { bettingHistory } = useBetting();
  
  // Preset bet amounts
  const presetBets = [10, 25, 50, 100];
  
  // Handle custom bet input
  const handleCustomBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    setCustomBet(value);
  };
  
  // Apply custom bet
  const applyCustomBet = () => {
    const bet = parseInt(customBet, 10);
    if (!isNaN(bet) && bet > 0 && bet <= totalPoints) {
      setBetAmount(bet);
      setCustomBet("");
    }
  };
  
  // Handle Enter key for custom bet
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyCustomBet();
    }
  };
  
  useEffect(() => {
    // Set a default bet if none is selected
    if (betAmount === 0 && totalPoints > 0) {
      // Set default bet to the lowest preset that's affordable
      for (const preset of presetBets) {
        if (preset <= totalPoints) {
          setBetAmount(preset);
          break;
        }
      }
      
      // If no presets are affordable, bet 1 point
      if (betAmount === 0 && totalPoints > 0) {
        setBetAmount(1);
      }
    }
  }, [betAmount, totalPoints, setBetAmount, presetBets]);
  
  return (
    <div className="betting-interface">
      <div className="betting-card">
        <h2 className="betting-title">Place Your Bet</h2>
        
        <div className="current-bet">
          <span>Your bet: </span>
          <span className="bet-amount">{betAmount}</span>
          <span> points</span>
        </div>
        
        <div className="preset-bets">
          {presetBets.map(bet => (
            <Button
              key={bet}
              onClick={() => bet <= totalPoints && setBetAmount(bet)}
              disabled={bet > totalPoints}
              variant={betAmount === bet ? "default" : "outline"}
              className="preset-bet-button"
            >
              {bet}
            </Button>
          ))}
        </div>
        
        <div className="custom-bet">
          <input
            type="text"
            placeholder="Custom bet"
            value={customBet}
            onChange={handleCustomBetChange}
            onKeyDown={handleKeyDown}
            className="custom-bet-input"
          />
          <Button
            onClick={applyCustomBet}
            disabled={
              !customBet || 
              isNaN(parseInt(customBet, 10)) || 
              parseInt(customBet, 10) <= 0 ||
              parseInt(customBet, 10) > totalPoints
            }
          >
            Apply
          </Button>
        </div>
        
        <div className="betting-controls">
          <Button 
            onClick={placeBet}
            disabled={betAmount <= 0 || betAmount > totalPoints}
            size="lg"
            className="place-bet-button"
          >
            Place Bet & Shake to Roll
          </Button>
        </div>
        
        {/* Display last few bets */}
        {bettingHistory.length > 0 && (
          <div className="betting-history">
            <h3>Recent Results</h3>
            <ul className="history-list">
              {bettingHistory.slice(0, 5).map((item, index) => (
                <li key={index} className={item.win ? "win" : "loss"}>
                  Bet: {item.amount}, Dice: {item.dice.join(" + ")}, 
                  {item.win ? ` Won ${item.payout}` : " Lost"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BettingInterface;
