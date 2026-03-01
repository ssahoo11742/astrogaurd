import { useTooltip } from "../../../TooltipContext";
import { Asteroid, Earth as BodyEarth } from "../../Three-JS-Render/BodyPosition";
export const MU_SUN = 2.959e-4; // AU^3 / day^2 (left here for reference if needed)
export const AU_SCALE = 10; // scale factor for visualization (same as before)
export const AU2KM = 1.495978707e8; // km
export const mu = 1.32712440018e11; // km^3/s^2
// --- Small helpers --- //
export function jdFromDate(date) {

  return 2440587.5 + date.getTime() / 86400000;
}

export function calculateMissDistance(orbitalElements, asteroidEpochJD, targetJD) {
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

// evaluation.js
export function evaluateMitigation(baselineMissKm, newMissKm) {
  const improvement = newMissKm - baselineMissKm;
  const score = Math.min(100, Math.max(0, (improvement / baselineMissKm) * 100));
  return {
    score: score.toFixed(1),
    improvement: improvement.toFixed(1)
  };
}


export const Tooltip = ({ text, children }) => {
  const { tooltipsEnabled } = useTooltip();

  return (
    <div className="relative group inline-block">
      {children}
      {tooltipsEnabled && (
        <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-black text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 min-w-[20rem] max-w-[32rem] break-words whitespace-normal leading-snug">
          {text}
        </div>
      )}
    </div>
  );
};





export function evaluateImpact(energyMt, affectedPopulation = 0) {
  const impactEnergyScore = Math.min(100, Math.log10(energyMt + 1) * 20);

  // Population contribution as additive score
  const popScore = Math.min(100, Math.log10(affectedPopulation + 1) * 10);

  const totalScore = Math.min(100, impactEnergyScore + popScore).toFixed(1);

  return {
    score: totalScore,
    details: {
      energyScore: impactEnergyScore.toFixed(1),
      popScore: popScore.toFixed(1)
    }
  };
}





export function parseSBDBDate(cd) {
  // SBDB style date strings like "2025-09-22 08:11"
  return new Date(cd + " UTC");
}



export function rad2deg(rad) {
  return (rad * 180) / Math.PI;
}

export function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

export function periodFromA(a) {
  // Kepler's third law approximation (days)
  return 365.256898326 * Math.pow(a, 1.5);
}


