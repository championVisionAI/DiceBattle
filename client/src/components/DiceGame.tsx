import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Physics, usePlane } from "@react-three/cannon";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import Dice from "./Dice";
import useDeviceMotion from "../hooks/useDeviceMotion";
import useDicePhysics from "../hooks/useDicePhysics";
import useGameState from "../hooks/useGameState";
import { useAudio } from "../lib/stores/useAudio";

// Floor component using physics
const Floor = () => {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, -0.5, 0],
    type: "static"
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        color="#444444" 
        roughness={0.7}
        metalness={0.1}
      />
    </mesh>
  );
};

// Walls to keep dice from falling off
const Walls = () => {
  const wallThickness = 0.5;
  const wallHeight = 4; // Higher walls to prevent dice from jumping out
  const arenaSize = 8; // Smaller arena to keep dice more contained
  
  const [floor] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, -0.5, 0],
    type: "Static",
    material: { friction: 0.3, restitution: 0.1 } // Less bouncy floor
  }));
  
  const [wallLeft] = usePlane(() => ({ 
    rotation: [0, Math.PI / 2, 0], 
    position: [-arenaSize/2, wallHeight/2, 0],
    type: "Static",
    material: { friction: 0.3, restitution: 0.4 }
  }));
  
  const [wallRight] = usePlane(() => ({ 
    rotation: [0, -Math.PI / 2, 0], 
    position: [arenaSize/2, wallHeight/2, 0],
    type: "Static",
    material: { friction: 0.3, restitution: 0.4 }
  }));
  
  const [wallBack] = usePlane(() => ({ 
    rotation: [0, 0, 0], 
    position: [0, wallHeight/2, -arenaSize/2],
    type: "Static",
    material: { friction: 0.3, restitution: 0.4 }
  }));
  
  const [wallFront] = usePlane(() => ({ 
    rotation: [0, Math.PI, 0], 
    position: [0, wallHeight/2, arenaSize/2],
    type: "Static",
    material: { friction: 0.3, restitution: 0.4 }
  }));
  
  // Add a ceiling to prevent extreme bounces
  const [ceiling] = usePlane(() => ({ 
    rotation: [Math.PI / 2, 0, 0], 
    position: [0, wallHeight, 0],
    type: "Static",
    material: { friction: 0.3, restitution: 0.1 }
  }));
  
  return (
    <>
      <mesh ref={floor} receiveShadow visible={false}>
        <planeGeometry args={[arenaSize, arenaSize]} />
        <meshStandardMaterial opacity={0} transparent />
      </mesh>
      
      <mesh ref={wallLeft} receiveShadow visible={false}>
        <planeGeometry args={[arenaSize, wallHeight]} />
        <meshStandardMaterial opacity={0} transparent />
      </mesh>
      
      <mesh ref={wallRight} receiveShadow visible={false}>
        <planeGeometry args={[arenaSize, wallHeight]} />
        <meshStandardMaterial opacity={0} transparent />
      </mesh>
      
      <mesh ref={wallBack} receiveShadow visible={false}>
        <planeGeometry args={[arenaSize, wallHeight]} />
        <meshStandardMaterial opacity={0} transparent />
      </mesh>
      
      <mesh ref={wallFront} receiveShadow visible={false}>
        <planeGeometry args={[arenaSize, wallHeight]} />
        <meshStandardMaterial opacity={0} transparent />
      </mesh>
      
      <mesh ref={ceiling} receiveShadow visible={false}>
        <planeGeometry args={[arenaSize, arenaSize]} />
        <meshStandardMaterial opacity={0} transparent />
      </mesh>
    </>
  );
};

const DiceGame = () => {
  const { playHit } = useAudio();
  const { gamePhase, setPhase, handleDiceResult, betAmount } = useGameState();
  const { camera } = useThree();
  const [numDice] = useState(2); // Always use 2 dice
  const diceRefs = useRef<THREE.Group[]>([]);
  
  // Get device motion data (acceleration)
  const { acceleration, isShaking, resetShake } = useDeviceMotion();
  
  // Get dice physics functions
  const { applyForceToDice, checkIfDiceStopped, getDiceValues } = useDicePhysics();
  
  // Handle device motion to apply forces to dice
  useEffect(() => {
    if (gamePhase === "rolling" && isShaking) {
      // Apply force to dice based on device acceleration
      diceRefs.current.forEach(dice => {
        applyForceToDice(
          dice, 
          acceleration.x * 0.5,
          Math.abs(acceleration.y) * 0.3,
          acceleration.z * 0.5
        );
      });
      
      // Play hit sound when force is applied
      if (Math.abs(acceleration.x) > 5 || Math.abs(acceleration.y) > 5 || Math.abs(acceleration.z) > 5) {
        playHit();
      }
    }
  }, [acceleration, gamePhase, isShaking, applyForceToDice, playHit]);
  
  // Check if dice have stopped rolling
  useFrame(() => {
    if (gamePhase === "rolling") {
      const allStopped = checkIfDiceStopped(diceRefs.current);
      
      if (allStopped && !isShaking) {
        // Get dice values and calculate score
        const diceValues = getDiceValues(diceRefs.current);
        handleDiceResult(diceValues);
        
        console.log("Dice stopped rolling. Values:", diceValues);
        setPhase("result");
      }
    }
  });
  
  // Reset dice positions when new bet is placed
  useEffect(() => {
    if (gamePhase === "betting") {
      diceRefs.current.forEach((dice, i) => {
        if (dice) {
          // Reset position and rotation
          dice.position.set(i - 0.5, 3 + i * 0.5, 0);
          dice.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          );
          
          // Reset velocity if using physics
          if (dice.userData.api) {
            dice.userData.api.velocity.set(0, 0, 0);
            dice.userData.api.angularVelocity.set(0, 0, 0);
          }
        }
      });
    }
  }, [gamePhase, betAmount]);
  
  // Start rolling when shake is detected in betting phase
  useEffect(() => {
    if (gamePhase === "betting" && isShaking && betAmount > 0) {
      setPhase("rolling");
      console.log("Shake detected, rolling dice!");
    }
    
    // Reset shake detection after rolling phase
    if (gamePhase === "result") {
      resetShake();
    }
  }, [isShaking, gamePhase, betAmount, setPhase, resetShake]);
  
  // Set camera position
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 5, 10);
      camera.lookAt(0, 0, 0);
    }
  }, [camera]);
  
  return (
    <>
      {/* Scene lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight 
        position={[-10, 5, -5]} 
        intensity={0.5} 
        castShadow={false} 
      />
      
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 5, 10]} />
      
      {/* Environment and physics */}
      <Environment preset="city" />
      <Physics 
        gravity={[0, -9.81, 0]} 
        defaultContactMaterial={{ restitution: 0.3 }}
      >
        <Floor />
        <Walls />
        
        {/* Dice */}
        {Array.from({ length: numDice }).map((_, i) => (
          <Dice 
            key={i} 
            position={[i - 0.5, 3 + i * 0.5, 0]} 
            ref={(el) => el && (diceRefs.current[i] = el)}
          />
        ))}
      </Physics>
    </>
  );
};

export default DiceGame;
