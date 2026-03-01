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

// enforce non-null > null
const getVal = (obj, key) => {
  const v = obj?.[key];
  return v !== undefined && v !== null ? Number(v) : null;
};



export const Search = ({ setLabeledBodies }) => {
  const [searchInput, setSearchInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [sortOption, setSortOption] = useState("size");
  const [sortOrder, setSortOrder] = useState("desc"); // NEW: asc/desc toggle
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
      // prioritize PHAs first
      if (aItem.type === "PHA" && bItem.type !== "PHA") return -1;
      if (bItem.type === "PHA" && aItem.type !== "PHA") return 1;
      return aItem.name.localeCompare(bItem.name) * (sortOrder === "asc" ? 1 : -1);
    default:
      return aItem.name.localeCompare(bItem.name) * (sortOrder === "asc" ? 1 : -1);
  }

  // handle nulls → always bottom (REGARDLESS of sort order)

  if ((valA === null || valA === 0 ) && valB !== null) return 1;
  if ((valB === null || valB === 0 ) && valA !== null) return -1;
  if ((valA === null || valA === 0 ) && (valA === null || valA === 0 )) return 0;

  // numeric compare with sort order applied
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
      <div className="fixed inset-0 bg-black text-white z-50 overflow-y-auto">
        <div className="p-6">
          <button
            onClick={() => setAnalysisTarget(null)}
            className="mb-4 px-6 py-2 bg-gray-700 rounded hover:bg-gray-600"
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
      <button
        onClick={() => setIsOpen((s) => !s)}
        className="z-50 fixed top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded shadow"
      >
        {isOpen ? "Close Search" : "Open Search"}
      </button>

      <div
        className={`fixed top-0 right-0 h-full w-96 bg-black bg-opacity-85 text-white shadow-lg transform transition-transform z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ margin: "0.5rem" }}
        ref={dropdownRef}
      >
        <div className="p-4 flex flex-col h-full">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search asteroids, comets, PHAs..."
            className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700"
          />

          {/* Sort Options */}
          <div className="mt-3 flex items-center space-x-2">
            <div className="flex-1">
              <label className="text-sm text-gray-300">Sort by</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-gray-900 text-white border border-gray-700"
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
              className="mt-5 px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            Showing {Math.min(100, filteredItems.length)} of {filteredItems.length}
          </div>

          {/* Item List */}
          <ul className="mt-3 overflow-y-auto flex-1 space-y-2 pr-2">
            {visible.map((item, idx) => {
              const raw = findRaw(item) || {};
              return (
                <li
                  key={idx}
                  className="p-2 bg-gray-800 rounded flex flex-col hover:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate font-medium">{item.name}</div>
                    <input
                      type="checkbox"
                      checked={!!item.checked}
                      onChange={() => toggleItem(item)}
                      className="w-4 h-4 ml-2"
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {item.type} • a: {raw.a || "—"} AU • dia: {raw.diameter || "—"} km • per:{" "}
                    {raw.per || "—"} d
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
                    className="mt-2 text-xs px-3 py-1 bg-blue-600 rounded hover:bg-blue-500"
                  >
                    Approach Analysis
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
