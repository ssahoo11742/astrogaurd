import { useState } from "react";

const menuStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --ember: #ff4500;
    --amber: #ffb347;
    --char:  #0d0a08;
    --coal:  #1a1410;
    --ash:   #2a2018;
    --smoke: #3d3028;
    --bone:  #f0e6d3;
    --dim:   #8a7060;
  }

  .menu-trigger {
    background: var(--char);
    border: 1px solid var(--ember);
    color: var(--ember);
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1rem;
    letter-spacing: 0.12em;
    cursor: pointer;
    padding: 7px 18px;
    border-radius: 4px;
    transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  }
  .menu-trigger:hover {
    background: var(--ember);
    color: var(--char);
    box-shadow: 0 0 20px rgba(255,69,0,0.4);
  }

  .menu-dialog {
    background: var(--coal);
    border: 1px solid rgba(255,69,0,0.25);
    border-radius: 8px;
    padding: 0;
    color: var(--bone);
    font-family: 'DM Mono', monospace;
    min-width: 300px;
    box-shadow: 0 0 60px rgba(0,0,0,0.8), 0 0 30px rgba(255,69,0,0.08);
  }

  .menu-dialog::backdrop {
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(4px);
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.25rem 0.75rem;
    border-bottom: 1px solid rgba(255,69,0,0.15);
  }

  .menu-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem;
    letter-spacing: 0.1em;
    color: var(--amber);
  }

  .menu-close {
    background: none;
    border: none;
    color: var(--dim);
    font-size: 1.1rem;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s, background 0.2s;
    font-family: monospace;
  }
  .menu-close:hover { color: var(--ember); background: rgba(255,69,0,0.1); }

  .menu-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
    padding: 1.1rem 1.25rem 1.25rem;
  }

  .menu-option {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.65rem 0.75rem;
    background: var(--ash);
    border: 1px solid rgba(255,69,0,0.1);
    border-radius: 5px;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
  }
  .menu-option:hover { border-color: rgba(255,69,0,0.3); background: var(--smoke); }

  .menu-checkbox {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid var(--dim);
    border-radius: 3px;
    background: var(--char);
    cursor: pointer;
    flex-shrink: 0;
    position: relative;
    transition: border-color 0.2s, background 0.2s;
  }
  .menu-checkbox:checked {
    background: var(--ember);
    border-color: var(--ember);
  }
  .menu-checkbox:checked::after {
    content: '✓';
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--char);
    font-size: 0.65rem;
    font-weight: bold;
  }

  .menu-label {
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--bone);
    cursor: pointer;
    user-select: none;
  }
`;



export const Menu = ({ setShowNEO, setShowPHA, showNEO, showComet, setShowComet }) => {
  return (
    <>
      <style>{menuStyles}</style>

      <button className="menu-trigger" onClick={() => document.getElementById("panel").showModal()}>
        ⚙ Control Panel
      </button>

      <dialog id="panel" className="menu-dialog">
        <div className="menu-header">
          <span className="menu-title">Control Panel</span>
          <form method="dialog">
            <button className="menu-close">✕</button>
          </form>
        </div>

        <div className="menu-body">
          <label className="menu-option">
            <input
              id="asteroids-checkbox"
              type="checkbox"
              defaultChecked={showNEO}
              onChange={(e) => setShowNEO(e.target.checked)}
              className="menu-checkbox"
            />
            <span className="menu-label">Asteroids</span>
          </label>

          <label className="menu-option">
            <input
              id="comets-checkbox"
              type="checkbox"
              defaultChecked={showComet}
              onChange={(e) => setShowComet(e.target.checked)}
              className="menu-checkbox"
            />
            <span className="menu-label">Comets</span>
          </label>

          <label className="menu-option">
            <input
              id="highlight-phas-checkbox"
              type="checkbox"
              onChange={(e) => setShowPHA(e.target.checked)}
              className="menu-checkbox"
            />
            <span className="menu-label">Highlight PHAs</span>
          </label>
        </div>
      </dialog>
    </>
  );
};