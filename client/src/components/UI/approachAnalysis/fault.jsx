// FaultLinesOverlay.jsx
import React, { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";

export const FaultLinesOverlay = ({ visible = true, color = "red", weight = 2, opacity = 0.8 }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!visible) return; // don’t load if not visible
    fetch("/gem_active_faults1.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load faultlines.geojson");
        return res.json();
      })
      .then((geojson) => setData(geojson))
      .catch((err) => console.error(err));
  }, [visible]);

  if (!visible || !data) return null;

  return (
    <GeoJSON
      data={data}
      style={{
        color,
        weight,
        opacity,
      }}
    />
  );
};
