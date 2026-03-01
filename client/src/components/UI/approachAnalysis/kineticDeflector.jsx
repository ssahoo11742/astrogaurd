// src/components/KineticDeflector.js
import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { evaluateMitigation } from "./utils"; // Adjust path as needed
import { Tooltip } from "./utils"; // Make sure Tooltip is imported

export default function KineticDeflector({ handleApplyKineticImpact, setDeltaVMag, deltaVMag, setDirection, direction, setKineticEvaluation, kineticEvaluation, closestApproachData }) {

  const [showCloseUp, setShowCloseUp] = useState(true);

  // Child component for the 3D scene
  function KineticScene({ direction }) { /* unchanged */ }

  return (
    <div className="p-4 rounded-lg shadow-sm space-y-4 mt-4" style={{ background: "#1a1410", border: "1px solid rgba(255,69,0,0.2)" }}>
      <h4 className="font-semibold text-lg pb-1" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.4rem", letterSpacing: "0.08em", color: "#f0e6d3", borderBottom: "1px solid rgba(255,69,0,0.2)" }}>
        Kinetic Deflector
      </h4>

      <div className="space-y-3">
        {/* Δv Magnitude */}
        <div className="flex flex-col">
          <label className="text-sm mb-1" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.7rem" }}>Δv Magnitude (km/s)</label>
          <Tooltip text="Magnitude of velocity change applied to the asteroid. Larger Δv moves the asteroid more.">
            <input
              type="number"
              className="w-full p-2 rounded focus:outline-none"
              style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", color: "#f0e6d3", fontFamily: "'DM Mono', monospace" }}
              value={deltaVMag * 1000}
              onChange={(e) => setDeltaVMag(parseFloat(e.target.value) / 1000)}
            />
          </Tooltip>
        </div>

        {/* Direction */}
        <div className="flex flex-col">
          <label className="text-sm mb-1" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", fontSize: "0.7rem" }}>Direction</label>
          <Tooltip text="Direction in which the Δv is applied. Along Velocity = along motion, Radial = toward/away from Sun, Normal = perpendicular to orbit.">
            <select
              className="w-full p-2 rounded focus:outline-none"
              style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", color: "#f0e6d3", fontFamily: "'DM Mono', monospace" }}
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
            >
              <option value="alongVelocity">Along Velocity</option>
              <option value="radial">Radial</option>
              <option value="normal">Normal (perpendicular)</option>
            </select>
          </Tooltip>
        </div>

        {/* Apply Button */}
          <button
            className="w-full rounded p-2 font-semibold shadow mt-2"
            style={{ background: "linear-gradient(135deg, #ff4500, #c0392b)", border: "none", color: "#f0e6d3", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.12em", cursor: "pointer", boxShadow: "0 0 24px rgba(255,69,0,0.3)" }}
            onClick={() => { 
              handleApplyKineticImpact(deltaVMag, direction); 
              setKineticEvaluation(evaluateMitigation(
                closestApproachData.miss_distance.kilometers,  
                closestApproachData.miss_distance.kilometers + deltaVMag * 1000
              )); 
            }}
          >
            Apply Kinetic Impact
          </button>


        {/* Score */}
        <div className="w-full mt-4 p-3 rounded" style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.15)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: "#8a7060", fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Score</span>
            <span className="text-sm font-bold" style={{ color: "#ffb347", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}>
              {kineticEvaluation?.score || 0} / 100
            </span>
          </div>

          <div className="relative w-full h-8 rounded-full overflow-hidden" style={{ background: "#3d3028", border: "1px solid rgba(255,69,0,0.2)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${kineticEvaluation?.score || 0}%`, background: "linear-gradient(90deg, #ff4500, #ffb347)", boxShadow: "0 0 12px rgba(255,69,0,0.4)", transition: "width 0.5s ease" }}
            />
          </div>
        </div>
      </div>

      {/* 3D Scene */}
      {showCloseUp && (
        <div className="w-full h-96 rounded-lg overflow-hidden mt-2" style={{ background: "#0d0a08", border: "1px solid rgba(255,69,0,0.15)" }}>
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <OrbitControls enablePan enableZoom enableRotate target={[0, 0, 0]} />
            <KineticScene direction={direction} />
          </Canvas>
        </div>
      )}
    </div>
  );
}