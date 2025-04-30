import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Loader } from "@react-three/drei";
import DiceGame from "./components/DiceGame";
import { useAudio } from "./lib/stores/useAudio";
import BettingInterface from "./components/BettingInterface";
import ScoreDisplay from "./components/ScoreDisplay";
import useGameState from "./hooks/useGameState";
import "@fontsource/inter";
import "./index.css";

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const { gamePhase, currentScore, totalPoints } = useGameState();
  const { setBackgroundMusic, toggleMute, isMuted } = useAudio();

  // Request permission for device motion
  const requestPermission = async () => {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        // iOS 13+ requires permission
        const permission = await (DeviceMotionEvent as any).requestPermission();
        setHasPermission(permission === 'granted');
      } else {
        // For non-iOS 13+, permission is implicitly granted
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error requesting device motion permission:', error);
      setHasPermission(false);
    }
  };

  // Load audio assets
  useEffect(() => {
    // Background music
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    setBackgroundMusic(bgMusic);

    // Hit sound for dice impact
    const hitSound = new Audio('/sounds/hit.mp3');
    hitSound.volume = 0.5;
    
    // Success sound for scoring
    const successSound = new Audio('/sounds/success.mp3');
    successSound.volume = 0.6;
    
    const loadAudio = async () => {
      try {
        await bgMusic.load();
        await hitSound.load();
        await successSound.load();
        
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load audio assets:", error);
        // Continue even if audio fails to load
        setIsLoaded(true);
      }
    };
    
    loadAudio();
    
    return () => {
      bgMusic.pause();
      hitSound.pause();
      successSound.pause();
    };
  }, [setBackgroundMusic]);

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <h1>Loading Game...</h1>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="permission-screen">
        <div className="card">
          <h1>3D Dice Betting Game</h1>
          <p>Shake your phone to roll the dice and win points!</p>
          <button 
            className="permission-button"
            onClick={requestPermission}
          >
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="permission-denied">
        <div className="card">
          <h1>Permission Required</h1>
          <p>This game needs device motion permission to detect shaking.</p>
          <p>Please enable motion sensors in your device settings and refresh the page.</p>
          <button 
            className="retry-button"
            onClick={requestPermission}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 50, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#222222"]} />
        <Suspense fallback={null}>
          <DiceGame />
        </Suspense>
      </Canvas>
      
      {/* UI Overlays */}
      <div className="ui-container">
        <div className="top-bar">
          <button 
            className="mute-button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? "🔇" : "🔊"}
          </button>
          <div className="points-display">
            <span>Total Points: {totalPoints}</span>
          </div>
        </div>
        
        {gamePhase === "betting" && <BettingInterface />}
        {gamePhase === "result" && <ScoreDisplay score={currentScore} />}
      </div>
      
      <Loader />
    </div>
  );
}

export default App;
