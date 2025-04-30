import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import useGameState from "../hooks/useGameState";
import { useAudio } from "../lib/stores/useAudio";

interface ScoreDisplayProps {
  score: {
    diceValues: number[];
    totalValue: number;
    result: "win" | "loss";
    payout: number;
  };
}

const ScoreDisplay = ({ score }: ScoreDisplayProps) => {
  const { resetGame } = useGameState();
  const { playSuccess } = useAudio();
  const [showContinue, setShowContinue] = useState(false);
  
  useEffect(() => {
    // Play success sound if player wins
    if (score.result === "win") {
      playSuccess();
    }
    
    // Show the continue button after a delay
    const timer = setTimeout(() => {
      setShowContinue(true);
    }, 1500);
    
    return () => {
      clearTimeout(timer);
    };
  }, [score, playSuccess]);
  
  return (
    <AnimatePresence>
      <motion.div 
        className="score-display"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className={`result-card ${score.result}`}>
          <h2 className="result-title">
            {score.result === "win" ? "You Won!" : "You Lost"}
          </h2>
          
          <div className="dice-values">
            <div className="dice-row">
              {score.diceValues.map((value, index) => (
                <motion.div 
                  key={index} 
                  className="dice-value"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2, type: "spring" }}
                >
                  {value}
                </motion.div>
              ))}
            </div>
            <div className="dice-total">
              Total: {score.totalValue}
            </div>
          </div>
          
          {score.result === "win" ? (
            <motion.div 
              className="payout"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <span className="payout-label">Payout:</span>
              <span className="payout-amount">+{score.payout}</span>
            </motion.div>
          ) : (
            <motion.div 
              className="better-luck"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Better luck next time!
            </motion.div>
          )}
          
          {showContinue && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="continue-container"
            >
              <Button 
                onClick={resetGame}
                size="lg"
                className="continue-button"
              >
                Place New Bet
              </Button>
              <p className="shake-hint">
                Shake your device to roll the dice!
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ScoreDisplay;
