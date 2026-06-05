const forms = [
  ["Death Certificate Information", "Needs review"],
  ["Obituary Information", "Draft saved"],
  ["Permission To Embalm", "Not submitted"],
  ["General Family Information", "Reviewed"],
  ["Next Of Kin Information", "Needs clarification"],
  ["Veteran, Church, Cemetery Details", "Draft saved"]
];

const deathCertificateStages = [
  "Not started",
  "Information needed from family",
  "Ready for staff review",
  "Filed with the state",
  "Waiting on state approval",
  "Certified copies ordered",
  "Certified copies ready for pickup",
  "Completed"
];

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
        <aside className="family-sidebar">
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
            <a className="family-nav-button active" href="#case-home">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Case home</span></span>
              <span className="family-mini-chip">Overview</span>
            </a>
            <a className="family-nav-button" href="#pre-arrangement">
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

        <section className="family-content">
          <section className="family-metric-grid" id="case-home" style={{ marginTop: 0 }}>
            <div className="family-metric"><strong>33%</strong><span>Pre-arrangement complete</span></div>
            <div className="family-metric"><strong>5</strong><span>Forms awaiting staff review</span></div>
            <div className="family-metric"><strong>3</strong><span>Uploads received</span></div>
            <div className="family-metric"><strong>1</strong><span>Open requests</span></div>
          </section>

          <section className="family-hero">
            <div>
              <span className="family-status-chip">Arrangements in progress</span>
              <h1>Welcome, Next</h1>
              <p>This preview is a stable layout review page. Staff can use it to review the family-side flow without signing in.</p>
              <div className="family-row-actions">
                <a className="family-primary-button" href="#pre-arrangement">Continue forms</a>
                <a className="family-ghost-button" href="#post-arrangement">Review selections</a>
                <a className="family-ghost-button" href="#aftercare">Aftercare help</a>
              </div>
            </div>
            <aside className="family-hero-panel">
              <strong>Next requested action</strong>
              <p>Review the death certificate information and next of kin details.</p>
              <a className="family-primary-button" href="#pre-arrangement">Open death certificate</a>
            </aside>
          </section>

          <section className="family-panel family-section-gap" id="pre-arrangement">
            <div className="family-panel-header">
              <div>
                <h2>Pre-Arrangement</h2>
                <p className="family-helper-text">Complete the requested forms in manageable sections.</p>
              </div>
            </div>
            <div className="family-task-list">
              {forms.map(([title, status]) => (
                <div className="family-task" key={title}>
                  <span className={status === "Reviewed" ? "family-complete-indicator" : "family-complete-indicator pending"}>{status === "Reviewed" ? "OK" : "-"}</span>
                  <div><strong>{title}</strong><div className="family-meta">{status}</div></div>
                  <span className="family-ghost-button">Open</span>
                </div>
              ))}
            </div>
          </section>

          <section className="family-form-panel family-section-gap">
            <div className="family-panel-header">
              <div>
                <h2>Death Certificate Information</h2>
                <p className="family-helper-text">Status: <strong>Needs review</strong></p>
              </div>
              <span className="family-status-chip">Needs review</span>
            </div>

            <section className="death-certificate-stage-picker" aria-label="Death certificate stage">
              <strong>Death certificate stage</strong>
              <p>Preselected stage choices for staff layout review.</p>
              <div className="death-certificate-stage-options">
                {deathCertificateStages.map((stage) => (
                  <span className={`death-certificate-stage-button ${stage === "Filed with the state" ? "active" : ""}`} key={stage}>
                    {stage}
                  </span>
                ))}
              </div>
            </section>

            <div className="family-form-grid">
              <label className="family-field"><span>Legal name</span><input defaultValue="Name of Loved One" /></label>
              <label className="family-field"><span>Date of birth</span><input /></label>
              <label className="family-field"><span>Date of death</span><input /></label>
              <label className="family-field"><span>Place of death</span><input /></label>
              <label className="family-field"><span>Residence</span><input /></label>
              <label className="family-field"><span>Informant</span><input defaultValue="Next of Kin" /></label>
              <label className="family-field full"><span>Sensitive ID note</span><textarea defaultValue="SSN collected by staff phone call only" /></label>
            </div>
          </section>

          <section className="family-two-column family-section-gap" id="post-arrangement">
            <div className="family-panel">
              <h2>Post-Arrangement</h2>
              <div className="family-data-list">
                <div className="family-data-row"><strong>Service</strong><span>To be added by staff</span></div>
                <div className="family-data-row"><strong>Location</strong><span>To be added by staff</span></div>
                <div className="family-data-row"><strong>Obituary</strong><span>Draft waiting on family confirmation</span></div>
                <div className="family-data-row"><strong>Death certificate</strong><span>Filed with the state</span></div>
              </div>
            </div>
            <div className="family-panel" id="aftercare">
              <h2>Aftercare</h2>
              <div className="family-resource-list">
                <div className="family-resource-item"><strong>Death certificates</strong><span>Staff can update copy status here.</span></div>
                <div className="family-resource-item"><strong>Holiday flowers</strong><span>Families can request future flower assistance.</span></div>
                <div className="family-resource-item"><strong>Marker help</strong><span>Staff can help with headstone or marker requests.</span></div>
              </div>
            </div>
          </section>
        </section>
      </main>
    </main>
  );
}
