import { useEffect, useMemo } from "react";
import * as THREE from "three";


const KM = 149.6;

// Function to compute the perihelion time
export const perihelionTime = (M1, P) => {
  // Mean motion n
  const n = 360 / P;
  
  // Solve for the time of perihelion (when M(d) = 0)
  const d_perihelion = -M1 / n;
  
  return d_perihelion;
};


// Generates vectors that will be used to generate a curve to describe a body's orbit
export const orbitalVectors = (obj, d, t) => {
  var vectors = [];
  const P = obj.P(d + t);    // Get orbital period for current time
  const part = P / 50;       // Divide period into 50 parts
  var curd = d + t;
  
  // Calculate perihelion time relative to epoch
  const perd = perihelionTime(obj.M1, obj.P(100));

  let perihelionAdded = false; // Flag to track when the perihelion vector is added
  
  // Loop through and generate vectors
  for (let i = 0; i < 51; i++) {
    const nextcurd = (d + t) - (i * part);  // The current date for this iteration

    // Add perihelion coordinate if it falls between the previous and next date
    if (!perihelionAdded && nextcurd < perd && curd >= perd) {
      // Get perihelion coordinates
      const {xeclip, yeclip, zeclip  } = obj.coordinates(perd);
      const x = xeclip * KM;
      const y = yeclip * KM;
      const z = zeclip * KM;
  
      vectors.push(new THREE.Vector3(x, y, z)); 

      perihelionAdded = true;  // Set flag to true
    }

    // Continue with normal vector generation
    const { xeclip, yeclip, zeclip } = obj.coordinates(nextcurd);
    const x = xeclip * KM;
    const y = yeclip * KM;
    const z = zeclip * KM;
    
    vectors.push(new THREE.Vector3(x, y, z)); // Add the current vector

    curd = nextcurd; // Update curd for next iteration
  }


  if (!perihelionAdded && obj.mesh !== "Earth.jpg") {
    const { xeclip, yeclip, zeclip } = obj.coordinates(perd);
    const x = xeclip * KM;
    const y = yeclip * KM;
    const z = zeclip * KM;
    vectors.push(new THREE.Vector3(x, y, z));
  }

  return vectors;
};


// Returns properties needed to create orbital line (geometry and mesh)
export const orbitalLineProperties = (vectors, color) => {
    // 3d vectors used to create a CatmullRom curve
    const curve = new THREE.CatmullRomCurve3(vectors);
    const points = curve.getSpacedPoints(100);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const fadeRate = 2;
    // Create a buffer attribute for the alpha values (Fading effect)
    const alphas = new Float32Array(points.length);
    for (let i = 0; i < points.length; i++) {
      alphas[i] = Math.pow(i / (points.length - 1), fadeRate) // This will create a gradient from 0 to 1
    }
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  
    // Create the custom shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) }
      },
      vertexShader: `
        attribute float alpha;
        varying float vAlpha;
        void main() {
          vAlpha = alpha;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        varying float vAlpha;
        void main() {
          gl_FragColor = vec4(color, vAlpha);
        }
      `,
      transparent: true
  });
  return {geometry, material};

}
export const OrbitalCurve = ({ obj, color, d, t }) => {;

  const { geometry, material } = useMemo(() => {
      // Generate the orbital vectors
      const vectors = orbitalVectors(obj, d, t.current).reverse();

      // Get the geometry and material using the vectors and color
      return orbitalLineProperties(vectors, color);
  }, [obj, color, d, t]);

  useEffect(() => {
    return () => {
      geometry.dispose(); // Dispose of geometry
      material.dispose(); // Dispose of material
    };
  }, [geometry, material]);

  return (
      <line geometry={geometry} material={material} />
  );
};