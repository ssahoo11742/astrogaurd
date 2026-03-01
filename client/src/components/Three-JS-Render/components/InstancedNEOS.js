
import { useEffect, useRef } from "react";
import * as THREE from 'three';
import { useFrame } from "@react-three/fiber";

const KM = 149.6;


// Instance Mesh Asteroids
export const InstancedNEOS = ({asteroidCount, d, t, data, pha=false, comet=false, size}) => {
  const meshRef = useRef();
  let color;
  let opacity;
  let radius;
  if(pha){
    color = "#fc0352";
    opacity = 1;
    radius = size * 1.5;
  }else if(comet){
    color = "#ffffff";
    opacity = 0.8;
    radius = size*3;
  }else{
    color = "#144be3";
    opacity = 0.8;
    radius = size * 1.35;
  }
  const AsteroidGeometry = new THREE.SphereGeometry(radius, 32, 32); // Radius of 1

  const AsteroidMaterial = new THREE.MeshBasicMaterial({ 
    color: color, 
    transparent: true,
    opacity: opacity
  });

  useEffect(() => {
    return () => {
      AsteroidGeometry.dispose(); // Dispose on unmount
      AsteroidMaterial.dispose();
    };
  }, [AsteroidGeometry, AsteroidMaterial]);


  useFrame(() => {
      const mesh = meshRef.current;
      if (!mesh) return;
      
      const instanceMatrix = mesh.instanceMatrix;
      for (let i = 0; i < asteroidCount; i++) {
          const matrix = new THREE.Matrix4();
          const {xeclip, yeclip, zeclip} = data[i].coordinates(d + t.current);
          const x = xeclip * KM;
          const y = yeclip * KM;
          const z = zeclip * KM;
          matrix.setPosition(x, y, z);
          mesh.setMatrixAt(i, matrix);
      }

      instanceMatrix.needsUpdate = true;
  });

  return (
      <instancedMesh ref={meshRef} args={[AsteroidGeometry, AsteroidMaterial, asteroidCount]} />
  );
};