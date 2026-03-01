import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import { Asteroid } from "../../Three-JS-Render/BodyPosition";
import { Earth as BodyEarth } from "../../Three-JS-Render/BodyPosition";
import { AU_SCALE, periodFromA } from "./utils";

// Helper function to calculate actual miss distance based on orbital elements
function calculateMissDistance(orbitalElements, asteroidEpochJD, targetJD) {
  if (!orbitalElements) return 0;

  const d_for_coords = targetJD - 2451543.5;

  const earthBody = new BodyEarth();
  const ecoords = earthBody.coordinates(d_for_coords);
  const earthPos = [
    ecoords.xeclip * AU_SCALE,
    ecoords.yeclip * AU_SCALE,
    ecoords.zeclip * AU_SCALE
  ];

  const a = orbitalElements.a ?? 1;
  const e = orbitalElements.e ?? 0;
  const iDeg = (orbitalElements.i * 180) / Math.PI;
  const omDeg = (orbitalElements.om * 180) / Math.PI;
  const wDeg = (orbitalElements.w * 180) / Math.PI;
  const Mdeg = (orbitalElements.ma * 180) / Math.PI;
  const P = orbitalElements.P ?? periodFromA(a);

  const asteroidBody = new Asteroid(
    asteroidEpochJD,
    omDeg,
    iDeg,
    wDeg,
    a,
    e,
    Mdeg,
    P,
    "current-ast"
  );
  const acoords = asteroidBody.coordinates(d_for_coords);
  const asteroidPos = [
    acoords.xeclip * AU_SCALE,
    acoords.yeclip * AU_SCALE,
    acoords.zeclip * AU_SCALE
  ];

  const dx = asteroidPos[0] - earthPos[0];
  const dy = asteroidPos[1] - earthPos[1];
  const dz = asteroidPos[2] - earthPos[2];
  const distanceAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const distanceKm = distanceAU * (149_597_870.7 / 10);

  return distanceKm;
}

export const GameMode = ({
  orbitalElements,
  applyNewElements,
  closestApproachDate,
  asteroidEpochJD,
  targetJD,
  setDtDays,
  dtDays,
  closestApproachData,
  registerDeflectionCallback
}) => {
  const [gameActive, setGameActive] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [timeStep, setTimeStep] = useState(30);
  const [intervalSpeed, setIntervalSpeed] = useState(2000);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [maxTime, setMaxTime] = useState(300);

  const [lastMissDistance, setLastMissDistance] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', isSuccess: false });
  const intervalRef = useRef(null);

  const getCurrentMissDistance = () => {
    try {
      return calculateMissDistance(orbitalElements, asteroidEpochJD, targetJD);
    } catch (error) {
      console.error("Error calculating miss distance:", error);
      if (closestApproachData?.miss_distance?.kilometers) {
        return parseFloat(closestApproachData.miss_distance.kilometers);
      }
      return 0;
    }
  };
  const [minThreshold, setMinThreshold] = useState(Math.round(getCurrentMissDistance() * 1.5), 2);
  const [maxThreshold, setMaxThreshold] = useState(Math.round(getCurrentMissDistance() * 2), 2);

  const onDeflectionAttempt = () => {
    if (!gameActive) return;
    setAttempts((a) => a + 1);
    const currentMiss = getCurrentMissDistance();
    const improvement = currentMiss - lastMissDistance;
    if (improvement > 0) {
      const points = Math.floor(improvement / 10000);
      setScore((s) => s + points);
    }
    setLastMissDistance(currentMiss);
  };

  useEffect(() => {
    if (registerDeflectionCallback && gameActive) {
      registerDeflectionCallback(() => onDeflectionAttempt);
    }
    return () => {
      if (registerDeflectionCallback) {
        registerDeflectionCallback(null);
      }
    };
  }, [registerDeflectionCallback, gameActive]);

  const startGame = () => {
    setMinThreshold(getCurrentMissDistance() * 1.5);
    setMaxThreshold(getCurrentMissDistance() * 2);
    setGameActive(true);
    setGamePaused(false);
    setScore(0);
    setAttempts(0);
    setGameTime(-300);
    setDtDays(-300);
    setLastMissDistance(getCurrentMissDistance());
  };

  const togglePause = () => setGamePaused(!gamePaused);

  const resetGame = () => {
    setGameActive(false);
    setGamePaused(false);
    setGameTime(0);
    setDtDays(0);
    clearInterval(intervalRef.current);
  };

  useEffect(() => {
    if (gameActive && !gamePaused) {
      intervalRef.current = setInterval(() => {
        setGameTime((prev) => {
          const newTime = prev + timeStep;
          if (newTime >= 0) {
            const missDistance = getCurrentMissDistance();
            if (missDistance >= minThreshold && missDistance <= maxThreshold) {
              const bonus = 1000;
              const efficiency = Math.max(0, 100 - attempts * 10);
              const finalScore = score + bonus + efficiency;
              setScore(finalScore);
              setModalContent({
                title: '🎉 SUCCESS!',
                message: `Final miss distance: ${missDistance.toLocaleString()} km\n\nWithin safe range:\n${minThreshold.toLocaleString()} - ${maxThreshold.toLocaleString()} km\n\nFinal Score: ${finalScore}\nAttempts: ${attempts}\nEfficiency Bonus: ${efficiency}`,
                isSuccess: true
              });
              setShowModal(true);
            } else if (missDistance < minThreshold) {
              setModalContent({
                title: '💥 IMPACT IMMINENT!',
                message: `Miss distance too close: ${missDistance.toLocaleString()} km\n\nNeeded: > ${minThreshold.toLocaleString()} km\n\nFinal Score: ${score}\nAttempts: ${attempts}`,
                isSuccess: false
              });
              setShowModal(true);
            } else {
              setModalContent({
                title: '🚀 OVER-DEFLECTED!',
                message: `Miss distance too far: ${missDistance.toLocaleString()} km\n\nNeeded: < ${maxThreshold.toLocaleString()} km\n\nFinal Score: ${score}\nAttempts: ${attempts}`,
                isSuccess: false
              });
              setShowModal(true);
            }
            setGameActive(false);
            return 0;
          }
          setDtDays(newTime);
          return newTime;
        });
      }, intervalSpeed);

      return () => clearInterval(intervalRef.current);
    }
  }, [gameActive, gamePaused, timeStep, intervalSpeed, minThreshold, maxThreshold, score, attempts]);

  // Timer badge color
  const timerColor = gameTime < -100 ? '#22c55e' : gameTime < -30 ? '#f59e0b' : '#ff4500';

  // Miss distance status color
  const missDistance = getCurrentMissDistance();
  const missColor = missDistance >= minThreshold && missDistance <= maxThreshold
    ? '#22c55e'
    : missDistance < minThreshold
    ? '#ff4500'
    : '#ffb347';

  return (
    <>
      <div
        className="fixed top-20 left-4 z-50"
        style={{ background: "rgba(13,10,8,0.97)", border: "1px solid rgba(255,69,0,0.25)", borderRadius: "8px", boxShadow: "0 0 40px rgba(255,69,0,0.08)", padding: "1.5rem", width: "320px" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,69,0,0.2)", paddingBottom: "0.6rem", marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", letterSpacing: "0.1em", color: "#f0e6d3", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Trophy style={{ width: "1.1rem", height: "1.1rem", color: "#ffd700" }} />
            Game Mode
          </h3>
          {gameActive && (
            <div style={{ background: timerColor, borderRadius: "4px", padding: "2px 8px", fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", fontWeight: "bold", color: "#0d0a08", letterSpacing: "0.05em" }}>
              T-{Math.abs(gameTime)} days
            </div>
          )}
        </div>

        {!gameActive ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: "#8a7060", lineHeight: "1.6" }}>
              Deflect the asteroid before it reaches Earth! Time advances automatically — use the deflection tools in the Modify panel to change the asteroid's trajectory.
            </p>

            {[
              { label: "Time Step (days)", value: timeStep, set: (v) => setTimeStep(parseInt(v) || 30), min: 1, max: 60, step: 1 },
              { label: "Interval Speed (ms)", value: intervalSpeed, set: (v) => setIntervalSpeed(parseInt(v) || 2000), min: 500, max: 10000, step: 500 },
              { label: "Min Safe Distance (km)", value: minThreshold, set: (v) => setMinThreshold(parseInt(v) || 1000000), min: 100000, step: 100000 },
              { label: "Max Safe Distance (km)", value: maxThreshold, set: (v) => setMaxThreshold(parseInt(v) || 5000000), min: 100000, step: 100000 },
            ].map(({ label, value, set, min, max, step }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  min={min}
                  max={max}
                  step={step}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", color: "#f0e6d3", fontFamily: "'DM Mono', monospace", fontSize: "0.85rem", outline: "none" }}
                />
              </div>
            ))}

            <button
              onClick={startGame}
              style={{ width: "100%", background: "linear-gradient(135deg, #ff4500, #c0392b)", border: "none", borderRadius: "6px", padding: "0.7rem", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.12em", color: "#f0e6d3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxShadow: "0 0 24px rgba(255,69,0,0.3)", marginTop: "0.25rem" }}
            >
              <Play style={{ width: "1rem", height: "1rem" }} />
              Start Game
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {/* Score / Attempts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
              <div style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.15)", borderRadius: "6px", padding: "0.75rem", borderLeft: "2px solid #ff4500" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>Score</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "#ffd700", letterSpacing: "0.05em" }}>{score}</div>
              </div>
              <div style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.15)", borderRadius: "6px", padding: "0.75rem", borderLeft: "2px solid #ffb347" }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>Attempts</div>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.8rem", color: "#ffb347", letterSpacing: "0.05em" }}>{attempts}</div>
              </div>
            </div>

            {/* Miss Distance Status */}
            <div style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.15)", borderRadius: "6px", padding: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" }}>
                <AlertTriangle style={{ width: "0.9rem", height: "0.9rem", color: "#ffb347" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7060" }}>Current Miss Distance</span>
              </div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: missColor, letterSpacing: "0.05em" }}>
                {missDistance.toLocaleString(undefined, { maximumFractionDigits: 0 })} km
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#8a7060", marginTop: "0.25rem" }}>
                Safe: {minThreshold.toLocaleString()} – {maxThreshold.toLocaleString()} km
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", marginTop: "0.3rem", color: missColor }}>
                {missDistance < minThreshold && "⚠ Too close — increase distance!"}
                {missDistance > maxThreshold && "⚠ Over-deflected — reduce distance!"}
                {missDistance >= minThreshold && missDistance <= maxThreshold && "✓ Within safe range!"}
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "#8a7060" }}>
                <span>Progress</span>
                <span>{Math.floor((gameTime + 300) / 3)}%</span>
              </div>
              <div style={{ width: "100%", height: "10px", background: "#3d3028", borderRadius: "9999px", overflow: "hidden", border: "1px solid rgba(255,69,0,0.15)" }}>
                <div
                  style={{ height: "100%", background: "linear-gradient(90deg, #22c55e, #f59e0b, #ff4500)", borderRadius: "9999px", transition: "width 0.3s ease", width: `${((gameTime + 300) / 300) * 100}%` }}
                />
              </div>
            </div>

            {/* Pause / Reset */}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={togglePause}
                style={{ flex: 1, background: gamePaused ? "linear-gradient(135deg, #ff4500, #c0392b)" : "#2a2018", border: gamePaused ? "none" : "1px solid rgba(255,69,0,0.3)", borderRadius: "6px", padding: "0.5rem", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", letterSpacing: "0.1em", color: "#f0e6d3", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
              >
                {gamePaused ? <Play style={{ width: "0.9rem", height: "0.9rem" }} /> : <Pause style={{ width: "0.9rem", height: "0.9rem" }} />}
                {gamePaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={resetGame}
                style={{ background: "#2a2018", border: "1px solid rgba(255,69,0,0.3)", borderRadius: "6px", padding: "0.5rem 0.75rem", color: "#ff4500", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <RotateCcw style={{ width: "0.9rem", height: "0.9rem" }} />
              </button>
            </div>

            {/* Instructions */}
            <div style={{ background: "rgba(255,69,0,0.06)", border: "1px solid rgba(255,69,0,0.2)", borderRadius: "6px", padding: "0.75rem" }}>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.9rem", letterSpacing: "0.1em", color: "#ffb347", marginBottom: "0.4rem" }}>How to Play:</p>
              <ul style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#8a7060", lineHeight: "1.8", paddingLeft: "1rem", listStyleType: "disc" }}>
                <li>Open the Modify panel and use deflection methods</li>
                <li>Time advances every {(intervalSpeed / 1000).toFixed(1)}s</li>
                <li>Keep miss distance between {(minThreshold / 1000).toLocaleString()}k – {(maxThreshold / 1000).toLocaleString()}k km</li>
                <li>Earn points for improvements (1 pt per 10k km)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Game Over Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "#1a1410", borderRadius: "10px", boxShadow: "0 0 80px rgba(255,69,0,0.2)", padding: "2rem", maxWidth: "480px", width: "100%", margin: "0 1rem", border: `3px solid ${modalContent.isSuccess ? '#22c55e' : '#ff4500'}` }}>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.5rem", letterSpacing: "0.08em", textAlign: "center", color: modalContent.isSuccess ? '#22c55e' : '#ff4500', marginBottom: "1.25rem" }}>
              {modalContent.title}
            </h2>

            <div style={{ background: "#2a2018", borderRadius: "8px", padding: "1.25rem", marginBottom: "1.25rem", border: "1px solid rgba(255,69,0,0.15)" }}>
              {modalContent.message.split('\n\n').map((section, idx) => (
                <div key={idx} style={{ color: "#f0e6d3", marginTop: idx > 0 ? "0.75rem" : 0 }}>
                  {section.split('\n').map((line, lineIdx) => (
                    <div key={lineIdx} style={{ fontFamily: lineIdx === 0 && idx > 0 ? "'Bebas Neue', sans-serif" : "'DM Mono', monospace", fontSize: lineIdx === 0 && idx > 0 ? "1.1rem" : "0.85rem", letterSpacing: lineIdx === 0 && idx > 0 ? "0.08em" : "0.03em", color: lineIdx === 0 && idx > 0 ? "#ffb347" : "#f0e6d3" }}>
                      {line}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => { setShowModal(false); startGame(); }}
                style={{ flex: 1, background: "linear-gradient(135deg, #ff4500, #c0392b)", border: "none", borderRadius: "6px", padding: "0.75rem", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.1em", color: "#f0e6d3", cursor: "pointer", boxShadow: "0 0 24px rgba(255,69,0,0.3)" }}
              >
                Play Again
              </button>
              <button
                onClick={() => { setShowModal(false); resetGame(); }}
                style={{ flex: 1, background: "#2a2018", border: "1px solid rgba(255,69,0,0.2)", borderRadius: "6px", padding: "0.75rem", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: "0.1em", color: "#8a7060", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameMode;