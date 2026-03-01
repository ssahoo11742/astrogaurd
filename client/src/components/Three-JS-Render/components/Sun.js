import { useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from 'three';

// Create Sun
export const Sun = () => {
    const sunTexture = useLoader(THREE.TextureLoader, "sun.jpg")
  
    useEffect(() => {
      return () => {
        sunTexture.dispose(); // Dispose of texture on unmount
      };
    }, [sunTexture]);
    return(
        <mesh position={[0,0,0]}>
            <sphereGeometry args={[2,32,32]}/>
            <meshBasicMaterial attach="material" map={sunTexture}  />
        </mesh>
    )
  }
  