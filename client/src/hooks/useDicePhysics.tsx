import { useCallback } from "react";
import * as THREE from "three";

const useDicePhysics = () => {
  // Apply force to dice
  const applyForceToDice = useCallback((dice: THREE.Group, forceX: number, forceY: number, forceZ: number) => {
    if (dice?.userData?.api) {
      // Apply linear force
      dice.userData.api.applyImpulse([forceX, forceY, forceZ], [0, 0, 0]);
      
      // Apply angular force (torque)
      dice.userData.api.applyTorque([
        forceZ * 0.1, 
        forceY * 0.1, 
        forceX * 0.1
      ]);
    }
  }, []);
  
  // Check if dice have stopped moving
  const checkIfDiceStopped = useCallback((diceArr: THREE.Group[]) => {
    let allStopped = true;
    
    diceArr.forEach(dice => {
      if (dice?.userData?.api) {
        // Get current linear and angular velocities
        const linearVel = new THREE.Vector3();
        const angularVel = new THREE.Vector3();
        
        // Copy velocities to our vectors (this is opposite direction from our current code)
        linearVel.copy(dice.userData.api.velocity);
        angularVel.copy(dice.userData.api.angularVelocity);
        
        // Check if the dice is still moving significantly - using lower threshold for better detection
        const isMoving = 
          linearVel.length() > 0.05 || 
          angularVel.length() > 0.05;
        
        if (isMoving) {
          allStopped = false;
        }
      }
    });
    
    return allStopped;
  }, []);
  
  // Get the values showing on top of each dice
  const getDiceValues = useCallback((diceArr: THREE.Group[]) => {
    const diceValues: number[] = [];
    
    diceArr.forEach(dice => {
      if (dice) {
        // Get the current rotation of the dice
        const rotation = new THREE.Quaternion();
        dice.getWorldQuaternion(rotation);
        
        // Define face vectors (stored in userData)
        const faces = dice.userData.faces || [
          new THREE.Vector3(0, 0, 1),  // Front (1)
          new THREE.Vector3(1, 0, 0),  // Right (2)
          new THREE.Vector3(0, 0, -1), // Back (3)
          new THREE.Vector3(-1, 0, 0), // Left (4)
          new THREE.Vector3(0, 1, 0),  // Top (5)
          new THREE.Vector3(0, -1, 0)  // Bottom (6)
        ];
        
        // Define up vector (the face pointing up is the one we want)
        const upVector = new THREE.Vector3(0, 1, 0);
        
        // Transform up vector by inverse of dice rotation to get local up direction
        const inversedRotation = rotation.clone().invert();
        const localUp = upVector.clone().applyQuaternion(inversedRotation);
        
        // Find the face most aligned with the up vector
        let maxDot = -Infinity;
        let faceValue = 1;
        
        faces.forEach((faceNormal: THREE.Vector3, index: number) => {
          const dot = faceNormal.dot(localUp);
          if (dot > maxDot) {
            maxDot = dot;
            faceValue = index + 1;
          }
        });
        
        // The opposite face is the one facing up (dice convention)
        // 1 is opposite to 6, 2 to 5, 3 to 4
        const oppositeValue = 7 - faceValue;
        
        // Add extra logging to debug dice values
        console.log(`Dice ${diceArr.indexOf(dice)}: Face up = ${faceValue}, Value = ${oppositeValue}, Dot product = ${maxDot.toFixed(2)}`);
        
        diceValues.push(oppositeValue);
      }
    });
    
    return diceValues;
  }, []);
  
  return {
    applyForceToDice,
    checkIfDiceStopped,
    getDiceValues
  };
};

export default useDicePhysics;
