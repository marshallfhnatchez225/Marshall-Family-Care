import { forms } from "./form-data";
import { MarshallLogo } from "./marshall-logo";

const watermarkStyle = {
  position: "fixed" as const,
  right: "clamp(18px, 6vw, 88px)",
  bottom: "clamp(24px, 8vh, 96px)",
  width: 96,
  height: 96,
  opacity: 0.08,
  pointerEvents: "none" as const,
  transform: "scale(6.4)",
  transformOrigin: "bottom right",
  zIndex: 0
};

const completeStatuses = new Set<string>(["Reviewed"]);

export default function FamilyPreviewPage() {
  return (
    <main>
      <section
        aria-label="Preview mode notice"
        style={{
          borderBottom: "1px solid #ead7b1",
          background: "#fff8e8",
          color: "#3b111b",
          fontWeight: 700,
          padding: "12px 20px",
          textAlign: "center"
        }}
      >
        Preview mode for layout review only. No information is saved to a real family account.
      </section>
      <main className="family-portal">
        <div aria-hidden="true" style={watermarkStyle}>
          <MarshallLogo />
        </div>
        <aside className="family-sidebar" style={{ position: "relative", zIndex: 1 }}>
          <section className="family-case-card">
            <span className="family-status-chip">Arrangements in progress</span>
            <h2>Name of Loved One</h2>
            <p>Primary contact: Next of Kin</p>
            <p>Director: Marshall Funeral Home</p>
            <div className="family-progress-bar" aria-label="Form completion">
              <span style={{ width: "33%" }} />
            </div>
          </section>

          <nav className="family-sidebar-nav" aria-label="Family portal navigation">
            <a className="family-nav-button" href="#case-home">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Case home</span></span>
              <span className="family-mini-chip">Overview</span>
            </a>
            <a className="family-nav-button active" href="#pre-arrangement">
              <span className="family-nav-label"><span className="family-complete-indicator pending">-</span><span>Pre-Arrangement</span></span>
              <span className="family-mini-chip">33%</span>
            </a>
            <a className="family-nav-button" href="#post-arrangement">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Post-Arrangement</span></span>
              <span className="family-mini-chip">Current</span>
            </a>
            <a className="family-nav-button" href="#aftercare">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Aftercare</span></span>
              <span className="family-mini-chip">Support</span>
            </a>
          </nav>

          <div className="family-footer-note">
            Need immediate help? Call Marshall Funeral Home at (601) 442-6300 or (601) 384-2732.
          </div>
        </aside>

        <section className="family-content" style={{ position: "relative", zIndex: 1 }}>
          <section
            className="family-panel"
            id="case-home"
            style={{ alignItems: "center", display: "flex", gap: 16, justifyContent: "space-between", marginTop: 0 }}
          >
            <div>
              <span className="family-status-chip">Arrangements in progress</span>
              <p className="family-helper-text" style={{ margin: "8px 0 0" }}>Next requested action: review the death certificate information.</p>
            </div>
            <a className="family-primary-button" href="/family-preview/death-certificate">Open death certificate</a>
          </section>

          <section className="family-panel family-section-gap" id="pre-arrangement">
            <div className="family-task-list">
              {forms.map((form) => {
                const isComplete = completeStatuses.has(form.status);
                return (
                  <div className="family-task" key={form.id}>
                    <span className={isComplete ? "family-complete-indicator" : "family-complete-indicator pending"}>{isComplete ? "OK" : "-"}</span>
                    <div><strong>{form.title}</strong><div className="family-meta">{form.status}</div></div>
                    <a className="family-ghost-button" href={`/family-preview/${form.id}`}>Open</a>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="family-two-column family-section-gap" id="post-arrangement">
            <details className="family-panel">
              <summary style={{ cursor: "pointer", listStylePosition: "inside" }}><h2 style={{ display: "inline" }}>Post-Arrangement</h2></summary>
              <div className="family-data-list">
                <div className="family-data-row"><strong>Service</strong><span>To be added by staff</span></div>
                <div className="family-data-row"><strong>Location</strong><span>To be added by staff</span></div>
                <div className="family-data-row"><strong>Obituary</strong><span>Draft waiting on family confirmation</span></div>
                <div className="family-data-row"><strong>Death certificate</strong><span>Filed with the state</span></div>
              </div>
            </details>
            <details className="family-panel" id="aftercare">
              <summary style={{ cursor: "pointer", listStylePosition: "inside" }}><h2 style={{ display: "inline" }}>Aftercare</h2></summary>
              <div className="family-resource-list">
                <div className="family-resource-item"><strong>Death certificates</strong><span>Staff can update copy status here.</span></div>
                <div className="family-resource-item"><strong>Holiday flowers</strong><span>Families can request future flower assistance.</span></div>
                <div className="family-resource-item"><strong>Marker help</strong><span>Staff can help with headstone or marker requests.</span></div>
              </div>
            </details>
          </section>
        </section>
      </main>
    </main>
  );
}
