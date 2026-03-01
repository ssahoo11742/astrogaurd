import { Circle } from "react-leaflet";

// Gradient from green → yellow → red
const getGradientColor = (intensity, min = 7, max = 12) => {
  const clamped = Math.max(min, Math.min(max, intensity));

  // Apply logarithmic scaling (optional)
  // ratio = 0 for min, 1 for max
  const ratio = Math.log10(clamped) / Math.log10(max);

  let r, g, b = 0;
  if (ratio < 0.5) {
    // green → yellow
    r = Math.round(255 * (ratio * 2));
    g = 255;
  } else {
    // yellow → red
    r = 255;
    g = Math.round(255 * (1 - (ratio - 0.5) * 2));
  }
  return `rgb(${r},${g},${b})`;
};

export const IntensityMap = ({ impactLocation, magnitude }) => {
  if (!impactLocation) return null;

  const [lat, lon] = impactLocation;

  const intensityAtDistance = (M, R) => {
    return Math.max(1, 1.5 * M - 3 * Math.log10(R + 1) + 3);
  };

  const distances = [10, 30, 50, 100, 200, 400, 800, 1600]; // in km,

  return (
    <>
      {distances.map((d, idx) => {
        const intensity = intensityAtDistance(magnitude, d);
        const color = getGradientColor(intensity, 1, 10);

        return (
          <Circle
            key={idx}
            center={[lat, lon]}
            radius={d * 1000}
            pathOptions={{ color, fillOpacity: 0.2 }}
          />
        );
      })}
    </>
  );
};
