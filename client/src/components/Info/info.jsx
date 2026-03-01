const infoStyles = `
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

  .info-page {
    background: var(--char);
    min-height: 100vh;
    padding: 4rem 1.5rem 6rem;
    font-family: 'DM Mono', monospace;
    color: var(--bone);
  }

  .info-page::before {
    content: '';
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px
    );
  }

  .info-inner {
    position: relative;
    z-index: 1;
    max-width: 760px;
    margin: 0 auto;
  }

  .info-eyebrow {
    display: block;
    text-align: center;
    font-size: 0.65rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--ember);
    margin-bottom: 0.5rem;
  }

  .info-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(2.8rem, 7vw, 5rem);
    letter-spacing: 0.06em;
    text-align: center;
    color: var(--bone);
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .info-title span { color: var(--amber); text-shadow: 0 0 40px rgba(255,179,71,0.4); }

  .info-sub {
    font-family: 'Crimson Pro', serif;
    font-style: italic;
    font-size: 1.05rem;
    color: var(--dim);
    text-align: center;
    margin-bottom: 3rem;
  }

  .info-divider {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, var(--ember), transparent);
    margin: 0 auto 3rem;
  }

  .info-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .info-card {
    background: var(--coal);
    border: 1px solid rgba(255,69,0,0.15);
    border-left: 3px solid var(--ember);
    border-radius: 6px;
    padding: 1rem 1.25rem;
    transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
    cursor: default;
  }

  .info-card:hover {
    background: var(--ash);
    border-left-color: var(--amber);
    box-shadow: 0 0 24px rgba(255,69,0,0.08);
  }

  .info-term {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.15rem;
    letter-spacing: 0.08em;
    color: var(--amber);
    margin-bottom: 0.35rem;
  }

  .info-def {
    font-family: 'Crimson Pro', serif;
    font-size: 1rem;
    line-height: 1.65;
    color: var(--bone);
    opacity: 0.85;
  }
`;

export default function InfoPage() {
  const terms = [
    { term: "Δv (Delta-V)", definition: "A measure of how much change in velocity is required to alter an object's trajectory. In asteroid deflection, higher Δv means a stronger push or pull needed to move it off-course." },
    { term: "MOID (Minimum Orbit Intersection Distance)", definition: "The smallest possible distance between Earth's orbit and an asteroid's orbit. A smaller MOID indicates a higher potential for collision." },
    { term: "Palermo Scale", definition: "A logarithmic scale used to compare the likelihood of a potential impact with the background risk of impacts from random objects. Positive values indicate unusually high risks." },
    { term: "Eccentricity", definition: "Describes how stretched an orbit is. A value of 0 is a perfect circle, while values approaching 1 indicate a highly elongated orbit." },
    { term: "Inclination", definition: "The tilt of an orbit relative to Earth's orbital plane. Higher inclination means the orbit is more tilted compared to Earth's orbit." },
    { term: "Semi-Major Axis", definition: "Half the longest axis of an elliptical orbit. It defines the overall size of the orbit and its average distance from the Sun." },
    { term: "Impact Energy (MT TNT)", definition: "The total energy released during impact, measured in megatons of TNT. It's a measure of destructive potential, combining mass and velocity." },
    { term: "Energy Lost in Atmosphere (MT TNT)", definition: "The amount of kinetic energy dissipated as heat and shock while the asteroid travels through the atmosphere before hitting the ground." },
    { term: "Impact Velocity (km/s)", definition: "The final speed of the asteroid or its fragments when they reach Earth's surface after atmospheric deceleration." },
    { term: "Breakup Altitude (km)", definition: "The height above the ground where the asteroid begins to fragment due to aerodynamic stress exceeding its structural strength." },
    { term: "Casualties/Deaths", definition: "Estimated human fatalities or severe injuries resulting from blast waves, thermal radiation, or secondary effects of the impact." },
    { term: "Final Crater Diameter (m/km)", definition: "The diameter of the final crater after the collapse of the transient cavity and debris settling." },
    { term: "Crater Depth (m)", definition: "The vertical distance from the crater rim to the floor, indicating the energy and scale of the impact." },
    { term: "Breccia Thickness (m)", definition: "The depth of fragmented rock and debris that fills the crater floor after impact." },
    { term: "Fireball Radius (km)", definition: "The distance from the impact point within which intense heat causes severe burns and ignition of materials." },
    { term: "Duration of Irradiation (min)", definition: "The length of time the area near the impact is exposed to dangerous levels of thermal radiation." },
    { term: "Peak Pressure (psi)", definition: "The highest pressure in the shockwave produced by the explosion. 5 psi is enough to destroy most residential structures." },
    { term: "Max Wind Velocity (m/s)", definition: "The top wind speeds generated by the air blast. Extremely high winds can uproot trees and demolish buildings." },
    { term: "Sound Intensity (dB)", definition: "The loudness of the impact's air blast. Sounds above 130 dB cause immediate hearing damage." },
    { term: "Tsunami Arrival Time (min)", definition: "The time it takes for tsunami waves generated by a water impact to reach nearby coastlines." },
    { term: "Tsunami Wave Height (m)", definition: "The maximum height of tsunami waves created by an ocean impact event." },
    { term: "Seismic Effects - Arrival Time (s)", definition: "The time it takes for seismic waves from the impact to reach a given location." },
    { term: "Seismic Effects - Thickness (cm)", definition: "The thickness of debris and ejecta deposited by the impact's seismic activity." },
    { term: "Richter Scale", definition: "A logarithmic measure of earthquake magnitude. Each whole number represents a tenfold increase in amplitude." },
    { term: "Population Affected", definition: "The number of people living within the area directly affected by the impact and secondary effects like fire and shockwaves." },
    { term: "Disaster Score", definition: "A composite severity score from 0–100 that considers both impact energy and affected population to represent total devastation potential." },
    { term: "Gravity Tractor", definition: "A spacecraft that hovers near an asteroid and uses its own gravity to slowly alter the asteroid's trajectory." },
    { term: "Kinetic Impactor", definition: "A spacecraft designed to collide directly with an asteroid at high speed, transferring momentum to change its orbit." },
    { term: "Laser Ablation", definition: "A planetary defense technique that uses high-powered lasers to vaporize material from an asteroid's surface. The escaping vapor creates thrust, gradually altering the asteroid's trajectory." },
    { term: "Ablation Thrust", definition: "The small reactive force produced when material is vaporized and ejected from an asteroid's surface. It pushes the asteroid in the opposite direction, changing its orbit over time." },
    { term: "Laser Power (MW)", definition: "The output power of the laser system measured in megawatts. Higher power increases the rate of surface vaporization and the overall deflection effect." },
    { term: "Efficiency (η)", definition: "A dimensionless factor (typically 0.2–0.6) representing how effectively absorbed laser energy is converted into kinetic energy of the escaping vapor." },
    { term: "Ablation Rate", definition: "The amount of material vaporized per second from the asteroid's surface, directly influenced by laser power, absorption, and efficiency." },
    { term: "Plume", definition: "The stream of gas and particles ejected from the asteroid during laser ablation. Its direction and speed determine the net thrust imparted to the asteroid." },
    { term: "Duration (days)", definition: "The total period during which the laser system is active. A longer firing duration allows more cumulative thrust and a greater change in the asteroid's orbit." },
    { term: "Direction", definition: "The orientation of the ablation jet relative to the asteroid's orbital motion. Along Velocity pushes it forward or backward, Radial points toward or away from the Sun, and Normal acts perpendicular to the orbital plane." },
    { term: "Energy Absorption", definition: "The fraction of laser energy absorbed by the asteroid surface. Dark surfaces absorb more energy, making ablation more efficient." },
    { term: "Thermal Conduction Loss", definition: "Heat loss through the asteroid's material that does not contribute to vaporization. Lower conduction increases the efficiency of laser ablation." },
    { term: "Spot Size", definition: "The diameter of the laser beam where it hits the asteroid. Smaller spot sizes concentrate energy, raising local temperatures and increasing the ablation rate." },
    { term: "Tectonic Fault Lines", definition: "Cracks in Earth's crust where earthquakes occur. These can amplify seismic effects if an impact happens nearby." },
    { term: "Population Density Layer", definition: "A map overlay that visualizes how many people live per unit area, highlighting high-risk zones for impact." },
    { term: "Atmospheric Entry", definition: "The process of the asteroid entering Earth's atmosphere, losing speed and energy due to frictional heating and air resistance." },
    { term: "Energy Yield (Joules / Megatons)", definition: "The total energy release from impact or explosion, expressed in either joules or TNT equivalent." },
  ];

  return (
    <>
      <style>{infoStyles}</style>
      <div className="info-page">
        <div className="info-inner">
          <span className="info-eyebrow">Reference Guide</span>
          <h1 className="info-title"><span>GOLDEN</span> DOME</h1>
          <p className="info-sub">Asteroid Impact &amp; Deflection Glossary</p>
          <div className="info-divider" />

          <div className="info-grid">
            {terms.map(({ term, definition }) => (
              <div className="info-card" key={term}>
                <div className="info-term">{term}</div>
                <p className="info-def">{definition}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}