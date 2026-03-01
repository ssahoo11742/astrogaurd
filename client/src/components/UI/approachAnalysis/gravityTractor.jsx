import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { scalarMultiply, norm, cross, addVec, keplerianToCartesian } from "./transform";
import { useState } from "react";
import { gravityTractor } from "./transform";
import { evaluateMitigation } from "./utils"; // Adjust path as needed
import { Tooltip } from "./utils";


export const GravityTractorSection = ({
  orbitalElements,
  applyNewElements,
  gtMass,
  setGtMass,
  gtDistance,
  setGtDistance,
  gtDuration,
  setGtDuration,
  gtDirection,
  setGtDirection,
  setGravityEvaluation,
  gravityEvaluation,
  closestApproachData
}) => {
  const [showCloseUp, setShowCloseUp] = useState(true);

  // Convert keplerian to cartesian for visualization
  const { r_vec, v_vec } = keplerianToCartesian(
    orbitalElements.a,
    orbitalElements.e,
    orbitalElements.i,
    orbitalElements.om,
    orbitalElements.w,
    orbitalElements.ma
  );

  // Spacecraft position based on direction and distance
  let scPos;
  const unitV = scalarMultiply(v_vec, 1 / norm(v_vec));
  const unitR = scalarMultiply(r_vec, 1 / norm(r_vec));
  const h_vec = cross(r_vec, v_vec);
  const unitH = scalarMultiply(h_vec, 1 / norm(h_vec));

  switch (gtDirection) {
    case "alongVelocity":
      scPos = addVec(r_vec, scalarMultiply(unitV, gtDistance));
      break;
    case "radial":
      scPos = addVec(r_vec, scalarMultiply(unitR, gtDistance));
      break;
    case "normal":
      scPos = addVec(r_vec, scalarMultiply(unitH, gtDistance));
      break;
    default:
      scPos = addVec(r_vec, scalarMultiply(unitV, gtDistance));
  }

  // Simple 2D orbit points for visualization
  const orbitPoints = [];
  for (let theta = 0; theta < 2 * Math.PI; theta += 0.05) {
    const a = orbitalElements.a;
    const e = orbitalElements.e;
    const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
    orbitPoints.push([r * Math.cos(theta), r * Math.sin(theta), 0]);
  }

  return (
    <div className="p-4 rounded-lg shadow-sm space-y-4 mt-4" style={{ background: "#1a1410", border: "1px solid rgba(255,69,0,0.2)" }}>
      <h4 className="font-semibold text-lg pb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: "0.08em", color: "#f0e6d3", borderBottom: "1px solid rgba(255,69,0,0.2)" }}>
        Gravity Tractor
      </h4>

      <div className="space-y-3">
        {/* Mass */}
<div className="flex flex-col">
  <label className="text-sm mb-1" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.7rem" }}>Spacecraft Mass (kg)</label>
  <Tooltip text="The mass of your spacecraft in kilograms. Higher mass increases gravitational pull on the asteroid.">
    <input
      type="number"
      className="w-full p-2 rounded focus:outline-none"
      style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", color: "#f0e6d3", fontFamily: "'DM Mono', monospace" }}
      value={gtMass}
      onChange={(e) => setGtMass(parseFloat(e.target.value) || 0)}
    />
  </Tooltip>
</div>

<div className="flex flex-col">
  <label className="text-sm mb-1" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.7rem" }}>Distance from Asteroid (km)</label>
  <Tooltip text="Distance from asteroid in kilometers. Closer distances increase gravitational effect but are riskier.">
    <input
      type="number"
      className="w-full p-2 rounded focus:outline-none"
      style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", color: "#f0e6d3", fontFamily: "'DM Mono', monospace" }}
      value={gtDistance}
      onChange={(e) => setGtDistance(parseFloat(e.target.value) || 1)}
    />
  </Tooltip>
</div>

<div className="flex flex-col">
  <label className="text-sm mb-1" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.7rem" }}>Duration (days)</label>
  <Tooltip text="Duration in days that the spacecraft applies its gravitational pull. Longer durations increase effect.">
    <input
      type="number"
      className="w-full p-2 rounded focus:outline-none"
      style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", color: "#f0e6d3", fontFamily: "'DM Mono', monospace" }}
      value={gtDuration}
      onChange={(e) => setGtDuration(parseFloat(e.target.value) || 1)}
    />
  </Tooltip>
</div>

<div className="flex flex-col">
  <label className="text-sm mb-1" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.7rem" }}>Direction</label>
  <Tooltip text="Direction relative to the asteroid's orbit. Along Velocity = along motion, Radial = toward/away from the Sun, Normal = perpendicular to orbit plane.">
    <select
      className="w-full p-2 rounded focus:outline-none"
      style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", color: "#f0e6d3", fontFamily: "'DM Mono', monospace" }}
      value={gtDirection}
      onChange={(e) => setGtDirection(e.target.value)}
    >
      <option value="alongVelocity">Along Velocity</option>
      <option value="radial">Radial</option>
      <option value="normal">Normal (perpendicular)</option>
    </select>
  </Tooltip>
</div>

  <button
    className="w-full rounded p-2 font-semibold shadow mt-2"
    style={{ background: "linear-gradient(135deg, #ff4500, #c0392b)", border: "none", color: "#f0e6d3", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.12em", cursor: "pointer", boxShadow: "0 0 24px rgba(255,69,0,0.3)" }}
    onClick={() => {
      const durationSec = gtDuration * 24 * 3600;
      const gravity = gravityTractor(
        orbitalElements,
        gtMass * 1e12,
        gtDistance,
        durationSec,
        86400,
        gtDirection
      );
      setGravityEvaluation(
        evaluateMitigation(
          closestApproachData.miss_distance.kilometers,
          closestApproachData.miss_distance.kilometers + gravity.deltaVmag * 1000
        )
      );
      applyNewElements(gravity.currentElements);
    }}
  >
    Apply Gravity Tractor
  </button>


        {/* Score Bar */}
        <div className="w-full mt-4 p-3 rounded" style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.15)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Score</span>
            <span className="text-sm font-bold" style={{ color: "#ffb347", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}>{gravityEvaluation?.score || 0} / 100</span>
          </div>
          
          <div className="relative w-full h-8 rounded-full overflow-hidden" style={{ background: "#3d3028", border: "1px solid rgba(255,69,0,0.2)" }}>
            <div 
              className="h-full rounded-full"
              style={{ width: `${gravityEvaluation?.score || 0}%`, background: "linear-gradient(90deg, #ff4500, #ffb347)", boxShadow: "0 0 12px rgba(255,69,0,0.4)", transition: "width 0.5s ease" }}
            />
          </div>
        </div>

        {/* 3D Scene */}
{showCloseUp && (
  <div className="w-full h-96 rounded-lg overflow-hidden mt-2" style={{ background: "#0d0a08", border: "1px solid rgba(255,69,0,0.15)" }}>
    <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <OrbitControls enablePan enableZoom enableRotate target={[0, 0, 0]} />

      {/* Simple circular orbit */}
      <Line
        points={Array.from({ length: 128 }, (_, i) => {
          const theta = (i / 128) * 2 * Math.PI;
          return new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
        })}
        color="#ff6a1a"
        lineWidth={2}
      />

      {(() => {
        const asteroidPos = new THREE.Vector3(1, 0, 0);

        // Default spacecraft position = asteroid position
        const scPos = asteroidPos.clone();

        switch (gtDirection) {
          case "alongVelocity":
            scPos.add(new THREE.Vector3(0.20, 0.5, 0)); // shift +Y
            break;
          case "radial":
            scPos.setLength(asteroidPos.length() - 0.5); // pull inward by 0.5
            break;
          case "normal":
            scPos.add(new THREE.Vector3(0, 0, 0.5)); // shift +Z
            break;
          default:
            break;
        }

        return (
          <>
            {/* Asteroid */}
            <Sphere args={[0.21, 32, 32]} position={asteroidPos.toArray()}>
              <meshStandardMaterial color="#c0392b" roughness={0.8} />
            </Sphere>

            {/* Spacecraft */}
            <Sphere args={[0.08, 16, 16]} position={scPos.toArray()}>
              <meshStandardMaterial color="#ffb347" emissive="#ff4500" emissiveIntensity={0.3} metalness={0.6} />
            </Sphere>
          </>
        );
      })()}
    </Canvas>
  </div>
)}


      </div>
    </div>
  );
};