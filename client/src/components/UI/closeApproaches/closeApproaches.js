const caStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&display=swap');

  :root {
    --ember: #ff4500;
    --amber: #ffb347;
    --char:  #0d0a08;
    --coal:  #1a1410;
    --ash:   #2a2018;
    --bone:  #f0e6d3;
    --dim:   #8a7060;
  }

  .ca-card {
    background: var(--coal);
    border: 1px solid rgba(255,69,0,0.2);
    border-left: 3px solid var(--ember);
    border-radius: 6px;
    padding: 1.25rem 1.5rem;
    font-family: 'DM Mono', monospace;
  }

  .ca-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem;
    letter-spacing: 0.1em;
    color: var(--amber);
    margin-bottom: 1rem;
  }

  .ca-row {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem;
    background: var(--ash);
    border-radius: 4px;
    border-left: 2px solid var(--ember);
    margin-bottom: 0.6rem;
  }

  .ca-row:last-child { margin-bottom: 0; }

  .ca-label {
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--dim);
  }

  .ca-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.25rem;
    letter-spacing: 0.05em;
    color: var(--bone);
  }
`;

export const CloseApproach = ({ closeApproachData }) => {
  const next = closeApproachData.next;
  const count = closeApproachData.count;

  return (
    <>
      <style>{caStyles}</style>
      <div className="ca-card">
        <div className="ca-title">Close Approach Data</div>

        <div className="ca-row">
          <span className="ca-label">Close Approaches Until 2100</span>
          <span className="ca-value">{count ?? "—"}</span>
        </div>

        <div className="ca-row">
          <span className="ca-label">Next Close Approach Date</span>
          <span className="ca-value">{next ?? "—"}</span>
        </div>
      </div>
    </>
  );
};