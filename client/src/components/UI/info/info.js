import { useState } from "react"

const infoBoxStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Crimson+Pro:wght@400;600&display=swap');

  :root {
    --ember: #ff4500;
    --amber: #ffb347;
    --char:  #0d0a08;
    --coal:  #1a1410;
    --ash:   #2a2018;
    --bone:  #f0e6d3;
    --dim:   #8a7060;
  }

  .infobox-card {
    background: rgba(13,10,8,0.88);
    border: 1px solid rgba(255,69,0,0.2);
    border-left: 3px solid #ff4500;
    border-radius: 6px;
    padding: 1.1rem 1.25rem;
    font-family: 'DM Mono', monospace;
    color: #f0e6d3;
    position: relative;
    min-width: 220px;
  }

  .infobox-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.3rem;
    letter-spacing: 0.08em;
    color: #ffb347;
    margin-bottom: 0.75rem;
    padding-right: 2rem;
  }

  .infobox-divider {
    border: none;
    border-top: 1px solid rgba(255,69,0,0.15);
    margin-bottom: 0.75rem;
  }

  .infobox-row {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    margin-bottom: 0.5rem;
  }

  .infobox-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #8a7060;
  }

  .infobox-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.1rem;
    letter-spacing: 0.05em;
    color: #f0e6d3;
  }

  .infobox-toggle {
    background: #0d0a08;
    border: 1px solid rgba(255,69,0,0.35);
    color: #ff4500;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
    flex-shrink: 0;
  }
  .infobox-toggle:hover {
    background: #ff4500;
    color: #0d0a08;
    box-shadow: 0 0 14px rgba(255,69,0,0.35);
  }

  .infobox-close {
    position: absolute;
    top: 0.9rem;
    right: 0.9rem;
  }
`;

export const InfoBox = ({ displayData }) => {
  const [show, setShow] = useState(true)

  return (
    <>
      <style>{infoBoxStyles}</style>

      {show ? (
        <div className="infobox-card">
          <div className="infobox-title">{displayData.name}</div>
          <button className="infobox-toggle infobox-close" onClick={() => setShow(false)}>
            &lt;
          </button>

          <hr className="infobox-divider" />

          <div className="infobox-row">
            <span className="infobox-label">Diameter (km)</span>
            <span className="infobox-value">{displayData.diameter ?? "—"}</span>
          </div>

          <div className="infobox-row">
            <span className="infobox-label">Orbital Period (d)</span>
            <span className="infobox-value">{displayData.orbPer ?? "—"}</span>
          </div>

          <div className="infobox-row">
            <span className="infobox-label">Rotational Period (h)</span>
            <span className="infobox-value">{displayData.rotPer ?? "—"}</span>
          </div>

          <div className="infobox-row">
            <span className="infobox-label">Orbit Producer</span>
            <span className="infobox-value">{displayData.producer ?? "—"}</span>
          </div>

          <div className="infobox-row">
            <span className="infobox-label">Geometric Albedo</span>
            <span className="infobox-value">{displayData.albedo ?? "—"}</span>
          </div>
        </div>
      ) : (
        <button className="infobox-toggle" onClick={() => setShow(true)}>
          &gt;
        </button>
      )}
    </>
  )
}