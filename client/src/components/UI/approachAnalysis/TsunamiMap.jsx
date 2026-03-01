import { GeoJSON } from "react-leaflet";
import * as turf from "@turf/turf";
import { useMemo } from "react";

export const TsunamiOverlay = ({ center, tsunami, landPolygons, impactEffects }) => {
  const { circle, impactedOutlines } = useMemo(() => {
    if (!tsunami || tsunami.radius_km <= 0 || !landPolygons) {
      return { circle: null, impactedOutlines: [] };
    }



    const [lat, lon] = center;
    const circleFeature = turf.circle([lon, lat], 1200, { 
      units: "kilometers",
      steps: 12  // Reduced from 16 to 12 for fewer circle points
    });

    const bbox = turf.bbox(circleFeature);
    const outlines = [];

    (landPolygons.features || landPolygons).forEach((f) => {
      if (!f.geometry || !f.geometry.coordinates || f.geometry.coordinates.length === 0) return;

      try {
        const featureBbox = turf.bbox(f);
        if (!bboxOverlap(bbox, featureBbox)) return;
      } catch (err) {
        return;
      }

      let poly = null;
      try {
        if (f.geometry.type === "Polygon") {
          poly = turf.feature(f.geometry, f.properties);
        } else if (f.geometry.type === "MultiPolygon") {
          const coords = f.geometry.coordinates.filter(
            polygonRings => polygonRings && polygonRings.length > 0 && polygonRings[0] && polygonRings[0].length > 0
          );
          if (coords.length === 0) return;
          poly = turf.feature({ type: "MultiPolygon", coordinates: coords }, f.properties);
        } else {
          return;
        }
      } catch (err) {
        return;
      }

      if (!poly || !poly.geometry) return;

      // More aggressive simplification - increased tolerance significantly
      try {
        poly = turf.simplify(poly, { tolerance: 0.3, highQuality: false });
      } catch {}

      try {
        if (turf.booleanIntersects(circleFeature, poly)) {
          // Buffer the land polygon outward by 10km
          let buffered = null;
          try {
            // Use fewer steps for buffering to reduce computation
            buffered = turf.buffer(poly, 10, { units: "kilometers", steps: 8 });
          } catch {
            buffered = poly;
          }

          // Simplify the buffered polygon before intersection
          try {
            buffered = turf.simplify(buffered, { tolerance: 0.05, highQuality: false });
          } catch {}

          // Clip to only parts inside the circle, then subtract to get the coastline edge
          let clipped = null;
          try {
            clipped = turf.intersect(turf.featureCollection([buffered, circleFeature]));
          } catch {
            clipped = buffered;
          }

          // Subtract the original polygon to leave only the buffer ring
          let coastlineBuffer = null;
          try {
            coastlineBuffer = turf.difference(turf.featureCollection([clipped, poly]));
          } catch {
            coastlineBuffer = clipped;
          }

          if (coastlineBuffer && coastlineBuffer.geometry) {
            // Convert polygon to line (outline)
            try {
              const outline = turf.polygonToLine(coastlineBuffer);
              outlines.push(outline);
            } catch {}
          }
        }
      } catch {}
    });

    return { circle: circleFeature, impactedOutlines: outlines };
  }, [center?.[0], center?.[1], tsunami?.radius_km, landPolygons, impactEffects?.water]);

  if (!circle) return null;

  return (
    <>
      {/* <GeoJSON
        data={circle}
        style={{ color: "red", weight: 2, fillOpacity: 0 }}
      /> */}

      {impactedOutlines.map((outline, i) => (
        <GeoJSON
          key={`outline-${i}`}
          data={outline}
          style={{ color: "blue", weight: 3, fillOpacity: 1, opacity: 1 }}
        />
      ))}
    </>
  );
};

function bboxOverlap(bbox1, bbox2) {
  return !(
    bbox1[2] < bbox2[0] ||
    bbox1[0] > bbox2[2] ||
    bbox1[3] < bbox2[1] ||
    bbox1[1] > bbox2[3]
  );
}