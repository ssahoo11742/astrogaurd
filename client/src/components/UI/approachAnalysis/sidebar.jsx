import React, { useState } from "react";
import { simulateKineticImpact } from "./transform";
import { GravityTractorSection } from "./gravityTractor";
import KineticDeflector from "./kineticDeflector";
import { ImpactReportSection } from "./impactAnalysis";
import { evaluateMitigation, Tooltip } from "./utils";
import { LaserAblationSection } from "./laser";

const sidebarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Crimson+Pro:wght@400;600&display=swap');

  :root {
    --ember: #ff4500;
    --amber: #ffb347;
    --char:  #0d0a08;
    --coal:  #1a1410;
    --ash:   #2a2018;
    --smoke: #3d3028;
    --bone:  #f0e6d3;
    --dim:   #8a7060;
  }

  .sb-panel {
    background: rgba(13,10,8,0.96);
    border-left: 1px solid rgba(255,69,0,0.2);
    color: #f0e6d3;
    font-family: 'DM Mono', monospace;
  }

  .sb-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.6rem;
    letter-spacing: 0.06em;
    color: #f0e6d3;
    line-height: 1;
  }

  .sb-designation {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7060;
    margin-top: 0.2rem;
  }

  .sb-card {
    background: #1a1410;
    border: 1px solid rgba(255,69,0,0.15);
    border-radius: 6px;
    padding: 1rem 1.1rem;
    margin-bottom: 1rem;
  }

  .sb-card-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.1rem;
    letter-spacing: 0.1em;
    color: #ffb347;
    margin-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255,69,0,0.12);
    padding-bottom: 0.4rem;
  }

  .sb-grid {
    display: grid;
    gap: 0.75rem;
  }

  .sb-grid-2 { grid-template-columns: 1fr 1fr; }
  .sb-grid-3 { grid-template-columns: 1fr 1fr 1fr; }

  .sb-field-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7060;
    margin-bottom: 0.15rem;
  }

  .sb-field-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.1rem;
    letter-spacing: 0.04em;
    color: #f0e6d3;
  }

  .sb-section-divider {
    border: none;
    border-top: 1px solid rgba(255,69,0,0.12);
    margin: 0.5rem 0 0.75rem;
  }

  .sb-input {
    width: 100%;
    background: #2a2018;
    border: 1px solid rgba(255,69,0,0.2);
    border-radius: 4px;
    color: #f0e6d3;
    font-family: 'DM Mono', monospace;
    font-size: 0.82rem;
    padding: 0.5rem 0.6rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    max-width: 100%;
  }
  .sb-input:focus {
    border-color: #ff4500;
    box-shadow: 0 0 0 3px rgba(255,69,0,0.1);
  }

  .sb-btn {
    width: 100%;
    background: transparent;
    border: 1px solid rgba(255,69,0,0.35);
    color: #ff4500;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 0.95rem;
    letter-spacing: 0.12em;
    padding: 0.55rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
    margin-top: 0.5rem;
  }
  .sb-btn:hover {
    background: #ff4500;
    color: #0d0a08;
    box-shadow: 0 0 14px rgba(255,69,0,0.35);
  }

  .sb-score-bar-wrap {
    margin-top: 0.75rem;
    padding: 0.75rem;
    background: #2a2018;
    border-radius: 4px;
    border: 1px solid rgba(255,69,0,0.1);
  }

  .sb-score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.65rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8a7060;
  }

  .sb-score-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1rem;
    color: #ffb347;
  }

  .sb-score-track {
    width: 100%;
    height: 6px;
    background: #3d3028;
    border-radius: 3px;
    overflow: hidden;
  }

  .sb-score-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff4500, #ffb347);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  /* Nav buttons */
  .sb-nav {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    gap: 6px;
    z-index: 9999;
  }

  .sb-nav-btn {
    background: #0d0a08;
    border: 1px solid rgba(255,69,0,0.3);
    color: #8a7060;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    padding: 5px 14px;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .sb-nav-btn:hover, .sb-nav-btn.active {
    background: #ff4500;
    color: #0d0a08;
    border-color: #ff4500;
    box-shadow: 0 0 14px rgba(255,69,0,0.35);
  }

  .sb-modify-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem;
    letter-spacing: 0.08em;
    color: #ffb347;
    border-bottom: 1px solid rgba(255,69,0,0.15);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  .sb-axis-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7060;
    margin-bottom: 0.3rem;
  }
`;

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
  onDeflectionAttempt,
}) => {
  const [direction, setDirection] = useState("alongVelocity");
  const [gtDirection, setGtDirection] = useState("alongVelocity");
  const [gtDistance, setGtDistance] = useState(0);
  const [gtMass, setGtMass] = useState(0);
  const [gtDuration, setGtDuration] = useState(1);
  const [manualEvaluation, setManualEvaluation] = useState(0);
  const [kineticEvaluation, setKineticEvaluation] = useState(null);
  const [gravityEvaluation, setGravityEvaluation] = useState(null);
  const [laserEvaluation, setLaserEvaluation] = useState(null);
  const [laPower, setLaPower] = useState(0);
  const [laDuration, setLaDuration] = useState(1);
  const [laEfficiency, setLaEfficiency] = useState(0.5);
  const [laDirection, setLaDirection] = useState("alongVelocity");

  const handleApplyKineticImpact = () => {
    const newElements = simulateKineticImpact(orbitalElements, deltaVMag, direction);
    applyNewElements(newElements);
    if (onDeflectionAttempt) onDeflectionAttempt();
  };

  const panelStyle = {
    position: "fixed",
    top: 0,
    right: 0,
    width: "35rem",
    minWidth: "35rem",
    maxWidth: "35rem",
    flexShrink: 0,
    height: "100%",
    boxSizing: "border-box",
    boxShadow: "-4px 0 40px rgba(0,0,0,0.6)",
    transition: "transform 0.3s ease",
    zIndex: 50,
  };

  return (
    <>
      <style>{sidebarStyles}</style>

      {/* ── Info Panel ── */}
      <div
        className="sb-panel"
        style={{ ...panelStyle, transform: show === "Info" ? "translateX(0)" : "translateX(100%)" }}
      >
        <div style={{ padding: "1.5rem", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div className="sb-name">{name}</div>
            <div className="sb-designation">{designation}</div>
          </div>

          {/* Approach Data */}
          <div className="sb-card">
            <div className="sb-card-title">Approach Data</div>
            <div className="sb-grid sb-grid-2">
              <div>
                <Tooltip text="The date and time when the asteroid comes closest to Earth in its current orbit">
                  <div className="sb-field-label">Closest Approach</div>
                </Tooltip>
                <div className="sb-field-value" style={{ fontSize: "0.85rem", fontFamily: "'DM Mono', monospace" }}>
                  {new Date(closestApproachDate.getTime()).toUTCString()}
                </div>
              </div>
              <div>
                <Tooltip text="How fast the asteroid is moving relative to Earth at closest approach">
                  <div className="sb-field-label">Velocity (km/s)</div>
                </Tooltip>
                <div className="sb-field-value">
                  {parseFloat(closestApproachData?.relative_velocity?.kilometers_per_second || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <Tooltip text="The distance by which the asteroid will miss Earth">
                  <div className="sb-field-label">Miss Distance (km)</div>
                </Tooltip>
                <div className="sb-field-value">
                  {parseFloat(closestApproachData?.miss_distance?.kilometers || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <Tooltip text="Estimated diameter of the asteroid based on brightness observations">
                  <div className="sb-field-label">Diameter (km)</div>
                </Tooltip>
                <div className="sb-field-value">
                  {sentry_data?.summary?.diameter ?? data.estimated_diameter_km?.kilometers ?? "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="sb-card">
            <div className="sb-card-title">Risk Assessment</div>
            <div className="sb-grid sb-grid-2">
              <div>
                <Tooltip text="Potentially Hazardous Asteroid - comes within 0.05 AU and larger than 140m">
                  <div className="sb-field-label">PHA?</div>
                </Tooltip>
                <div className="sb-field-value">{data.is_potentially_hazardous ? "Yes" : "No"}</div>
              </div>
              <div>
                <Tooltip text="Minimum Orbit Intersection Distance in AU">
                  <div className="sb-field-label">MOID (AU)</div>
                </Tooltip>
                <div className="sb-field-value">{data.orbital_data.moid}</div>
              </div>
              <div>
                <Tooltip text="Palermo Technical Impact Hazard Scale">
                  <div className="sb-field-label">Palermo Score</div>
                </Tooltip>
                <div className="sb-field-value">{data?.sentry_data?.summary?.ps_max ?? "--"}</div>
              </div>
              <div>
                <Tooltip text="Torino Impact Hazard Scale (0–10)">
                  <div className="sb-field-label">Torino Score</div>
                </Tooltip>
                <div className="sb-field-value">{data?.sentry_data?.summary?.ts_max ?? "--"}</div>
              </div>
              <div>
                <Tooltip text="Cumulative probability the asteroid will impact Earth">
                  <div className="sb-field-label">Impact Prob.</div>
                </Tooltip>
                <div className="sb-field-value">
                  {(parseFloat(data?.sentry_data?.summary?.ip) * 100).toFixed(4) + "%" ?? "--"}
                </div>
              </div>
            </div>
          </div>

          {/* Damage Assessment */}
          <div className="sb-card">
            <div className="sb-card-title">Damage Assessment</div>
            <div className="sb-grid sb-grid-2">
              <div>
                <Tooltip text="Expected surface impact velocity">
                  <div className="sb-field-label">Impact Vel. (km/s)</div>
                </Tooltip>
                <div className="sb-field-value">{data?.sentry_data?.summary?.v_imp ?? "Not Available"}</div>
              </div>
              <div>
                <Tooltip text="Kinetic energy on impact in megatons TNT equivalent">
                  <div className="sb-field-label">Impact Energy (MT TNT)</div>
                </Tooltip>
                <div className="sb-field-value">{data?.sentry_data?.summary?.energy ?? "Not Available"}</div>
              </div>
              <div>
                <Tooltip text="Estimated mass in kilograms">
                  <div className="sb-field-label">Mass (kg)</div>
                </Tooltip>
                <div className="sb-field-value">{data?.sentry_data?.summary?.mass ?? "Not Available"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modify Panel ── */}
      <div
        className="sb-panel"
        style={{ ...panelStyle, zIndex: 50, transform: show === "Modify" ? "translateX(0)" : "translateX(100%)" }}
      >
        <div style={{ padding: "1.5rem", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="sb-modify-title">Modify Orbit</div>

          {/* Manual Δv */}
          <div className="sb-card">
            <Tooltip text="Apply a custom velocity change in X, Y, Z coordinates to modify the asteroid's trajectory">
              <div className="sb-card-title">Manual Δv</div>
            </Tooltip>
            <div className="sb-grid sb-grid-3">
              {["x", "y", "z"].map((axis) => (
                <div key={axis} style={{ display: "flex", flexDirection: "column" }}>
                  <Tooltip text={`Velocity change in ${axis.toUpperCase()} direction (km/s)`}>
                    <div className="sb-axis-label">{axis.toUpperCase()} (km/s)</div>
                  </Tooltip>
                  <input
                    type="number"
                    className="sb-input"
                    value={deltaV[axis]}
                    onChange={(e) => setDeltaV({ ...deltaV, [axis]: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              ))}
            </div>
            <button
              className="sb-btn"
              onClick={() => {
                setManualEvaluation(evaluateMitigation(
                  closestApproachData.miss_distance.kilometers,
                  closestApproachData.miss_distance.kilometers + Math.sqrt(deltaV.x ** 2 + deltaV.y ** 2 + deltaV.z ** 2) * 1000
                ));
                const newElements = applyDeltaV(
                  { a: orbitalElements.a, e: orbitalElements.e, i: orbitalElements.i, om: orbitalElements.om, w: orbitalElements.w, ma: orbitalElements.ma },
                  [deltaV.x, deltaV.y, deltaV.z]
                );
                applyNewElements(newElements);
              }}
            >
              Apply Δv
            </button>
            <div className="sb-score-bar-wrap">
              <div className="sb-score-header">
                <span>Score</span>
                <span className="sb-score-value">{manualEvaluation?.score || 0} / 100</span>
              </div>
              <div className="sb-score-track">
                <div className="sb-score-fill" style={{ width: `${manualEvaluation?.score || 0}%` }} />
              </div>
            </div>
          </div>

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

      {/* ── Impact Panel ── */}
      <div
        className="sb-panel"
        style={{ ...panelStyle, transform: show === "Impact" ? "translateX(0)" : "translateX(100%)" }}
      >
        <div style={{ padding: "1.5rem", height: "100%", overflowY: "auto" }}>
          <ImpactReportSection data={data} />
        </div>
      </div>

      {/* ── Nav Buttons ── */}
      <div className="sb-nav">
        {["Info", "Modify", "Impact", "Close"].map((label) => (
          <button
            key={label}
            className={`sb-nav-btn${show === label ? " active" : ""}`}
            onClick={() => setShow(label)}
          >
            {label}
          </button>
        ))}
      </div>
    </>
  );
};