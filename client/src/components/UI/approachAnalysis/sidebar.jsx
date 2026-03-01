import React, { useState } from "react";
import { simulateKineticImpact } from "./transform";
import { GravityTractorSection } from "./gravityTractor";
import KineticDeflector from "./kineticDeflector";
import { ImpactReportSection } from "./impactAnalysis";
import { evaluateMitigation, Tooltip } from "./utils";
import { LaserAblationSection } from "./laser";
export const Sidebar = ({
  setDeltaVMag,
  deltaVMag,
  orbitalElements,
  applyNewElements,
  applyDeltaV,
  setDeltaV,
  deltaV,
  show,
  setShow,
  name,
  designation,
  closestApproachDate,
  closestApproachData,
  sentry_data,
  data,
  onDeflectionAttempt 
}) => {
  const [direction, setDirection] = useState("alongVelocity");
  const [gtDirection, setGtDirection] = useState("alongVelocity");
  const [gtDistance, setGtDistance] = useState(0);
  const [gtMass, setGtMass] = useState(0);
  const [gtDuration, setGtDuration] = useState(1); // days
  const [manualEvaluation, setManualEvaluation] = useState(0);
  const [kineticEvaluation, setKineticEvaluation] = useState(null);
  const [gravityEvaluation, setGravityEvaluation] = useState(null);
  const [laserEvaluation, setLaserEvaluation] = useState(null);
  const [laPower, setLaPower] = useState(0); // MW
  const [laDuration, setLaDuration] = useState(1); // days
  const [laEfficiency, setLaEfficiency] = useState(0.5);  
  const [laDirection, setLaDirection] = useState("alongVelocity");

  const handleApplyKineticImpact = () => {
    const newElements = simulateKineticImpact(
      orbitalElements,
      deltaVMag,
      direction
    );
    applyNewElements(newElements);

    if (onDeflectionAttempt) {
      onDeflectionAttempt();
    }
  };

  // Shared classes for grids inside the sidebar
  const gridClasses = "grid gap-4 min-w-0";

  return (
    <>
      {/* Info Sidebar */}
      <div
        className={`fixed top-0 right-0 w-[35rem] flex-shrink-0 h-full box-border bg-gray-900 bg-opacity-90 text-white shadow-lg transform transition-transform ${
          show === "Info" ? "translate-x-0" : "translate-x-full"
        }`}
          style={{
    width: "35rem",
    minWidth: "35rem",
    maxWidth: "35rem",
    flexShrink: 0,
  }}
      >
        <div className="p-6 space-y-6 h-full overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-gray-400">{designation}</p>
          </div>

          {/* Approach Data */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Approach Data</h3>
            <div className={`${gridClasses} grid-cols-2`}>
              <div>
                <Tooltip text="The date and time when the asteroid comes closest to Earth in its current orbit">
                  <p className="text-gray-400">Closest Approach</p>
                </Tooltip>
                <p className="font-bold">
                  {new Date(closestApproachDate.getTime()).toUTCString()}
                </p>
              </div>
              <div>
                <Tooltip text="How fast the asteroid is moving relative to Earth at closest approach">
                  <p className="text-gray-400">Velocity (km/s)</p>
                </Tooltip>
                <p className="font-bold">
                  {parseFloat(
                    closestApproachData?.relative_velocity
                      ?.kilometers_per_second || 0
                  ).toFixed(2)}
                </p>
              </div>
              <div>
                <Tooltip text="The distance by which the asteroid will miss Earth. Smaller values indicate closer encounters">
                  <p className="text-gray-400">Miss Distance (km)</p>
                </Tooltip>
                <p className="font-bold">
                  {parseFloat(
                    closestApproachData?.miss_distance?.kilometers || 0
                  ).toLocaleString()}
                </p>
              </div>
              <div>
                <Tooltip text="Estimated diameter of the asteroid based on brightness observations">
                  <p className="text-gray-400">Diameter (km)</p>
                </Tooltip>
                <p className="font-bold">
                  {sentry_data?.summary?.diameter ??
                    data.estimated_diameter_km?.kilometers ??
                    "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold mb-2">Risk Assessment</h3>
            <div className={`${gridClasses} grid-cols-2`}>
              <div>
                <Tooltip text="Potentially Hazardous Asteroid - classified as such if it comes within 0.05 AU of Earth and is larger than 140 meters">
                  <p className="text-gray-400">PHA?</p>
                </Tooltip>
                <p className="font-bold">
                  {data.is_potentially_hazardous ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <Tooltip text="Minimum Orbit Intersection Distance - the closest the asteroid's orbit comes to Earth's orbit in astronomical units">
                  <p className="text-gray-400">MOID (AU)</p>
                </Tooltip>
                <p className="font-bold">{data.orbital_data.moid}</p>
              </div>
              <div>
                <Tooltip text="Palermo Technical Impact Hazard Scale - compares impact probability and kinetic energy to background hazard. Values above -2 warrant monitoring">
                  <p className="text-gray-400">Palermo Score</p>
                </Tooltip>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.ps_max ?? "--"}
                </p>
              </div>
              <div>
                <Tooltip text="Torino Impact Hazard Scale - rates asteroid threat from 0 (no hazard) to 10 (certain global catastrophe)">
                  <p className="text-gray-400">Torino Score</p>
                </Tooltip>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.ts_max ?? "--"}
                </p>
              </div>
              <div>
                <Tooltip text="Cumulative probability that the asteroid will impact Earth based on current observations">
                  <p className="text-gray-400">Impact Prob.</p>
                </Tooltip>
                <p className="font-bold">
                  {(parseFloat(data?.sentry_data?.summary?.ip) * 100).toFixed(
                    4
                  ) + "%" ?? "--"}
                </p>
              </div>
            </div>
          </div>

          {/* Damage Risk */}
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <h3 className="text-lg font-semibold mb-2">Damage Assessment</h3>
            <div className={`${gridClasses} grid-cols-2`}>
              <div>
                <Tooltip text="Expected velocity of the asteroid if it were to impact Earth's surface">
                  <p className="text-gray-400">Impact Vel. (km/s)</p>
                </Tooltip>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.v_imp ?? "Not Available"}
                </p>
              </div>
              <div>
                <Tooltip text="Kinetic energy released on impact, measured in megatons of TNT equivalent. For reference, the Hiroshima bomb was about 0.015 MT">
                  <p className="text-gray-400">Impact Energy (MT TNT)</p>
                </Tooltip>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.energy ?? "Not Available"}
                </p>
              </div>
              <div>
                <Tooltip text="Estimated mass of the asteroid in kilograms">
                  <p className="text-gray-400">Mass (kg)</p>
                </Tooltip>
                <p className="font-bold">
                  {data?.sentry_data?.summary?.mass ?? "Not Available"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modify Sidebar */}
      <div
        className={`fixed z-50 top-0 right-0 w-[35rem] flex-shrink-0 h-full box-border bg-gray-900 bg-opacity-95 text-white shadow-lg transform transition-transform ${
          show === "Modify" ? "translate-x-0" : "translate-x-full"
        }`}
          style={{
    width: "35rem",
    minWidth: "35rem",
    maxWidth: "35rem",
    flexShrink: 0,
  }}
      >
        <div className="p-6 h-full overflow-y-auto space-y-6">
          <h3 className="font-bold border-b border-gray-700 pb-2 mb-4">
            Modify Orbit
          </h3>

          {/* Manual Δv Input */}
          <div className="bg-gray-800 p-4 rounded-lg shadow-sm space-y-4">
            <Tooltip text="Delta-v (Δv) represents a change in velocity. Apply a custom velocity change in X, Y, Z coordinates to modify the asteroid's trajectory">
              <h4 className="font-semibold text-lg border-b border-gray-700 pb-1">
                Manual Δv
              </h4>
            </Tooltip>
            <div className={`${gridClasses} grid-cols-3`}>
              {["x", "y", "z"].map((axis) => (
                <div key={axis} className="flex flex-col">
                  <Tooltip text={`Velocity change in ${axis.toUpperCase()} direction (kilometers per second). Positive values push in the positive ${axis.toUpperCase()} direction`}>
                    <label className="text-gray-400 text-sm mb-1">
                      {axis.toUpperCase()} (km/s)
                    </label>
                  </Tooltip>
                  <input
                    type="number"
                    className="w-full max-w-full p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={deltaV[axis]}
                    onChange={(e) =>
                      setDeltaV({
                        ...deltaV,
                        [axis]: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <button
              className="mt-3 w-full bg-green-600 hover:bg-green-700 rounded p-2 font-semibold shadow"
              onClick={() => {
                setManualEvaluation(evaluateMitigation(closestApproachData.miss_distance.kilometers,  closestApproachData.miss_distance.kilometers + Math.sqrt(deltaV.x ** 2 + deltaV.y ** 2 + deltaV.z ** 2) * 1000))
                const newElements = applyDeltaV(
                  {
                    a: orbitalElements.a,
                    e: orbitalElements.e,
                    i: orbitalElements.i,
                    om: orbitalElements.om,
                    w: orbitalElements.w,
                    ma: orbitalElements.ma,
                  },
                  [deltaV.x, deltaV.y, deltaV.z]
                );
                applyNewElements(newElements);
              }}
            >
              Apply Δv
            </button>
            <div className="w-full mt-4 p-3 bg-gray-700 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Score</span>
                <span className="text-sm font-bold text-white">
                  {manualEvaluation?.score || 0} / 100
                </span>
              </div>

              <div className="relative w-full h-8 bg-gray-600 rounded-full overflow-hidden border border-gray-500">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{ width: `${manualEvaluation?.score || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Kinetic Deflector */}
          <KineticDeflector
            handleApplyKineticImpact={handleApplyKineticImpact}
            setDeltaVMag={setDeltaVMag}
            deltaVMag={deltaVMag}
            setDirection={setDirection}
            direction={direction}
            setKineticEvaluation={setKineticEvaluation}
            kineticEvaluation={kineticEvaluation}
            closestApproachData={closestApproachData}
          />

          {/* Gravity Tractor */}
          <GravityTractorSection
            orbitalElements={orbitalElements}
            applyNewElements={applyNewElements}
            setGtDirection={setGtDirection}
            setGtDistance={setGtDistance}
            setGtDuration={setGtDuration}
            setGtMass={setGtMass}
            gtDirection={gtDirection}
            gtDistance={gtDistance}
            gtDuration={gtDuration}
            gtMass={gtMass}
            setGravityEvaluation={setGravityEvaluation}
            gravityEvaluation={gravityEvaluation}
            closestApproachData={closestApproachData}
          />
          {/* Laser Ablation */}
          <LaserAblationSection
            orbitalElements={orbitalElements}
            applyNewElements={applyNewElements}
            closestApproachData={closestApproachData}
            setLaserEvaluation={setLaserEvaluation}
            laserEvaluation={laserEvaluation}
            laPower={laPower}
            setLaPower={setLaPower}
            laDuration={laDuration}
            setLaDuration={setLaDuration}
            laEfficiency={laEfficiency}
            setLaEfficiency={setLaEfficiency}
            laDirection={laDirection}
            setLaDirection={setLaDirection}
          />

        </div>
      </div>

      {/* Impact Sidebar */}
      <div
        className={`fixed top-0 right-0 w-[35rem] flex-shrink-0 h-full box-border bg-gray-900 bg-opacity-95 text-white shadow-lg transform transition-transform ${
          show === "Impact" ? "translate-x-0" : "translate-x-full"
        }`}
          style={{
    width: "35rem",
    minWidth: "35rem",
    maxWidth: "35rem",
    flexShrink: 0,
  }}
      >
        <div className="p-6 h-full overflow-y-auto">
          <ImpactReportSection data={data} />
        </div>
      </div>

      {/* Top Right Toggle Buttons */}
      <div className="fixed top-4 right-4 space-x-2 z-50">
        <button
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          onClick={() => setShow("Info")}
        >
          Info
        </button>
        <button
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          onClick={() => setShow("Modify")}
        >
          Modify
        </button>
        <button
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          onClick={() => setShow("Impact")}
        >
          Impact
        </button>
        <button
          className="bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded"
          onClick={() => setShow("close")}
        >
          Close
        </button>
      </div>
    </>
  );
};