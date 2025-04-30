import { useState, useEffect, useCallback } from "react";

interface Acceleration {
  x: number;
  y: number;
  z: number;
}

const useDeviceMotion = (threshold = 8, cooldownPeriod = 300) => {
  const [acceleration, setAcceleration] = useState<Acceleration>({ x: 0, y: 0, z: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const [lastShake, setLastShake] = useState(0);
  const [shakeCount, setShakeCount] = useState(0);
  
  // Reset shake detection
  const resetShake = useCallback(() => {
    setIsShaking(false);
    setShakeCount(0);
  }, []);
  
  useEffect(() => {
    let timeoutId: number;
    
    // Handle device motion events
    const handleMotion = (event: DeviceMotionEvent) => {
      // Get acceleration data (including gravity)
      const accl = event.accelerationIncludingGravity;
      
      if (accl) {
        // Update acceleration state
        setAcceleration({
          x: accl.x || 0,
          y: accl.y || 0,
          z: accl.z || 0
        });
        
        // Calculate total acceleration magnitude
        const magnitude = Math.sqrt(
          Math.pow(accl.x || 0, 2) + 
          Math.pow(accl.y || 0, 2) + 
          Math.pow(accl.z || 0, 2)
        );
        
        // Check if acceleration exceeds threshold
        if (magnitude > threshold) {
          const now = Date.now();
          
          // Prevent multiple triggers in short time period
          if (now - lastShake > cooldownPeriod) {
            setLastShake(now);
            setShakeCount(prev => prev + 1);
            
            // After a few shakes, consider the device to be shaking
            if (shakeCount >= 2 && !isShaking) {
              setIsShaking(true);
              console.log("Shake detected!");
            }
          }
        }
      }
    };
    
    // Handle when shaking stops
    const checkShakeEnd = () => {
      // If no significant motion detected for a while, consider shaking stopped
      if (isShaking) {
        timeoutId = window.setTimeout(() => {
          console.log("Shake ended, dice settling");
        }, 1000);
      }
    };
    
    // Add event listeners
    window.addEventListener("devicemotion", handleMotion);
    
    // Check for end of shaking
    checkShakeEnd();
    
    // Cleanup
    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      clearTimeout(timeoutId);
    };
  }, [isShaking, lastShake, shakeCount, threshold, cooldownPeriod]);
  
  return { acceleration, isShaking, resetShake };
};

export default useDeviceMotion;
