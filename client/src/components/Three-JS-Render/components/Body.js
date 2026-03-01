import { useMemo, forwardRef, useEffect } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from 'three'
import { OrbitalCurve } from "../utils/orbitalCurves";

const KM = 149.6;

//  Draws body at given heliocentric ecliptic rectangular coords with a given mesh
export const Body = forwardRef(({ obj, d, t, mesh, radius }, ref) => {
    const texture = useLoader(THREE.TextureLoader, mesh);
    const KM = 149.6;
  
    useEffect(() => {
      return () => {
        texture.dispose(); // Dispose texture on unmount
      };
    }, [texture]);
  
    // Use useMemo to compute the position based on t.current
    const position = useMemo(() => {
      const { xeclip, yeclip, zeclip } = obj.coordinates(d + t.current);
      const x = xeclip * KM;
      const y = yeclip * KM;
      const z = zeclip * KM;
      return [x, y, z];
    }, [obj, d, t]);
  
  
    if(mesh !== "asteroid.jpg"){
      return (
        <mesh position={position} ref={ref}> 
        <sphereGeometry args={[radius, 32, 16]} />
        <meshBasicMaterial attach="material" map={texture} />
      </mesh>
      );
    }else{
      return (
        <mesh position={position} ref={ref}> 
        <sphereGeometry args={[0.0000001, 32, 16]} />
        <meshBasicMaterial attach="material" map={texture} />
      </mesh>
      );
    }
  });

// Initializes Bodies
export const initBodies = (celestials,d,t,bodies,orbitalCurves) =>{
    Object.entries(celestials).forEach(([name, obj]) => {
      const { xeclip, yeclip, zeclip } = obj.coordinates(d);
      const x = xeclip * KM;
      const y = yeclip * KM;
      const z = zeclip * KM;
  
      const body = <Body obj={obj} d={d} t={t} mesh={obj.mesh} radius={obj.radius} />;
      const orbitalCurve = <OrbitalCurve key={`curve-${name}`} obj={obj} color={obj.color} d={d} t={t} />;
  
      bodies[name] = body;
      orbitalCurves.push(orbitalCurve);
  });
  }