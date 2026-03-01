import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Trophy, AlertTriangle } from 'lucide-react';
import { Asteroid } from "../../Three-JS-Render/BodyPosition";
import { Earth as BodyEarth } from "../../Three-JS-Render/BodyPosition";
import { AU_SCALE, periodFromA } from "./utils";

// Helper function to calculate actual miss distance based on orbital elements
function calculateMissDistance(orbitalElements, asteroidEpochJD, targetJD) {
  if (!orbitalElements) return 0;

  const d_for_coords = targetJD - 2451543.5;

  // Get Earth position at target time
  const earthBody = new BodyEarth();
  const ecoords = earthBody.coordinates(d_for_coords);
  const earthPos = [
    ecoords.xeclip * AU_SCALE,
    ecoords.yeclip * AU_SCALE,
    ecoords.zeclip * AU_SCALE
  ];

  // Get asteroid position at target time
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

  // Calculate distance
  const dx = asteroidPos[0] - earthPos[0];
  const dy = asteroidPos[1] - earthPos[1];
  const dz = asteroidPos[2] - earthPos[2];
  const distanceAU = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  // Convert to kilometers (AU_SCALE is 10, so multiply by actual AU to km conversion)
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
  registerDeflectionCallback // NEW: callback to register when deflections happen
}) => {
  const [gameActive, setGameActive] = useState(false);
  const [gamePaused, setGamePaused] = useState(false);
  const [timeStep, setTimeStep] = useState(30); // days to advance per interval
  const [intervalSpeed, setIntervalSpeed] = useState(2000); // ms between advances
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [maxTime, setMaxTime] = useState(300); // 300 days before approach

  const [lastMissDistance, setLastMissDistance] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', isSuccess: false });
  const intervalRef = useRef(null);

  // Calculate current miss distance based on actual orbital elements
  const getCurrentMissDistance = () => {
    try {
      return calculateMissDistance(orbitalElements, asteroidEpochJD, targetJD);
    } catch (error) {
      console.error("Error calculating miss distance:", error);
      // Fallback to static data if calculation fails
      if (closestApproachData?.miss_distance?.kilometers) {
        return parseFloat(closestApproachData.miss_distance.kilometers);
      }
      return 0;
    }
  };
  const [minThreshold, setMinThreshold] = useState(Math.round(getCurrentMissDistance() * 1.5),2); // km minimum safe distance
  const [maxThreshold, setMaxThreshold] = useState(Math.round(getCurrentMissDistance() * 2),2); // km maximum safe distance
  // Track deflection attempts
  const onDeflectionAttempt = () => {
    if (!gameActive) return;
    
    setAttempts((a) => a + 1);
    const currentMiss = getCurrentMissDistance();
    const improvement = currentMiss - lastMissDistance;
    
    // Award points for improvement
    if (improvement > 0) {
      const points = Math.floor(improvement / 10000); // 1 point per 10,000 km
      setScore((s) => s + points);
    }
    
    setLastMissDistance(currentMiss);
  };

  // Register the deflection callback when game is active
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

  // Start/restart game
  const startGame = () => {
    setMinThreshold(getCurrentMissDistance() * 1.5);
    setMaxThreshold(getCurrentMissDistance() * 2);
    setGameActive(true);
    setGamePaused(false);
    setScore(0);
    setAttempts(0);
    setGameTime(-300); // Start 300 days before approach
    setDtDays(-300);
    setLastMissDistance(getCurrentMissDistance());
  };

  // Pause/resume game
  const togglePause = () => {
    setGamePaused(!gamePaused);
  };

  // Reset game
  const resetGame = () => {
    setGameActive(false);
    setGamePaused(false);
    setGameTime(0);
    setDtDays(0);
    clearInterval(intervalRef.current);
  };

  // Auto-advance time
  useEffect(() => {
    if (gameActive && !gamePaused) {
      intervalRef.current = setInterval(() => {
        setGameTime((prev) => {
          const newTime = prev + timeStep;
          if (newTime >= 0) {
            // Game over - check if successful (within range)
            const missDistance = getCurrentMissDistance();
            if (missDistance >= minThreshold && missDistance <= maxThreshold) {
              // Success - within safe range
              const bonus = 1000;
              const efficiency = Math.max(0, 100 - attempts * 10); // Bonus for fewer attempts
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

  return (
    <>
    <div className="fixed top-20 left-4 bg-gray-900 bg-opacity-95 text-white p-6 rounded-lg shadow-lg w-80 space-y-4 z-50">
      <div className="flex items-center justify-between border-b border-gray-700 pb-2">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Game Mode
        </h3>
        {gameActive && (
          <div className={`px-2 py-1 rounded text-xs font-bold ${gameTime < -100 ? 'bg-green-600' : gameTime < -30 ? 'bg-yellow-600' : 'bg-red-600'}`}>
            T-{Math.abs(gameTime)} days
          </div>
        )}
      </div>

      {!gameActive ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Deflect the asteroid before it reaches Earth! Time advances automatically - use the deflection tools in the Modify panel to change the asteroid's trajectory.
          </p>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Time Step (days)</label>
            <input
              type="number"
              value={timeStep}
              onChange={(e) => setTimeStep(parseInt(e.target.value) || 30)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              min="1"
              max="60"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Interval Speed (ms)</label>
            <input
              type="number"
              value={intervalSpeed}
              onChange={(e) => setIntervalSpeed(parseInt(e.target.value) || 2000)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              min="500"
              max="10000"
              step="500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Min Safe Distance (km)</label>
            <input
              type="number"
              value={minThreshold}
              onChange={(e) => setMinThreshold(parseInt(e.target.value) || 1000000)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              min="100000"
              step="100000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Max Safe Distance (km)</label>
            <input
              type="number"
              value={maxThreshold}
              onChange={(e) => setMaxThreshold(parseInt(e.target.value) || 5000000)}
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              min="100000"
              step="100000"
            />
          </div>

          <button
            onClick={startGame}
            className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Game
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-xs text-gray-400">Score</div>
              <div className="text-2xl font-bold text-green-400">{score}</div>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <div className="text-xs text-gray-400">Attempts</div>
              <div className="text-2xl font-bold text-blue-400">{attempts}</div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gray-800 p-3 rounded space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400">Current Miss Distance:</span>
            </div>
            <div className={`text-xl font-bold ${
              getCurrentMissDistance() >= minThreshold && getCurrentMissDistance() <= maxThreshold
                ? 'text-green-400'
                : getCurrentMissDistance() < minThreshold
                ? 'text-red-400'
                : 'text-orange-400'
            }`}>
              {getCurrentMissDistance().toLocaleString(undefined, { maximumFractionDigits: 0 })} km
            </div>
            <div className="text-xs text-gray-400">
              Safe Range: {minThreshold.toLocaleString()} - {maxThreshold.toLocaleString()} km
            </div>
            <div className="text-xs">
              {getCurrentMissDistance() < minThreshold && (
                <span className="text-red-400">⚠ Too close - increase distance!</span>
              )}
              {getCurrentMissDistance() > maxThreshold && (
                <span className="text-orange-400">⚠ Over-deflected - reduce distance!</span>
              )}
              {getCurrentMissDistance() >= minThreshold && getCurrentMissDistance() <= maxThreshold && (
                <span className="text-green-400">✓ Within safe range!</span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span>{Math.floor((gameTime + 300) / 3)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-300"
                style={{ width: `${((gameTime + 300) / 300) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className={`flex-1 ${gamePaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} py-2 rounded font-semibold flex items-center justify-center gap-2`}
            >
              {gamePaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {gamePaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={resetGame}
              className="bg-red-600 hover:bg-red-700 py-2 px-4 rounded font-semibold flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 p-3 rounded text-xs text-gray-300">
            <p className="font-semibold text-blue-300 mb-1">How to Play:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Open the Modify panel and use deflection methods</li>
              <li>Time advances automatically every {(intervalSpeed / 1000).toFixed(1)}s</li>
              <li>Keep miss distance between {(minThreshold / 1000).toLocaleString()}k - {(maxThreshold / 1000).toLocaleString()}k km</li>
              <li>Earn points for improvements (1 pt per 10k km)</li>
            </ul>
          </div>
        </div>
      )}
    </div>

    {/* Game Over Modal */}
    {showModal && (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center" style={{ zIndex: 9999 }}>
        <div className={`bg-gray-900 rounded-lg shadow-2xl p-8 max-w-lg w-full mx-4 border-4 ${
          modalContent.isSuccess ? 'border-green-500' : 'border-red-500'
        }`}>
          <h2 className={`text-4xl font-bold mb-6 text-center ${
            modalContent.isSuccess ? 'text-green-400' : 'text-red-400'
          }`}>
            {modalContent.title}
          </h2>
          
          <div className="bg-gray-800 rounded-lg p-6 mb-6 space-y-3">
            {modalContent.message.split('\n\n').map((section, idx) => (
              <div key={idx} className="text-white">
                {section.split('\n').map((line, lineIdx) => (
                  <div key={lineIdx} className={lineIdx === 0 && idx > 0 ? 'font-bold text-lg mt-2' : 'text-base'}>
                    {line}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowModal(false);
                startGame();
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
            >
              Play Again
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                resetGame();
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
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