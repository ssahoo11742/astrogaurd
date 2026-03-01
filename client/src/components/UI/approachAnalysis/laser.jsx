import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useState } from "react";
import { laserAblation } from "./transform";
import { evaluateMitigation } from "./utils";
import { Tooltip } from "./utils";
import { scalarMultiply, norm, cross, addVec, keplerianToCartesian } from "./transform";

export const LaserAblationSection = ({
  orbitalElements,
  applyNewElements,
  laPower,
  setLaPower,
  laDuration,
  setLaDuration,
  laEfficiency,
  setLaEfficiency,
  laDirection,
  setLaDirection,
  setLaserEvaluation,
  laserEvaluation,
  closestApproachData
}) => {
  const [showCloseUp, setShowCloseUp] = useState(true);

  const { r_vec, v_vec } = keplerianToCartesian(
    orbitalElements.a,
    orbitalElements.e,
    orbitalElements.i,
    orbitalElements.om,
    orbitalElements.w,
    orbitalElements.ma
  );

  const unitV = scalarMultiply(v_vec, 1 / norm(v_vec));
  const unitR = scalarMultiply(r_vec, 1 / norm(r_vec));
  const h_vec = cross(r_vec, v_vec);
  const unitH = scalarMultiply(h_vec, 1 / norm(h_vec));

  let laserDir;
  switch (laDirection) {
    case "alongVelocity": laserDir = unitV; break;
    case "radial":        laserDir = unitR; break;
    case "normal":        laserDir = unitH; break;
    default:              laserDir = unitV;
  }

  return (
    <div style={{
      background: "#1a1410",
      border: "1px solid rgba(255,69,0,0.15)",
      borderRadius: "6px",
      padding: "1rem 1.1rem",
      marginTop: "0.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
    }}>
      {/* Title */}
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: "1.1rem",
        letterSpacing: "0.1em",
        color: "#ffb347",
        borderBottom: "1px solid rgba(255,69,0,0.12)",
        paddingBottom: "0.4rem",
      }}>
        Laser Ablation
      </div>

      {/* Power */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>
          Laser Power (MW)
        </label>
        <Tooltip text="The laser output power in megawatts. Higher power increases the vaporization rate of the asteroid surface.">
          <input
            type="number"
            value={laPower}
            onChange={(e) => setLaPower(parseFloat(e.target.value) || 0)}
            style={{
              width: "100%", padding: "0.5rem 0.6rem",
              background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)",
              borderRadius: "4px", color: "#f0e6d3",
              fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", outline: "none",
            }}
          />
        </Tooltip>
      </div>

      {/* Duration */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>
          Duration (days)
        </label>
        <Tooltip text="The time period during which the laser is active. Longer durations result in greater deflection.">
          <input
            type="number"
            value={laDuration}
            onChange={(e) => setLaDuration(parseFloat(e.target.value) || 1)}
            style={{
              width: "100%", padding: "0.5rem 0.6rem",
              background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)",
              borderRadius: "4px", color: "#f0e6d3",
              fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", outline: "none",
            }}
          />
        </Tooltip>
      </div>

      {/* Efficiency */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>
          Efficiency (0–1)
        </label>
        <Tooltip text="Represents how efficiently the absorbed laser energy converts to thrust. Typical values range 0.2–0.6.">
          <input
            type="number"
            step="0.05" min="0" max="1"
            value={laEfficiency}
            onChange={(e) => setLaEfficiency(parseFloat(e.target.value) || 0)}
            style={{
              width: "100%", padding: "0.5rem 0.6rem",
              background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)",
              borderRadius: "4px", color: "#f0e6d3",
              fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", outline: "none",
            }}
          />
        </Tooltip>
      </div>

      {/* Direction */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
        <label style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>
          Direction
        </label>
        <Tooltip text="The direction in which the ablation jet is directed.">
          <select
            value={laDirection}
            onChange={(e) => setLaDirection(e.target.value)}
            style={{
              width: "100%", padding: "0.5rem 0.6rem",
              background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)",
              borderRadius: "4px", color: "#f0e6d3",
              fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", outline: "none", cursor: "pointer",
            }}
          >
            <option value="alongVelocity">Along Velocity</option>
            <option value="radial">Radial</option>
            <option value="normal">Normal (perpendicular)</option>
          </select>
        </Tooltip>
      </div>

      {/* Apply Button */}
      <button
        onClick={() => {
          const durationSec = laDuration * 24 * 3600;
          const asteroidMass = 8.64e8;
          const result = laserAblation(
            orbitalElements, laPower, laEfficiency,
            asteroidMass, durationSec, 3600, laDirection
          );
          setLaserEvaluation(evaluateMitigation(
            closestApproachData.miss_distance.kilometers,
            closestApproachData.miss_distance.kilometers + result.deltaVmag * 1000
          ));
          applyNewElements(result.currentElements);
        }}
        style={{
          width: "100%",
          background: "transparent",
          border: "1px solid rgba(255,69,0,0.35)",
          color: "#ff4500",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "0.95rem",
          letterSpacing: "0.12em",
          padding: "0.55rem 1rem",
          borderRadius: "4px",
          cursor: "pointer",
          marginTop: "0.25rem",
          transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => { e.target.style.background = "#ff4500"; e.target.style.color = "#0d0a08"; e.target.style.boxShadow = "0 0 14px rgba(255,69,0,0.35)"; }}
        onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "#ff4500"; e.target.style.boxShadow = "none"; }}
      >
        Apply Laser Ablation
      </button>

      {/* Score Bar */}
      <div style={{
        padding: "0.75rem",
        background: "#2a2018",
        borderRadius: "4px",
        border: "1px solid rgba(255,69,0,0.1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#8a7060" }}>Score</span>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: "#ffb347" }}>
            {laserEvaluation?.score || 0} / 100
          </span>
        </div>
        <div style={{ width: "100%", height: "6px", background: "#3d3028", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${laserEvaluation?.score || 0}%`,
            background: "linear-gradient(90deg, #ff4500, #ffb347)",
            borderRadius: "3px",
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* 3D Scene */}
      {showCloseUp && (
        <div style={{
          width: "100%", height: "24rem",
          background: "#0d0a08",
          borderRadius: "6px",
          overflow: "hidden",
          border: "1px solid rgba(255,69,0,0.15)",
          marginTop: "0.25rem",
        }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls enablePan enableZoom enableRotate target={[0, 0, 0]} />

            {/* Orbit ring */}
            <Line
              points={Array.from({ length: 128 }, (_, i) => {
                const theta = (i / 128) * 2 * Math.PI;
                return new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
              })}
              color="#ffb347"
              lineWidth={1.5}
            />

            {(() => {
              const asteroidPos = new THREE.Vector3(1, 0, 0);
              const laserPos = asteroidPos.clone().add(new THREE.Vector3(0.3, 0.4, 0));

              return (
                <>
                  {/* Asteroid */}
                  <Sphere args={[0.21, 32, 32]} position={asteroidPos.toArray()}>
                    <meshStandardMaterial color="#8a7060" roughness={0.9} />
                  </Sphere>

                  {/* Laser source spacecraft */}
                  <Sphere args={[0.08, 16, 16]} position={laserPos.toArray()}>
                    <meshStandardMaterial color="#ffb347" emissive="#ff6a00" emissiveIntensity={1} />
                  </Sphere>

                  {/* Laser beam */}
                  <Line
                    points={[
                      asteroidPos,
                      new THREE.Vector3().addVectors(asteroidPos, new THREE.Vector3(0.3, 0.4, 0)),
                    ]}
                    color="#ff4500"
                    lineWidth={3}
                  />
                </>
              );
            })()}
          </Canvas>
        </div>
      )}
    </div>
  );
};