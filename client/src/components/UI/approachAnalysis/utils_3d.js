import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useState, useEffect } from "react";
import { Asteroid } from "../../Three-JS-Render/BodyPosition";
import { AU_SCALE, rad2deg, parseSBDBDate, periodFromA, } from "./utils";
import { useLoader } from "@react-three/fiber";


export function getNextClosestApproach(closeApproachData) {
  const now = Date.now();
  for (const ca of closeApproachData) {
    const date = parseSBDBDate(ca.close_approach_date);
    if (date.getTime() > now){ ;return date;}
  }
  // fallback to first entry if all are in the past
  if (closeApproachData?.length) return parseSBDBDate(closeApproachData[0].close_approach_date);
  return new Date();
}



// --- Orbit helpers using bodyposition classes --- //
/**
 * returns array of [x,y,z] (scaled) sampling the orbit using bodyposition.Asteroid
 * elements: { a, e, i (rad), om (rad RAAN), w (rad AOP), ma (rad mean anomaly), P? }
 * epochJD: epoch of elements (Julian Date)
 * targetJD: target julian date (used to compute the day value passed to .coordinates())
 */
export function generateOrbitPoints3D(elements, samples, epochJD, targetJD, mode, body) {

  const pts = [];
  // bodyposition expects:
  // - Asteroid constructor: (epochJD, RAANx, i, AOP, a, e, Mx, P, ...)
  //   where angles RAANx, i, AOP, Mx are in degrees and P is period in days.
  // - .coordinates(d) expects d = (JD - 2451543.5)  (days since J2000-ish)
  const d_for_coords = targetJD - 2451543.5;
  if(body !== "EARTH"){
    // elements.a = 1.914642865070079;
    // elements.e = 0.5583158905207618;
    // elements.i = 0.2129458828525513;
    // elements.om = 6.231965414138094;
    // elements.w = 3.9940244067084327;
    // elements.ma = 0.16166586619326107;
  }

  const a = elements.a ?? 1;
  const e = elements.e ?? 0;
  const iDeg = rad2deg(elements.i ?? 0);
  const omDeg = rad2deg(elements.om ?? 0);
  const wDeg = rad2deg(elements.w ?? 0);
  const P = elements.P ?? periodFromA(a);

  for (let i = 0; i < samples; i++) {
    // vary mean anomaly through 0-360 deg
    const Mdeg = (i / samples) * 360;
    const asteroidSample = new Asteroid(
      epochJD,
      omDeg, // RAAN
      iDeg, // inclination
      wDeg, // AOP
      a,
      e,
      Mdeg,
      P,
      "sample-orbit"
    );

    const { xeclip, yeclip, zeclip } = asteroidSample.coordinates(d_for_coords);
    pts.push([xeclip * AU_SCALE, yeclip * AU_SCALE, zeclip * AU_SCALE]);
  }
  // close the loop
  if (pts.length) pts.push(pts[0]);

  return pts;
}

/**
 * Create Monte Carlo cloud positions as Float32Array (n * 3) using covariance L_matrix and labels.
 * orbital: object that contains .elementsMap (with L_matrix), .cov.labels, .nominal, .a (fallback), etc.
 * epochJD, targetJD as Julian dates.
 */
export function generateMonteCarloCloud(n, orbital, epochJD, targetJD) {
  if (!orbital?.elementsMap?.L_matrix || !orbital?.cov?.labels || !orbital?.nominal) {
    console.warn("Missing covariance or nominal data for Monte Carlo cloud.");
    return null;
  }

  const labels = orbital.cov.labels;
  const L = orbital.elementsMap.L_matrix;
  const mu = labels.map((lab) => orbital.nominal[lab] ?? 0);
  const dim = labels.length;
  const positions = new Float32Array(n * 3);

  function gaussian() {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  for (let s = 0; s < n; s++) {
    // sample z ~ N(0,1)
    const z = Array.from({ length: dim }, () => gaussian());
    const sample = new Array(dim).fill(0);

    for (let r = 0; r < dim; r++) {
      let sum = 0;
      for (let c = 0; c < L[r].length; c++) sum += L[r][c] * z[c];
      sample[r] = mu[r] + sum;
    }

    const idx = (lab) => labels.indexOf(lab);

    // match expected cov labels used previously (e, q, node, peri, i, M, etc.)
    const eSample = sample[idx("e")] ?? orbital.nominal.e ?? 0;
    const qSample = sample[idx("q")] ?? orbital.nominal.q ?? null;
    const omSample = sample[idx("node")] ?? orbital.nominal.node ?? 0; // degrees
    const wSample = sample[idx("peri")] ?? orbital.nominal.peri ?? 0; // degrees
    const iSample = sample[idx("i")] ?? orbital.nominal.i ?? 0; // degrees
    const MSample = sample[idx("M")] ?? orbital.nominal.M ?? Math.random() * 360; // degrees

    const eClamped = Math.min(Math.max(eSample, 1e-6), 0.9999999);

    // compute semi-major a from q (perihelion distance) if available:
    const aSample = qSample && qSample > 0 ? qSample / (1 - eClamped) : orbital.a ?? (orbital.nominal.a ?? 1);

    const a = aSample;
    const e = eClamped;
    const iDeg = iSample;
    const omDeg = omSample;
    const wDeg = wSample;
    const Mdeg = MSample;

    const P = orbital.P ?? periodFromA(a);

    // create asteroid sample, bodyposition expects epochJD passed in (so it can compute day offset)
    const asteroidSample = new Asteroid(
      epochJD,
      omDeg,
      iDeg,
      wDeg,
      a,
      e,
      Mdeg,
      P,
      `mc-${s}`
    );

    const d_for_coords = targetJD - 2451543.5;
    const { xeclip, yeclip, zeclip } = asteroidSample.coordinates(d_for_coords);

    positions[s * 3 + 0] = xeclip * AU_SCALE;
    positions[s * 3 + 1] = yeclip * AU_SCALE;
    positions[s * 3 + 2] = zeclip * AU_SCALE;
  }

  return positions;
}

// --- Three.js subcomponents --- //
export function MonteCarloCloud({ positions }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  return (
    <points geometry={geom}>
      <pointsMaterial size={0.01} color="orange" transparent opacity={0.45} sizeAttenuation />
    </points>
  );
}

export function EarthMoon({ earthRef }) {
  const earthTexture = useLoader(THREE.TextureLoader, "/textures/earth_diffuse.jpg");
  return (
    <>
      <mesh ref={earthRef}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial map={earthTexture} />
      </mesh>
      <mesh position={[0.3, 0, 0]}>
        <sphereGeometry args={[0.027, 32, 32]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </>
  );
}
