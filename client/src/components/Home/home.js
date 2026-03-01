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

const Home = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Map & Explorer states
  const [markerPosition, setMarkerPosition] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [center, setCenter] = useState(null);
  const [landPolygons, setLandPolygons] = useState(null);

  // User input fields
  const [diameter, setDiameter] = useState(1000);
  const [density, setDensity] = useState(3000);
  const [velocity, setVelocity] = useState(20); // m/s
  const [energyLoss, setEnergyLoss] = useState(0);

  // Three.js background scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 200, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      alpha: true,
      antialias: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight/2);
    renderer.setClearColor(0x000000, 0);
    camera.position.z = 5;

    // Create asteroid field
    const asteroids = [];
    const asteroidGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const asteroidMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x888888,
      wireframe: true 
    });

    for (let i = 0; i < 30; i++) {
      const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);
      asteroid.position.x = (Math.random() - 0.5) * 20;
      asteroid.position.y = (Math.random() - 0.5) * 10;
      asteroid.position.z = (Math.random() - 0.5) * 10;
      asteroid.rotation.x = Math.random() * Math.PI;
      asteroid.rotation.y = Math.random() * Math.PI;
      asteroids.push(asteroid);
      scene.add(asteroid);
    }

    // Add stars
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 200; i++) {
      starVertices.push(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      asteroids.forEach((asteroid, i) => {
        asteroid.rotation.x += 0.001 * (i % 2 ? 1 : -1);
        asteroid.rotation.y += 0.002 * (i % 2 ? 1 : -1);
        asteroid.position.x += 0.01;
        if (asteroid.position.x > 10) asteroid.position.x = -10;
      });

      stars.rotation.z += 0.0002;
      
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      asteroidGeometry.dispose();
      asteroidMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
    };
  }, []);

  // Load land polygons
  useEffect(() => {
    fetch("/land.geojson")
      .then((res) => res.json())
      .then((data) => setLandPolygons(data))
      .catch(console.error);
  }, []);

  // Fetch impact effects from backend
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
          tsunami_data: {}, // you can later allow custom tsunami inputs
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

  // Leaflet marker component
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setMarkerPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
    return markerPosition ? <Marker position={markerPosition} /> : null;
  };

  // Slideshow data
  const isWater = impactData?.water ?? false;
  const impactEffects =
    impactData?.land_impact ?? impactData?.water_impact ?? null;

  const displaySections = impactData
    ? {
        Energy: {
          "Impact Energy (MT TNT)":
            Math.round(parseFloat(impactEffects.Energy?.entry_energy_mt), 2) ||
            impactEffects.Energy?.entry_energy_J / 4.184e15,
          "Energy Lost in Atmosphere (MT TNT)":
            impactEffects.Atmospheric_Entry?.energy_lost_mt,
        },
        "Atmospheric Entry": {
          "Impact Velocity (km/s)":
            impactEffects.Atmospheric_Entry?.ground_velocity_km_s,
          "Breakup Altitude (km)": impactEffects.Atmospheric_Entry
            ?.breakup_altitude_m
            ? (
                impactEffects.Atmospheric_Entry.breakup_altitude_m / 1000
              ).toFixed(1)
            : "Not Available",
        },
        "Population Affected": {
          "Causalties/Deaths":
            Math.round(parseFloat(impactData?.population)) ||
            "Not Available",
        },
        "Crater Dimensions": isWater
          ? {
              "Ocean Crater Diameter (km)":
                impactEffects.Crater_Dimensions?.ocean_crater_diameter_km,
              "Final Crater Diameter (km)":
                impactEffects.Crater_Dimensions?.final_crater_diameter_km,
            }
          : {
              "Final Crater Diameter (m)":
                impactEffects.Crater_Dimensions?.final_crater_diameter_m,
              "Final Crater Depth (m)":
                impactEffects.Crater_Dimensions?.final_crater_depth_m,
              "Breccia Thickness (m)":
                impactEffects.Crater_Dimensions?.breccia_thickness_m,
            },
        "Thermal Radiation": {
          "Fireball Radius (km)":
            impactEffects.Thermal_Radiation?.fireball_radius_km,
          "Duration of Irradiation (min)":
            impactEffects.Thermal_Radiation?.duration_irradiation_min,
        },
        "Air Blast": {
          "Peak Pressure (psi)":
            impactEffects.Air_Blast?.peak_overpressure_psi,
          "Max Wind Velocity (m/s)":
            impactEffects.Air_Blast?.max_wind_velocity_m_s,
          "Sound Intensity (dB)":
            impactEffects.Air_Blast?.sound_intensity_dB,
        },
        ...(isWater
          ? {
              Tsunami: {
                "Arrival Time (min)":
                  impactEffects.Tsunami_Wave?.arrival_time_min,
                "Wave Height (m)":
                  impactEffects.Tsunami_Wave?.wave_amplitude_max_m,
              },
            }
          : {}),
        "Seismic Effects": {
          "Arrival Time (s)": impactEffects.Seismic_Effects?.arrival_time_m,
          Thickness: impactEffects.Seismic_Effects?.thickness_cm,
          "Richter Scale":
            impactData?.richter_magnitude ?? "Not Available",
        },
      }
    : {};

  const sectionKeys = Object.keys(displaySections);
  const currentSectionKey = sectionKeys[slideIndex] ?? null;
  const currentSectionValues = currentSectionKey
    ? displaySections[currentSectionKey]
    : null;

  const prevSlide = () =>
    setSlideIndex((prev) => (prev - 1 + sectionKeys.length) % sectionKeys.length);
  const nextSlide = () =>
    setSlideIndex((prev) => (prev + 1) % sectionKeys.length);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
    <div className="relative bg-black text-white min-h-screen pb-10">
      {/* Fixed Background Gradient */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-r from-blue-900 via-black to-purple-900"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-20 bg-black bg-opacity-80 backdrop-blur-sm border-b border-gray-800 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Org Name */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🌍</span>
              </div>
<span className="text-xl font-bold">
  AstroGuard — <span className="italic text-sm font-normal">By Exoplaneteers</span>
</span>

            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => scrollToSection('explorer-section')}
                className="hover:text-blue-400 transition-colors"
              >
                Explorer
              </button>
              <button
                onClick={() => scrollToSection('impact-section')}
                className="hover:text-blue-400 transition-colors"
              >
                Impact Analysis
              </button>
              <button
                onClick={() => scrollToSection('live-section')}
                className="hover:text-blue-400 transition-colors"
              >
                Live NEO Data
              </button>
                            <button
                onClick={() => navigate("/info")}
                className="hover:text-blue-400 transition-colors"
              >
                Glossary
              </button>
              <button
                onClick={() => navigate("/3dinteractive")}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                3D View
              </button>

            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-gray-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Top Bar with 3D Background */}
      <div id="explorer-section" className="relative w-full h-[50rem] mb-6 overflow-hidden border-b border-white">
        {/* 3D Canvas Background */}
        <canvas 
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.6 }}
        />
        
        {/* Dark overlay for better text visibility */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">3D Asteroid Explorer</h1>
          <button
            onClick={() => navigate("/3dinteractive")}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Go to 3D Interactive
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6 max-w-4xl mx-auto">
        <h2 id="impact-section" className="text-3xl font-bold mb-4">Impact Explorer</h2>

        {/* Map Section */}
        <div className="rounded-xl shadow-sm mb-4">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <LocationMarker />
            <IntensityMap
              impactLocation={markerPosition}
              magnitude={impactData?.richter_magnitude || 0}
            />
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

        {/* Input Fields */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Diameter (m)</label>
            <input
              type="number"
              value={diameter}
              onChange={(e) => setDiameter(Number(e.target.value))}
              className="w-full p-2 rounded-lg text-black"
            />
          </div>
          <div>
            <label className="block mb-1">Density (kg/m³)</label>
            <input
              type="number"
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="w-full p-2 rounded-lg text-black"
            />
          </div>
          <div>
            <label className="block mb-1">Velocity (m/s)</label>
            <input
              type="number"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full p-2 rounded-lg text-black"
            />
          </div>
          <div>
            <label className="block mb-1">Energy Loss (J)</label>
            <input
              type="number"
              value={energyLoss}
              onChange={(e) => setEnergyLoss(Number(e.target.value))}
              className="w-full p-2 rounded-lg text-black"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={calculateImpactEffects}
          disabled={loading || !markerPosition}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-xl disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Calculate Impact Effects"}
        </button>

        {/* Results Section */}
        {impactData && sectionKeys.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">📊 Details</h3>
            <div className="p-4 border rounded-xl bg-gray-800">
              <h4 className="text-lg font-semibold mb-2">
                {currentSectionKey}
              </h4>
              {currentSectionValues &&
              Object.keys(currentSectionValues).length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {Object.entries(currentSectionValues).map(([label, value]) => (
                    <li key={label} className="flex justify-between">
                      <span className="font-medium">{label}:</span>
                      <span>{value ?? "N/A"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No data available</p>
              )}
            </div>

            {/* Slide Controls */}
            <div className="flex justify-center items-center mt-4 space-x-6">
              <button
                onClick={prevSlide}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                &larr;
              </button>
              <span className="text-gray-400">
                {slideIndex + 1} / {sectionKeys.length}
              </span>
              <button
                onClick={nextSlide}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                &rarr;
              </button>
            </div>
          </div>
        )}


        {/* Live NEO Section */}
        <div id="live-section" className="mt-10 live">
          <LiveNEOSection />
        </div>
        
      </div>
    </div>
    
    </>
    
  );
};

export default Home;