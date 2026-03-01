import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { IntensityMap } from "../UI/approachAnalysis/IntensityMap";
import { TsunamiOverlay } from "../UI/approachAnalysis/TsunamiMap";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as THREE from "three";
import LiveNEOSection from "./live";

// Fix Leaflet marker issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

/* ─────────────────────────────────────────────
   Injected global styles
───────────────────────────────────────────── */
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

  :root {
    --ember:   #ff4500;
    --amber:   #ffb347;
    --gold:    #ffd700;
    --rust:    #c0392b;
    --char:    #0d0a08;
    --coal:    #1a1410;
    --ash:     #2a2018;
    --smoke:   #3d3028;
    --bone:    #f0e6d3;
    --dim:     #8a7060;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--char);
    color: var(--bone);
    font-family: 'DM Mono', monospace;
  }

  /* Scanline grain overlay */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    background-image:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      );
  }

  .display-font { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.05em; }
  .serif { font-family: 'Crimson Pro', serif; }
  .mono { font-family: 'DM Mono', monospace; }

  /* Nav */
  .nav-bar {
    position: sticky;
    top: 0;
    z-index: 200;
    background: rgba(13, 10, 8, 0.92);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 69, 0, 0.25);
    padding: 0 2rem;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .nav-logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--ember), var(--rust));
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    box-shadow: 0 0 16px rgba(255,69,0,0.5);
  }

  .nav-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem;
    letter-spacing: 0.12em;
    color: var(--bone);
  }

  .nav-links {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .nav-btn {
    background: none;
    border: none;
    color: var(--dim);
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 0.2s;
    padding: 0;
  }
  .nav-btn:hover { color: var(--amber); }

  .nav-btn-accent {
    background: transparent;
    border: 1px solid var(--ember);
    color: var(--ember);
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 6px 14px;
    border-radius: 4px;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  }
  .nav-btn-accent:hover {
    background: var(--ember);
    color: var(--char);
    box-shadow: 0 0 20px rgba(255,69,0,0.4);
  }

  /* Hero */
  .hero {
    position: relative;
    width: 100%;
    height: 55vh;
    min-height: 380px;
    overflow: hidden;
    border-bottom: 1px solid rgba(255,69,0,0.2);
  }

  .hero-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.7;
  }

  .hero-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center bottom, rgba(255,69,0,0.08) 0%, rgba(13,10,8,0.55) 70%);
  }

  .hero-content {
    position: relative;
    z-index: 10;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .hero-eyebrow {
    font-family: 'DM Mono', monospace;
    font-size: 0.7rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--ember);
  }

  .hero-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3.5rem, 8vw, 7rem);
    letter-spacing: 0.06em;
    line-height: 1;
    color: var(--bone);
    text-shadow: 0 0 60px rgba(255,69,0,0.3);
  }

  .hero-title span {
    color: var(--ember);
  }

  .hero-sub {
    font-family: 'Crimson Pro', serif;
    font-size: 1.1rem;
    color: var(--dim);
    font-style: italic;
    margin-top: 0.25rem;
  }

  /* Main layout */
  .main {
    max-width: 900px;
    margin: 0 auto;
    padding: 3rem 1.5rem 6rem;
  }

  /* Section headers */
  .section-header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid rgba(255,69,0,0.15);
    padding-bottom: 0.75rem;
  }

  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--ember);
  }

  .section-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 2.2rem;
    letter-spacing: 0.05em;
    color: var(--bone);
  }

  /* Map */
  .map-wrapper {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,69,0,0.2);
    margin-bottom: 2rem;
    box-shadow: 0 0 40px rgba(255,69,0,0.06);
  }

  /* Input grid */
  .input-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  @media (max-width: 600px) {
    .input-grid { grid-template-columns: 1fr; }
    .nav-links { display: none; }
  }

  .field-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .field-label {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .field-input {
    background: var(--ash);
    border: 1px solid rgba(255,69,0,0.2);
    border-radius: 4px;
    color: var(--bone);
    font-family: 'DM Mono', monospace;
    font-size: 0.9rem;
    padding: 0.6rem 0.75rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }
  .field-input:focus {
    border-color: var(--ember);
    box-shadow: 0 0 0 3px rgba(255,69,0,0.12);
  }

  /* Calculate button */
  .calc-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, var(--ember), var(--rust));
    border: none;
    border-radius: 6px;
    color: var(--bone);
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.1rem;
    letter-spacing: 0.12em;
    cursor: pointer;
    padding: 0.7rem 1.8rem;
    transition: opacity 0.2s, box-shadow 0.2s, transform 0.1s;
    box-shadow: 0 0 24px rgba(255,69,0,0.3);
  }
  .calc-btn:hover:not(:disabled) {
    box-shadow: 0 0 40px rgba(255,69,0,0.5);
    transform: translateY(-1px);
  }
  .calc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Results slideshow */
  .results-card {
    margin-top: 2.5rem;
    border: 1px solid rgba(255,69,0,0.2);
    border-radius: 8px;
    overflow: hidden;
    background: var(--coal);
  }

  .results-header {
    background: linear-gradient(90deg, var(--ash), var(--coal));
    padding: 0.9rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255,69,0,0.2);
  }

  .results-section-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem;
    letter-spacing: 0.1em;
    color: var(--amber);
  }

  .results-counter {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: var(--dim);
  }

  .results-body {
    padding: 1.25rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 500px) {
    .results-body { grid-template-columns: 1fr; }
  }

  .stat-row {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem;
    background: var(--ash);
    border-radius: 5px;
    border-left: 2px solid var(--ember);
  }

  .stat-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .stat-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.35rem;
    color: var(--bone);
    letter-spacing: 0.05em;
  }

  /* Slide controls */
  .slide-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
    padding: 1rem;
    border-top: 1px solid rgba(255,69,0,0.12);
  }

  .slide-arrow {
    background: var(--ash);
    border: 1px solid rgba(255,69,0,0.2);
    color: var(--amber);
    width: 36px;
    height: 36px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.2s, box-shadow 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .slide-arrow:hover {
    background: rgba(255,69,0,0.15);
    box-shadow: 0 0 12px rgba(255,69,0,0.2);
  }

  .slide-dots {
    display: flex;
    gap: 5px;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--smoke);
    transition: background 0.2s;
  }
  .dot.active { background: var(--ember); }

  /* Live section */
  .live-section {
    margin-top: 5rem;
    padding-top: 3rem;
    border-top: 1px solid rgba(255,69,0,0.15);
  }

  /* Loading pulse */
  @keyframes pulse-ember {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  .loading-pulse { animation: pulse-ember 1.2s ease-in-out infinite; }
`;

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */
const Home = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const [markerPosition, setMarkerPosition] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [center, setCenter] = useState(null);
  const [landPolygons, setLandPolygons] = useState(null);

  const [diameter, setDiameter] = useState(1000);
  const [density, setDensity] = useState(3000);
  const [velocity, setVelocity] = useState(20);
  const [energyLoss, setEnergyLoss] = useState(0);

  /* Inject styles */
  useEffect(() => {
    const tag = document.createElement("style");
    tag.textContent = globalStyles;
    document.head.appendChild(tag);
    return () => document.head.removeChild(tag);
  }, []);

  /* Three.js hero */
  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, canvasRef.current.parentElement?.clientHeight || 500);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 5;

    const asteroids = [];
    for (let i = 0; i < 35; i++) {
      const geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.12, 6, 6);
      const mat = new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xff4500 : i % 3 === 1 ? 0xffb347 : 0x5a3820,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 22, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      asteroids.push({ mesh, speed: 0.005 + Math.random() * 0.015 });
      scene.add(mesh);
    }

    const starGeo = new THREE.BufferGeometry();
    const verts = [];
    for (let i = 0; i < 300; i++) {
      verts.push((Math.random() - 0.5) * 60, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 20);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffd7a0, size: 0.04 });
    scene.add(new THREE.Points(starGeo, starMat));

    let frame;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      asteroids.forEach(({ mesh, speed }, i) => {
        mesh.rotation.x += speed * (i % 2 ? 1 : -1);
        mesh.rotation.y += speed * 1.5 * (i % 2 ? 1 : -1);
        mesh.position.x += 0.008;
        if (mesh.position.x > 11) mesh.position.x = -11;
      });
      renderer.render(scene, camera);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  /* Land polygons */
  useEffect(() => {
    fetch("/land.geojson").then(r => r.json()).then(setLandPolygons).catch(console.error);
  }, []);

  /* Fetch impact */
  const calculateImpactEffects = async () => {
    if (!markerPosition) return;
    setLoading(true);
    try {
      const res = await fetch("https://meteor-madness-server-wtu3.onrender.com/impact_effects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coords: markerPosition,
          diameter_m: diameter,
          density_kg_m3: Math.round(density),
          velocity_m_s: velocity,
          energy_loss: energyLoss,
          tsunami_data: {},
        }),
      });
      const json = await res.json();
      setImpactData(json);
      setSlideIndex(0);
      setCenter(markerPosition);
    } catch (err) {
      console.error(err);
      alert("Failed to calculate impact effects");
    }
    setLoading(false);
  };

  /* Map marker */
  const LocationMarker = () => {
    useMapEvents({
      click(e) { setMarkerPosition([e.latlng.lat, e.latlng.lng]); },
    });
    return markerPosition ? <Marker position={markerPosition} /> : null;
  };

  const isWater = impactData?.water ?? false;
  const impactEffects = impactData?.land_impact ?? impactData?.water_impact ?? null;

  const displaySections = impactData && impactEffects ? {
    Energy: {
      "Impact Energy (MT TNT)": Math.round(parseFloat(impactEffects.Energy?.entry_energy_mt), 2) || impactEffects.Energy?.entry_energy_J / 4.184e15,
      "Energy Lost in Atmosphere": impactEffects.Atmospheric_Entry?.energy_lost_mt,
    },
    "Atmospheric Entry": {
      "Ground Velocity (km/s)": impactEffects.Atmospheric_Entry?.ground_velocity_km_s,
      "Breakup Altitude (km)": impactEffects.Atmospheric_Entry?.breakup_altitude_m ? (impactEffects.Atmospheric_Entry.breakup_altitude_m / 1000).toFixed(1) : "—",
    },
    "Casualties": {
      "Population Affected": Math.round(parseFloat(impactData?.population)) || "—",
      "Richter Magnitude": impactData?.richter_magnitude ?? "—",
    },
    "Crater": isWater
      ? { "Ocean Crater Diameter (km)": impactEffects.Crater_Dimensions?.ocean_crater_diameter_km, "Final Crater Diameter (km)": impactEffects.Crater_Dimensions?.final_crater_diameter_km }
      : { "Final Crater Diameter (m)": impactEffects.Crater_Dimensions?.final_crater_diameter_m, "Final Crater Depth (m)": impactEffects.Crater_Dimensions?.final_crater_depth_m },
    "Thermal": {
      "Fireball Radius (km)": impactEffects.Thermal_Radiation?.fireball_radius_km,
      "Duration of Irradiation (min)": impactEffects.Thermal_Radiation?.duration_irradiation_min,
    },
    "Air Blast": {
      "Peak Pressure (psi)": impactEffects.Air_Blast?.peak_overpressure_psi,
      "Max Wind Velocity (m/s)": impactEffects.Air_Blast?.max_wind_velocity_m_s,
      "Sound Intensity (dB)": impactEffects.Air_Blast?.sound_intensity_dB,
    },
    ...(isWater ? { Tsunami: { "Arrival Time (min)": impactEffects.Tsunami_Wave?.arrival_time_min, "Wave Height (m)": impactEffects.Tsunami_Wave?.wave_amplitude_max_m } } : {}),
    Seismic: {
      "Arrival Time (s)": impactEffects.Seismic_Effects?.arrival_time_m,
      "Richter Scale": impactData?.richter_magnitude ?? "—",
    },
  } : {};

  const sectionKeys = Object.keys(displaySections);
  const currentKey = sectionKeys[slideIndex];
  const currentValues = currentKey ? displaySections[currentKey] : null;
  const prevSlide = () => setSlideIndex(p => (p - 1 + sectionKeys.length) % sectionKeys.length);
  const nextSlide = () => setSlideIndex(p => (p + 1) % sectionKeys.length);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div style={{ background: "var(--char)", minHeight: "100vh" }}>
      {/* NAV */}
      <nav className="nav-bar">
        <div className="nav-logo">
          <div className="nav-logo-icon">☄️</div>
          <span className="nav-title">Golden Dome</span>
        </div>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => scrollTo("explorer-section")}>Explorer</button>
          <button className="nav-btn" onClick={() => scrollTo("impact-section")}>Impact Analysis</button>
          <button className="nav-btn" onClick={() => scrollTo("live-section")}>Live NEO</button>
          <button className="nav-btn" onClick={() => navigate("/info")}>Glossary</button>
          <button className="nav-btn-accent" onClick={() => navigate("/3dinteractive")}>3D View</button>
        </div>
      </nav>

      {/* HERO */}
      <section id="explorer-section" className="hero">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="hero-eyebrow">Planetary Defense System</span>
          <h1 className="hero-title">
            <span style={{ color: "var(--amber)", textShadow: "0 0 60px rgba(255,179,71,0.5)" }}>GOLDEN</span>DOME
          </h1>
          <button className="nav-btn-accent" onClick={() => navigate("/3dinteractive")}>Go to 3D Interactive</button>
          <p className="hero-sub">Near-Earth Object Analysis &amp; Simulation</p>
        </div>
      </section>

      {/* MAIN */}
      <main className="main">

        {/* Impact Explorer */}
        <div className="section-header" id="impact-section" style={{ marginTop: "1rem" }}>
          <span className="section-label">01</span>
          <h2 className="section-title">Impact Explorer</h2>
        </div>

        {/* Map */}
        <div className="map-wrapper">
          <MapContainer center={[20, 0]} zoom={2} style={{ height: "400px", width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <LocationMarker />
            <IntensityMap impactLocation={markerPosition} magnitude={impactData?.richter_magnitude || 0} />
            {impactData?.tsunami && (
              <TsunamiOverlay
                key={`${center?.[0]}-${center?.[1]}-${impactData?.tsunami?.radius_km}`}
                center={center}
                tsunami={impactData.tsunami}
                landPolygons={landPolygons}
              />
            )}
          </MapContainer>
        </div>

        {/* Inputs */}
        <div className="input-grid">
          {[
            { label: "Diameter (m)", value: diameter, set: setDiameter },
            { label: "Density (kg/m³)", value: density, set: setDensity },
            { label: "Velocity (m/s)", value: velocity, set: setVelocity },
            { label: "Energy Loss (J)", value: energyLoss, set: setEnergyLoss },
          ].map(({ label, value, set }) => (
            <div className="field-wrap" key={label}>
              <label className="field-label">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => set(Number(e.target.value))}
                className="field-input"
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={calculateImpactEffects} disabled={loading || !markerPosition} className="calc-btn">
          {loading ? (
            <span className="loading-pulse">Calculating…</span>
          ) : (
            <>☄️ Calculate Impact</>
          )}
        </button>

        {!markerPosition && (
          <p style={{ marginTop: "0.6rem", fontSize: "0.7rem", color: "var(--dim)", letterSpacing: "0.1em" }}>
            ↑ Click the map to set an impact location
          </p>
        )}

        {/* Results */}
        {impactData && sectionKeys.length > 0 && (
          <div className="results-card">
            <div className="results-header">
              <span className="results-section-name">{currentKey}</span>
              <span className="results-counter mono">{slideIndex + 1} / {sectionKeys.length}</span>
            </div>

            <div className="results-body">
              {currentValues && Object.entries(currentValues).map(([label, value]) => (
                <div className="stat-row" key={label}>
                  <span className="stat-label">{label}</span>
                  <span className="stat-value">{value ?? "N/A"}</span>
                </div>
              ))}
            </div>

            <div className="slide-controls">
              <button className="slide-arrow" onClick={prevSlide}>←</button>
              <div className="slide-dots">
                {sectionKeys.map((_, i) => (
                  <div key={i} className={`dot${i === slideIndex ? " active" : ""}`} />
                ))}
              </div>
              <button className="slide-arrow" onClick={nextSlide}>→</button>
            </div>
          </div>
        )}

        {/* Live NEO */}
        <div id="live-section" className="live-section">
          <div className="section-header">
            <span className="section-label">02</span>
            <h2 className="section-title">Live NEO Data</h2>
          </div>
          <LiveNEOSection />
        </div>

      </main>
    </div>
  );
};

export default Home;