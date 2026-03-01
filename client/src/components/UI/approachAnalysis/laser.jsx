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

  // Convert keplerian to cartesian for visualization
  const { r_vec, v_vec } = keplerianToCartesian(
    orbitalElements.a,
    orbitalElements.e,
    orbitalElements.i,
    orbitalElements.om,
    orbitalElements.w,
    orbitalElements.ma
  );

  // Unit vectors for direction selection
  const unitV = scalarMultiply(v_vec, 1 / norm(v_vec));
  const unitR = scalarMultiply(r_vec, 1 / norm(r_vec));
  const h_vec = cross(r_vec, v_vec);
  const unitH = scalarMultiply(h_vec, 1 / norm(h_vec));

  let laserDir;
  switch (laDirection) {
    case "alongVelocity":
      laserDir = unitV;
      break;
    case "radial":
      laserDir = unitR;
      break;
    case "normal":
      laserDir = unitH;
      break;
    default:
      laserDir = unitV;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-sm space-y-4 mt-4">
      <h4 className="font-semibold text-lg border-b border-gray-700 pb-1">
        Laser Ablation
      </h4>

      <div className="space-y-3">
        {/* Power */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Laser Power (MW)</label>
          <Tooltip text="The laser output power in megawatts. Higher power increases the vaporization rate of the asteroid surface.">
            <input
              type="number"
              className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-red-500"
              value={laPower}
              onChange={(e) => setLaPower(parseFloat(e.target.value) || 0)}
            />
          </Tooltip>
        </div>

        {/* Duration */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Duration (days)</label>
          <Tooltip text="The time period during which the laser is active. Longer durations result in greater deflection.">
            <input
              type="number"
              className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-red-500"
              value={laDuration}
              onChange={(e) => setLaDuration(parseFloat(e.target.value) || 1)}
            />
          </Tooltip>
        </div>

        {/* Efficiency */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Efficiency (0–1)</label>
          <Tooltip text="Represents how efficiently the absorbed laser energy converts to thrust. Typical values range 0.2–0.6.">
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-red-500"
              value={laEfficiency}
              onChange={(e) => setLaEfficiency(parseFloat(e.target.value) || 0)}
            />
          </Tooltip>
        </div>

        {/* Direction */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm mb-1">Direction</label>
          <Tooltip text="The direction in which the ablation jet is directed. Along Velocity = along orbit motion, Radial = toward/away from Sun, Normal = perpendicular to orbital plane.">
            <select
              className="w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-red-500"
              value={laDirection}
              onChange={(e) => setLaDirection(e.target.value)}
            >
              <option value="alongVelocity">Along Velocity</option>
              <option value="radial">Radial</option>
              <option value="normal">Normal (perpendicular)</option>
            </select>
          </Tooltip>
        </div>

        {/* Apply Button */}
        <button
          className="w-full bg-red-600 hover:bg-red-700 rounded p-2 font-semibold shadow mt-2"
          onClick={() => {
            const durationSec = laDuration * 24 * 3600;
            const asteroidMass = 8.64e8; // kg (≈ small asteroid, adjust if needed)
            const result = laserAblation(
            orbitalElements,
            laPower,
            laEfficiency,
            asteroidMass,
            durationSec,
            3600,
            laDirection
            );


            setLaserEvaluation(
              evaluateMitigation(
                closestApproachData.miss_distance.kilometers,
                closestApproachData.miss_distance.kilometers + result.deltaVmag * 1000
              )
            );
            applyNewElements(result.currentElements);
          }}
        >
          Apply Laser Ablation
        </button>

        {/* Score Bar */}
        <div className="w-full mt-4 p-3 bg-gray-700 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Score</span>
            <span className="text-sm font-bold text-white">
              {laserEvaluation?.score || 0} / 100
            </span>
          </div>

          <div className="relative w-full h-8 bg-gray-600 rounded-full overflow-hidden border border-gray-500">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${laserEvaluation?.score || 0}%` }}
            />
          </div>
        </div>

        {/* 3D Scene */}
        {showCloseUp && (
          <div className="w-full h-96 bg-gray-900 rounded-lg overflow-hidden mt-2">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <OrbitControls enablePan enableZoom enableRotate target={[0, 0, 0]} />

              {/* Orbit */}
              <Line
                points={Array.from({ length: 128 }, (_, i) => {
                  const theta = (i / 128) * 2 * Math.PI;
                  return new THREE.Vector3(Math.cos(theta), Math.sin(theta), 0);
                })}
                color="yellow"
                lineWidth={2}
              />

              {(() => {
                const asteroidPos = new THREE.Vector3(1, 0, 0);
                const laserPos = asteroidPos.clone().add(new THREE.Vector3(0.3, 0.4, 0));

                return (
                  <>
                    {/* Asteroid */}
                    <Sphere args={[0.21, 32, 32]} position={asteroidPos.toArray()}>
                      <meshStandardMaterial color="orange" />
                    </Sphere>

                    {/* Laser Source */}
                    <Sphere args={[0.08, 16, 16]} position={laserPos.toArray()}>
                      <meshStandardMaterial color="cyan" emissive="cyan" />
                    </Sphere>

                    {/* Laser Beam */}
                    <Line
                      points={[
                        asteroidPos,
                        new THREE.Vector3().addVectors(asteroidPos, new THREE.Vector3(0.3, 0.4, 0)),
                      ]}
                      color="red"
                      lineWidth={3}
                    />
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
