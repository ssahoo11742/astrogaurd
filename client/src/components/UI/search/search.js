// src/components/UI/search/search.js
import React, { useState, useEffect, useRef } from "react";
import { addLabel, removeLabel } from "../../Three-JS-Render/utils/label";
import { items, asteroidData, pha, cometData } from "../../Three-JS-Render/data/AsteroidData";
import data_asteroid from "../../Three-JS-Render/data/asteroids.json";
import data_comet from "../../Three-JS-Render/data/comets.json";
import data_pha from "../../Three-JS-Render/data/phas.json";
import { celestials } from "../../Three-JS-Render/AsteroidTracker";
import ApproachAnalysis from "../approachAnalysis/approachAnalysis";

// --- helpers ---
const normalize = (s) => (s || "").replace(/\s+/g, " ").trim();
const asteroidMap = new Map(data_asteroid.map((d) => [normalize(d.full_name), d]));
const phaMap = new Map(data_pha.map((d) => [normalize(d.full_name), d]));
const cometMap = new Map(data_comet.map((d) => [normalize(d.full_name), d]));

const findRaw = (item) => {
  const key = normalize(item.name);
  if (item.type === "Asteroid") return asteroidMap.get(key);
  if (item.type === "PHA") return phaMap.get(key);
  if (item.type === "Comet") return cometMap.get(key);
  return null;
};

const getVal = (obj, key) => {
  const v = obj?.[key];
  return v !== undefined && v !== null ? Number(v) : null;
};

export const Search = ({ setLabeledBodies }) => {
  const [searchInput, setSearchInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [sortOption, setSortOption] = useState("size");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filteredItems, setFilteredItems] = useState([]);
  const [analysisTarget, setAnalysisTarget] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const q = searchInput.trim().toLowerCase();
    let results = q
      ? items.filter((it) => it.name.toLowerCase().includes(q))
      : items.slice();

    results.sort((aItem, bItem) => {
      const ra = findRaw(aItem) || {};
      const rb = findRaw(bItem) || {};
      let valA, valB;

      switch (sortOption) {
        case "size":
          valA = getVal(ra, "diameter");
          valB = getVal(rb, "diameter");
          break;
        case "axis":
          valA = getVal(ra, "a");
          valB = getVal(rb, "a");
          break;
        case "period":
          valA = getVal(ra, "per");
          valB = getVal(rb, "per");
          break;
        case "approach":
          valA = getVal(ra, "tp") ?? getVal(ra, "epoch");
          valB = getVal(rb, "tp") ?? getVal(rb, "epoch");
          break;
        case "pha":
          if (aItem.type === "PHA" && bItem.type !== "PHA") return -1;
          if (bItem.type === "PHA" && aItem.type !== "PHA") return 1;
          return aItem.name.localeCompare(bItem.name) * (sortOrder === "asc" ? 1 : -1);
        default:
          return aItem.name.localeCompare(bItem.name) * (sortOrder === "asc" ? 1 : -1);
      }

      if ((valA === null || valA === 0) && valB !== null) return 1;
      if ((valB === null || valB === 0) && valA !== null) return -1;
      if ((valA === null || valA === 0) && (valA === null || valA === 0)) return 0;
      return (valA - valB) * (sortOrder === "asc" ? 1 : -1);
    });

    setFilteredItems(results);
  }, [searchInput, sortOption, sortOrder]);

  const toggleItem = (item) => {
    item.checked = !item.checked;
    let source = asteroidData;
    if (item.type === "PHA") source = pha;
    if (item.type === "Comet") source = cometData;

    if (item.checked) {
      addLabel(item.name, source, celestials, setLabeledBodies);
    } else {
      removeLabel(item.name, celestials, setLabeledBodies);
    }
    setFilteredItems((prev) => [...prev]);
  };

  const visible = filteredItems.slice(0, 100);

  // --- analysis mode ---
  if (analysisTarget) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "#0d0a08", color: "#f0e6d3" }}>
        <div className="p-6">
          <button
            onClick={() => setAnalysisTarget(null)}
            style={{
              background: "#0d0a08",
              border: "1px solid rgba(255,69,0,0.35)",
              color: "#f0e6d3",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.78rem",
              letterSpacing: "0.08em",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginBottom: "1.5rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            ← Back to Search
          </button>
          <ApproachAnalysis data={analysisTarget} />
        </div>
      </div>
    );
  }

  // --- default sidebar ---
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((s) => !s)}
        className="z-50 fixed top-4 right-4"
        style={{
          background: "#0d0a08",
          border: "1px solid #ff4500",
          color: "#ff4500",
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "0.95rem",
          letterSpacing: "0.12em",
          padding: "7px 16px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        {isOpen ? "✕ Close" : "⊕ Search"}
      </button>

      {/* Sidebar panel */}
      <div
        className={`fixed top-0 right-0 h-full w-96 shadow-lg transform transition-transform z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "rgba(13,10,8,0.96)",
          borderLeft: "1px solid rgba(255,69,0,0.2)",
          fontFamily: "'DM Mono', monospace",
          color: "#f0e6d3",
        }}
        ref={dropdownRef}
      >
        <div className="p-4 flex flex-col h-full" style={{ gap: "0.75rem" }}>

          {/* Search input */}
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search asteroids, comets, PHAs..."
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              background: "#2a2018",
              border: "1px solid rgba(255,69,0,0.2)",
              borderRadius: "4px",
              color: "#f0e6d3",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.82rem",
              outline: "none",
            }}
          />

          {/* Sort options */}
          <div className="flex items-end" style={{ gap: "0.5rem" }}>
            <div className="flex-1 flex flex-col" style={{ gap: "0.3rem" }}>
              <label style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#8a7060" }}>
                Sort by
              </label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.6rem",
                  background: "#2a2018",
                  border: "1px solid rgba(255,69,0,0.2)",
                  borderRadius: "4px",
                  color: "#f0e6d3",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.78rem",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="name">Name (A → Z)</option>
                <option value="size">Size (diameter)</option>
                <option value="axis">Semi-major axis (a)</option>
                <option value="period">Orbital period</option>
                <option value="approach">Next approach</option>
                <option value="pha">PHA first</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              style={{
                background: "#2a2018",
                border: "1px solid rgba(255,69,0,0.2)",
                color: "#ffb347",
                width: "34px",
                height: "34px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.85rem",
                flexShrink: 0,
              }}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {/* Count */}
          <div style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a7060" }}>
            Showing {Math.min(100, filteredItems.length)} of {filteredItems.length}
          </div>

          {/* Item list */}
          <ul className="overflow-y-auto flex-1" style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", paddingRight: "4px" }}>
            {visible.map((item, idx) => {
              const raw = findRaw(item) || {};
              return (
                <li
                  key={idx}
                  style={{
                    background: "#1a1410",
                    border: "1px solid rgba(255,69,0,0.1)",
                    borderLeft: "2px solid #ff4500",
                    borderRadius: "5px",
                    padding: "0.65rem 0.75rem",
                  }}
                >
                  <div className="flex items-center justify-between" style={{ gap: "0.5rem" }}>
                    <div style={{ fontSize: "0.8rem", color: "#f0e6d3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {item.name}
                    </div>
                    <input
                      type="checkbox"
                      checked={!!item.checked}
                      onChange={() => toggleItem(item)}
                      style={{ width: "15px", height: "15px", accentColor: "#ff4500", flexShrink: 0 }}
                    />
                  </div>
                  <div style={{ fontSize: "0.62rem", color: "#8a7060", marginTop: "0.3rem" }}>
                    <span style={{ color: "#ffb347", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", marginRight: "0.4rem" }}>
                      {item.type}
                    </span>
                    a: {raw.a || "—"} AU · dia: {raw.diameter || "—"} km · per: {raw.per || "—"} d
                  </div>
                  <button
                    onClick={async () => {
                      const pdes = raw.pdes || raw.des || raw.full_name;
                      const spk = raw.spkid;
                      if (!pdes) return;
                      try {
                        const res = await fetch("https://meteor-madness-server-wtu3.onrender.com/neo", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ pdes, spk }),
                        });
                        if (!res.ok) throw new Error(`API error: ${res.status}`);
                        const data = await res.json();
                        setAnalysisTarget(data);
                      } catch (err) {
                        console.error("Failed to fetch NEO data:", err);
                      }
                    }}
                    style={{
                      marginTop: "0.5rem",
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(255,69,0,0.3)",
                      color: "#ff4500",
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "0.8rem",
                      letterSpacing: "0.1em",
                      padding: "4px 0",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Approach Analysis →
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Search;