// src/components/ApproachAnalysis.js
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html} from "@react-three/drei";
import * as THREE from "three";
import { Asteroid, Earth as BodyEarth } from "../../Three-JS-Render/BodyPosition";
import "./style.css"
import { applyDeltaV, makeOrbitIntersectEarth,simulateKineticImpact} from "./transform";
import { Sidebar } from "./sidebar";
import { jdFromDate, parseSBDBDate, deg2rad, periodFromA, AU_SCALE, AU2KM } from "./utils";
import { generateOrbitPoints3D, getNextClosestApproach, generateMonteCarloCloud, EarthMoon, MonteCarloCloud} from "./utils_3d";
import { useLoader } from "@react-three/fiber";
import { GameMode } from './GameMode';
import { calculateMissDistance } from "./utils";

function SceneAnimation({
  earthRef,
  asteroidRef,
  controlsRef,
  orbitalElements,
  earthEpochJD,
  asteroidEpochJD,
  targetJD,
}) {
  useFrame(() => {
    if (!orbitalElements) return;

    const d_for_coords = targetJD - 2451543.5;

    const earthBody = new BodyEarth();
    const ecoords = earthBody.coordinates(d_for_coords);
    const earthPos = [ecoords.xeclip * AU_SCALE, ecoords.yeclip * AU_SCALE, ecoords.zeclip * AU_SCALE];

    if (asteroidRef.current) {
      const a = orbitalElements.a ?? 1;
      const e = orbitalElements.e ?? 0;
      const iDeg = orbitalElements.i * 180 / Math.PI;
      const omDeg = orbitalElements.om * 180 / Math.PI;
      const wDeg = orbitalElements.w * 180 / Math.PI;
      const Mdeg = orbitalElements.ma * 180 / Math.PI;

      const P = orbitalElements.P ?? periodFromA(a);

      const asteroidBody = new Asteroid(asteroidEpochJD, omDeg, iDeg, wDeg, a, e, Mdeg, P, "current-ast");
      const acoords = asteroidBody.coordinates(d_for_coords);
      const asteroidPos = [acoords.xeclip * AU_SCALE, acoords.yeclip * AU_SCALE, acoords.zeclip * AU_SCALE];

      asteroidRef.current.position.set(...asteroidPos);
    }

    if (earthRef.current) {
      earthRef.current.position.set(...earthPos);
    }

    if (controlsRef.current && earthRef.current) {
      controlsRef.current.target.copy(earthRef.current.position);
    }
  });
  return null;
}

export default function ApproachAnalysis({ data }) {
  const [onDeflectionCallback, setOnDeflectionCallback] = useState(null);
  const { name, designation, close_approaches: close_approach_data, sentry_data } = data || {};
  const [deltaV, setDeltaV] = useState({ x: 0, y: 0, z: 0 });
  const [show, setShow] = useState("Info");
  const [gameMode, setGameMode] = useState(false);
  const [dtDays, setDtDays] = useState(0);
  const [closestApproachDate, setClosestApproachDate] = useState(new Date());
  const [showModify, setShowModify] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [deltaVMag, setDeltaVMag] = useState(0);
  const [mode, setMode] = useState("first");
  const asteroidtexture = useLoader(THREE.TextureLoader, "/textures/asteroid.jpg");
  
  useEffect(() => {
    if (data?.close_approaches?.length > 0) {
      setClosestApproachDate(getNextClosestApproach(data.close_approaches));
    } else if (close_approach_data?.length > 0) {
      setClosestApproachDate(getNextClosestApproach(close_approach_data));
    }
    console.log("ApproachAnalysis data:", data);
  }, [data, close_approach_data]);

  const asteroidEpochJD = parseFloat(data.orbital_data?.epoch ?? Date.now() / 86400000 + 2440587.5);
  const earthEpochJD = 2451545.0;

  const targetJD = jdFromDate(new Date(closestApproachDate.getTime() + dtDays * 86400000));

  const earthRef = useRef();
  const asteroidRef = useRef();
  const controlsRef = useRef();

  const [overrideElements, setOverrideElements] = useState(null);

  const orbitalElementsFromData = () => {
    if (!data?.orbital_data) return null;

    const elementsMap = {};
    elementsMap.L_matrix = data.L_matrix;

    (data.orbital_data.elements || []).forEach((el) => {
      elementsMap[el.label] = parseFloat(el.value);
      if (el.label === "node") elementsMap.om = parseFloat(el.value);
      if (el.label === "peri") elementsMap.w = parseFloat(el.value);
      if (el.label === "M") elementsMap.ma = parseFloat(el.value);
      if (el.label === "a") elementsMap.a = parseFloat(el.value);
      if (el.label === "e") elementsMap.e = parseFloat(el.value);
      if (el.label === "i") elementsMap.i = parseFloat(el.value);
      if (el.label === "q") elementsMap.q = parseFloat(el.value);
    });

    const nominal = {};
    const cov = data.orbital_data?.covariance;
    if (cov?.labels) {
      cov.labels.forEach((lab) => {
        nominal[lab] = elementsMap[lab] ?? 0;
      });
    }

    const aVal = elementsMap.a ?? (elementsMap.q ? (elementsMap.q / (1 - (elementsMap.e ?? 0))) : 1);
    const eVal = elementsMap.e ?? 0;
    const iVal = deg2rad(elementsMap.i ?? 0);
    const omVal = deg2rad(elementsMap.node ?? elementsMap.om ?? 0);
    const wVal = deg2rad(elementsMap.peri ?? elementsMap.w ?? 0);
    const maVal = deg2rad(elementsMap.M ?? elementsMap.ma ?? 0);
    const P = data.orbital_data?.period ?? periodFromA(aVal);

    return {
      a: aVal,
      e: eVal,
      i: iVal,
      om: omVal,
      w: wVal,
      ma: maVal,
      P,
      cov: cov ?? null,
      nominal,
      elementsMap,
    };
  };

  const orbitalElements = useMemo(() => {
    const baseElements = orbitalElementsFromData();
    if (!baseElements) return null;
    return overrideElements ? { ...baseElements, ...overrideElements } : baseElements;
  }, [data, overrideElements]);

  const applyNewElements = (newElements) => {
    setOverrideElements(prev => ({
      ...(prev ?? orbitalElementsFromData()),
      ...newElements
    }));
  };

  const orbitPoints = useMemo(() => {
    if (!orbitalElements) return null;
    return generateOrbitPoints3D(orbitalElements, 200, asteroidEpochJD, targetJD, mode, "ASTEROID");
  }, [orbitalElements, asteroidEpochJD, targetJD]);

  const monteCarloPositions = useMemo(() => {
    if (!orbitalElements || !orbitalElements.elementsMap?.L_matrix) return null;
    return generateMonteCarloCloud(20000, orbitalElements, asteroidEpochJD, targetJD);
  }, [orbitalElements, asteroidEpochJD, targetJD]);
      
  if (!closestApproachDate) {
    return <div className="p-4 text-gray-500">Loading orbital data…</div>;
  }

  const earthOrbitalElements = {
    a: 1,
    e: 0.01673,
    i: 0,
    om: 0,
    w: deg2rad(102.93),
    ma: deg2rad(-2.46),
  };

  const closestApproachData = close_approach_data?.find(
    (ca) => parseSBDBDate(ca.close_approach_date).getTime() === closestApproachDate.getTime()
  );

  // Shared inline button style
  const btnStyle = {
    background: "#0d0a08",
    border: "1px solid rgba(255,69,0,0.35)",
    color: "#ff4500",
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "0.85rem",
    letterSpacing: "0.1em",
    padding: "4px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    flexShrink: 0,
  };

  return (
    <div className="main-container z-0">
      <div className="relative w-screen h-screen flex flex-col" style={{ background: "#0d0a08" }}>
        <Canvas camera={{ position: [0, 5, 20], fov: 60, zoom:10, far:10000 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[50, 50, 50]} intensity={1.2} />
          <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.05} />

          {/* Sun */}
          <mesh>
            <sphereGeometry args={[2, 32, 32]} />
            <meshStandardMaterial color="#ffb347" emissive="#ff6a00" emissiveIntensity={0.8} />
          </mesh>

          <EarthMoon earthRef={earthRef} />

          <mesh ref={asteroidRef}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial map={asteroidtexture} />
          </mesh>

          {orbitPoints && (
            <Line points={orbitPoints} color="#ff4500" lineWidth={2} transparent opacity={0.9} />
          )}

          {earthRef.current && asteroidRef.current && (
            <>
              <Line
                points={[
                  earthRef.current.position.toArray(),
                  asteroidRef.current.position.toArray(),
                ]}
                color="#ffb347"
                lineWidth={2}
                transparent
                opacity={0.9}
              />
              <Html
                position={[
                  (earthRef.current.position.x + asteroidRef.current.position.x) / 2,
                  (earthRef.current.position.y + asteroidRef.current.position.y) / 2,
                  (earthRef.current.position.z + asteroidRef.current.position.z) / 2,
                ]}
                center
              >
                <div style={{
                  background: "rgba(13,10,8,0.75)",
                  color: "#ffb347",
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "0.85rem",
                  letterSpacing: "0.08em",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255,179,71,0.25)",
                  whiteSpace: "nowrap",
                }}>
                  {(
                    earthRef.current.position.distanceTo(asteroidRef.current.position) *
                    (149_597_870.7 / 10)
                  ).toLocaleString(undefined, { maximumFractionDigits: 0 })} km
                </div>
              </Html>
            </>
          )}

          <Line
            points={generateOrbitPoints3D(earthOrbitalElements, 200, earthEpochJD, targetJD, mode, "EARTH")}
            color="#4fc3f7"
            lineWidth={2}
            transparent
            opacity={0.9}
          />

          {monteCarloPositions && <MonteCarloCloud positions={monteCarloPositions} />}

          <SceneAnimation
            earthRef={earthRef}
            asteroidRef={asteroidRef}
            controlsRef={controlsRef}
            orbitalElements={orbitalElements}
            earthEpochJD={earthEpochJD}
            asteroidEpochJD={asteroidEpochJD}
            targetJD={targetJD}
          />
        </Canvas>

        {/* Game Mode Panel - Bottom Left (only shows when active) */}
        <div 
          className="absolute bottom-4 p-4 rounded-lg flex flex-col items-center space-y-2 transition-all z-40"
          style={{
            width: gameMode ? '25%' : 'none',
            maxWidth: gameMode ? '25%' : 'none',
          }}
        >
          {gameMode && (
            <GameMode
              orbitalElements={orbitalElements}
              applyNewElements={applyNewElements}
              closestApproachDate={closestApproachDate}
              asteroidEpochJD={asteroidEpochJD}
              targetJD={targetJD}
              setDtDays={setDtDays}
              dtDays={dtDays}
              closestApproachData={closestApproachData}
              calculateMissDistance={(elements) => 
                calculateMissDistance(elements || orbitalElements, asteroidEpochJD, targetJD)
              }
              registerDeflectionCallback={setOnDeflectionCallback}
            />
          )}
        </div>

        {/* Propagation Slider */}
        <div 
          className="absolute bottom-4 p-4 rounded-lg flex flex-col items-center space-y-2 transition-all z-40"
          style={{
            transform: gameMode ? 'translateY(610%)' : 'none',
            width: '100%',
            maxWidth: '25%',
            background: "rgba(13,10,8,0.88)",
            border: "1px solid rgba(255,69,0,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#8a7060",
            margin: 0,
          }}>
            Propagation Time
          </p>
          <p style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.08em",
            color: "#ffb347",
            margin: 0,
          }}>
            {new Date(closestApproachDate.getTime() + dtDays * 86400000).toUTCString()}
          </p>
          
          <div className="flex items-center w-full space-x-2">
            <button style={btnStyle} onClick={() => setDtDays((prev) => Math.max(prev - 1, -30))}>
              &lt;
            </button>
            
            <input
              type="range"
              min={-30}
              max={30}
              value={dtDays}
              onChange={(e) => setDtDays(parseFloat(e.target.value))}
              step={0.1}
              className="flex-1"
              style={{ accentColor: "#ff4500" }}
            />
            
            <button style={btnStyle} onClick={() => setDtDays((prev) => Math.min(prev + 1, 30))}>
              &gt;
            </button>
            
            <button
              onClick={() => setGameMode(!gameMode)}
              style={{
                background: gameMode ? "#c0392b" : "#ff4500",
                border: "none",
                color: gameMode ? "#f0e6d3" : "#0d0a08",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "0.85rem",
                letterSpacing: "0.1em",
                padding: "4px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: gameMode ? "0 0 12px rgba(192,57,43,0.4)" : "0 0 12px rgba(255,69,0,0.35)",
              }}
            >
              {gameMode ? 'Exit Game' : 'Game Mode'}
            </button>
          </div>
        </div>

        {/* Sidebar - Top Right */}
        <div className="absolute top-0 right-0 z-50">
          <Sidebar
            onDeflectionAttempt={onDeflectionCallback}
            orbitalElements={orbitalElements}
            applyNewElements={applyNewElements}
            applyDeltaV={applyDeltaV}
            setDeltaV={setDeltaV}
            deltaV={deltaV}
            show={show}
            name={name}
            designation={designation}
            closestApproachDate={closestApproachDate}
            closestApproachData={closestApproachData}
            sentry_data={sentry_data}
            data={data}
            showModify={showModify}
            setShowModify={setShowModify}
            setShow={setShow}
            deltaVMag={deltaVMag}
            setDeltaVMag={setDeltaVMag}
          />
        </div>
      </div>
    </div>
  );
}