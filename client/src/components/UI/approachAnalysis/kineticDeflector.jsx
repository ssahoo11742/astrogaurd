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
    <div className="bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 mt-4">
      <h4 className="font-semibold text-lg border-b border-gray-700 pb-1">
        Kinetic Deflector
      </h4>

      <div className="space-y-3">
        {/* Δv Magnitude */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Δv Magnitude (km/s)</label>
          <Tooltip text="Magnitude of velocity change applied to the asteroid. Larger Δv moves the asteroid more.">
            <input
              type="number"
              className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
              value={deltaVMag * 1000}
              onChange={(e) => setDeltaVMag(parseFloat(e.target.value) / 1000)}
            />
          </Tooltip>
        </div>

        {/* Direction */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Direction</label>
          <Tooltip text="Direction in which the Δv is applied. Along Velocity = along motion, Radial = toward/away from Sun, Normal = perpendicular to orbit.">
            <select
              className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
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
            className="w-full bg-green-600 hover:bg-green-700 rounded p-2 font-semibold shadow mt-2"
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
        <div className="w-full mt-4 p-3 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Score</span>
            <span className="text-sm font-bold text-white">
              {kineticEvaluation?.score || 0} / 100
            </span>
          </div>

          <div className="relative w-full h-8 bg-gray-600 rounded-full overflow-hidden border border-gray-500">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${kineticEvaluation?.score || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3D Scene */}
      {showCloseUp && (
        <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden mt-2">
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
