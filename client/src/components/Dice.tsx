import { forwardRef, useMemo, useRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { useBox } from "@react-three/cannon";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Creating a simple dice mesh since we don't have a provided model
const DiceModel = forwardRef(({ position = [0, 0, 0] }, ref) => {
  // Use a wood texture for the dice
  const texture = useTexture("/textures/wood.jpg");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(0.5, 0.5);
  
  // Physics box for the dice
  const [physicsRef, api] = useBox(() => ({
    mass: 1,
    position: position,
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    args: [1, 1, 1], // Size of the dice
    allowSleep: true,
    sleepSpeedLimit: 0.1,
    sleepTimeLimit: 1,
    material: { 
      friction: 0.3,
      restitution: 0.4
    }
  }));
  
  // Group to track for scoring
  const groupRef = useRef<THREE.Group>(null);
  
  // Sync the physics object with the visual representation
  useFrame(() => {
    if (physicsRef.current && groupRef.current) {
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      
      // Get current physics position and rotation
      physicsRef.current.getWorldPosition(position);
      physicsRef.current.getWorldQuaternion(quaternion);
      
      // Apply to the group
      groupRef.current.position.copy(position);
      groupRef.current.quaternion.copy(quaternion);
    }
  });
  
  // Create dice pips (dots on the sides)
  const createPip = (posX: number, posY: number, posZ: number) => {
    return (
      <mesh position={[posX, posY, posZ]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.04, 16]} />
        <meshStandardMaterial color="black" />
      </mesh>
    );
  };
  
  // Create dice faces with different pip patterns
  const pipPositions = {
    // Face 1 (1 pip in center)
    1: [[0, 0, 0.5]],
    // Face 2 (2 pips diagonally opposite)
    2: [[-0.3, 0.3, 0.5], [0.3, -0.3, 0.5]],
    // Face 3 (3 pips in diagonal)
    3: [[-0.3, 0.3, 0.5], [0, 0, 0.5], [0.3, -0.3, 0.5]],
    // Face 4 (4 pips in corners)
    4: [[-0.3, 0.3, 0.5], [-0.3, -0.3, 0.5], [0.3, 0.3, 0.5], [0.3, -0.3, 0.5]],
    // Face 5 (4 corners plus center)
    5: [[-0.3, 0.3, 0.5], [-0.3, -0.3, 0.5], [0, 0, 0.5], [0.3, 0.3, 0.5], [0.3, -0.3, 0.5]],
    // Face 6 (6 pips, 2 rows of 3)
    6: [[-0.3, 0.3, 0.5], [-0.3, 0, 0.5], [-0.3, -0.3, 0.5], [0.3, 0.3, 0.5], [0.3, 0, 0.5], [0.3, -0.3, 0.5]]
  };
  
  // Store api in userData for external access
  useMemo(() => {
    if (groupRef.current) {
      groupRef.current.userData.api = api;
      
      // Add faces data for scoring calculation
      groupRef.current.userData.faces = [
        new THREE.Vector3(0, 0, 1),  // Front face (1)
        new THREE.Vector3(1, 0, 0),  // Right face (2)
        new THREE.Vector3(0, 0, -1), // Back face (3)
        new THREE.Vector3(-1, 0, 0), // Left face (4)
        new THREE.Vector3(0, 1, 0),  // Top face (5)
        new THREE.Vector3(0, -1, 0)  // Bottom face (6)
      ];
    }
  }, [api]);
  
  return (
    <group ref={ref as any}>
      <group ref={groupRef}>
        {/* Physics collider */}
        <mesh ref={physicsRef} visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        
        {/* Visual representation of the dice */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            map={texture} 
            roughness={0.3} 
            metalness={0.2}
          />
        </mesh>
        
        {/* Face 1 (opposite to face 6) */}
        <group rotation={[0, 0, 0]}>
          {pipPositions[1].map((pos, i) => createPip(pos[0], pos[1], pos[2]))}
        </group>
        
        {/* Face 2 (opposite to face 5) */}
        <group rotation={[0, Math.PI/2, 0]}>
          {pipPositions[2].map((pos, i) => createPip(pos[0], pos[1], pos[2]))}
        </group>
        
        {/* Face 3 (opposite to face 4) */}
        <group rotation={[Math.PI, 0, 0]}>
          {pipPositions[3].map((pos, i) => createPip(pos[0], pos[1], pos[2]))}
        </group>
        
        {/* Face 4 */}
        <group rotation={[0, -Math.PI/2, 0]}>
          {pipPositions[4].map((pos, i) => createPip(pos[0], pos[1], pos[2]))}
        </group>
        
        {/* Face 5 */}
        <group rotation={[Math.PI/2, 0, 0]}>
          {pipPositions[5].map((pos, i) => createPip(pos[0], pos[1], pos[2]))}
        </group>
        
        {/* Face 6 */}
        <group rotation={[-Math.PI/2, 0, 0]}>
          {pipPositions[6].map((pos, i) => createPip(pos[0], pos[1], pos[2]))}
        </group>
      </group>
    </group>
  );
});

export default DiceModel;
