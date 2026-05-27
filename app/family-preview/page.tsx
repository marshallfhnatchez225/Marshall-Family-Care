type FamilyPreviewPageProps = {
  searchParams: Promise<{ view?: string; form?: string }>;
};

const forms = [
  {
    id: "death-certificate",
    title: "Death Certificate Information",
    status: "Needs review",
    fields: [
      ["Legal name", "Name of Loved One"],
      ["Date of birth", ""],
      ["Date of death", ""],
      ["Place of death", ""],
      ["Residence", ""],
      ["Marital status", ""],
      ["Education", ""],
      ["Occupation", ""],
      ["Informant", "Next of Kin"],
      ["Parent information", ""],
      ["Sensitive ID note", "SSN collected by staff phone call only"]
    ]
  },
  {
    id: "obituary",
    title: "Obituary Information",
    status: "Draft saved",
    fields: [
      ["Opening life story", ""],
      ["Survived by", ""],
      ["Preceded in death by", ""],
      ["Service wording", ""],
      ["Charity preference", ""],
      ["Publication notes", "Staff will review before publication"]
    ]
  },
  {
    id: "embalming",
    title: "Permission To Embalm",
    status: "Not submitted",
    fields: [
      ["Authorizing person", "Next of Kin"],
      ["Relationship", ""],
      ["Phone", "601-442-6300"],
      ["Acknowledgment", "Staff will review this authorization before relying on it."]
    ]
  },
  {
    id: "family-info",
    title: "General Family Information",
    status: "Reviewed",
    fields: [
      ["Primary contact", "Next of Kin"],
      ["Preferred phone", "601-442-6300"],
      ["Email", ""],
      ["Billing contact", ""],
      ["Communication preference", "Text for urgent items, email for documents"]
    ]
  },
  {
    id: "next-of-kin",
    title: "Next Of Kin Information",
    status: "Needs clarification",
    fields: [
      ["Primary next of kin", "Next of Kin"],
      ["Additional next of kin", ""],
      ["Relationship order notes", "Family will confirm relationship details with staff"],
      ["Dispute or concern", ""],
      ["Staff note", "Confirm preferred phone number"]
    ]
  },
  {
    id: "veteran-church-cemetery",
    title: "Veteran, Church, Cemetery Details",
    status: "Draft saved",
    fields: [
      ["Veteran status", ""],
      ["Church", ""],
      ["Clergy", ""],
      ["Cemetery", ""],
      ["Plot details", ""],
      ["Special rites", ""]
    ]
  }
];

const selectedItems = [
  ["Service", "Saturday, May 16, 2026 at 11:00 AM"],
  ["Location", "New Hope Missionary Baptist Church"],
  ["Casket", "Cedarview Oak, selected"],
  ["Vault", "Standard concrete vault"],
  ["Flowers", "Casket spray, white lilies and greenery"],
  ["Programs", "Tri-fold program, 150 copies"],
  ["Transportation", "Family limousine, one vehicle"]
];

function isActive(current: string, expected: string) {
  return current === expected ? "active" : "";
}

export default async function FamilyPreviewPage({ searchParams }: FamilyPreviewPageProps) {
  const params = await searchParams;
  const view = ["home", "pre", "post", "aftercare"].includes(params.view ?? "")
    ? String(params.view)
    : "home";
  const activeForm = forms.find((form) => form.id === params.form) ?? forms[0];
  const completionPercent = 33;
  const reviewCount = 5;

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
              <span style={{ width: `${completionPercent}%` }} />
            </div>
          </section>
          <nav className="family-sidebar-nav" aria-label="Family portal navigation">
            <a className={`family-nav-button ${isActive(view, "home")}`} href="/family-preview?view=home">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Case home</span></span>
              <span className="family-mini-chip">Overview</span>
            </a>
            <a className={`family-nav-button ${isActive(view, "pre")}`} href="/family-preview?view=pre&form=death-certificate">
              <span className="family-nav-label"><span className="family-complete-indicator pending">-</span><span>Pre-Arrangement</span></span>
              <span className="family-mini-chip">33%</span>
            </a>
            <a className={`family-nav-button ${isActive(view, "post")}`} href="/family-preview?view=post">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Post-Arrangement</span></span>
              <span className="family-mini-chip">Current</span>
            </a>
            <a className={`family-nav-button ${isActive(view, "aftercare")}`} href="/family-preview?view=aftercare">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Aftercare</span></span>
              <span className="family-mini-chip">Support</span>
            </a>
          </nav>
          <div className="family-footer-note">
            Need immediate help? Call Marshall Funeral Home at (601) 442-6300 or (601) 384-2732.
          </div>
        </aside>

        <section className="family-content">
          {view === "home" ? (
            <>
              <section className="family-metric-grid" style={{ marginTop: 0 }}>
                <div className="family-metric"><strong>{completionPercent}%</strong><span>Pre-arrangement complete</span></div>
                <div className="family-metric"><strong>{reviewCount}</strong><span>Forms awaiting staff review</span></div>
                <div className="family-metric"><strong>3</strong><span>Uploads received</span></div>
                <div className="family-metric"><strong>1</strong><span>Open requests</span></div>
              </section>
              <section className="family-hero">
                <div>
                  <span className="family-status-chip">Arrangements in progress</span>
                  <h1>Welcome, Next</h1>
                  <p>This preview uses regular links, so sections open even without app sign-in.</p>
                  <div className="family-row-actions">
                    <a className="family-primary-button" href="/family-preview?view=pre&form=death-certificate">Continue forms</a>
                    <a className="family-ghost-button" href="/family-preview?view=post">Review selections</a>
                    <a className="family-ghost-button" href="/family-preview?view=aftercare">Aftercare help</a>
                  </div>
                </div>
                <aside className="family-hero-panel">
                  <strong>Next requested action</strong>
                  <p>Review the death certificate information and next of kin details.</p>
                  <a className="family-primary-button" href="/family-preview?view=pre&form=death-certificate">Open death certificate</a>
                </aside>
              </section>
              <section className="family-panel family-section-gap">
                <div className="family-panel-header"><h2>Current checklist</h2><a className="family-quiet-button" href="/family-preview?view=pre&form=death-certificate">View all</a></div>
                <div className="family-task-list">
                  {forms.map((form) => (
                    <div className="family-task" key={form.id}>
                      <span className={form.status === "Reviewed" ? "family-complete-indicator" : "family-complete-indicator pending"}>{form.status === "Reviewed" ? "OK" : "-"}</span>
                      <div><strong>{form.title}</strong><div className="family-meta">{form.status}</div></div>
                      <a className="family-ghost-button" href={`/family-preview?view=pre&form=${form.id}`}>Open</a>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}

          {view === "pre" ? (
            <>
              <section className="family-section-title"><div><h1>Pre-Arrangement</h1><p>Complete the requested forms in manageable sections.</p></div></section>
              <div className="family-tabs">
                {forms.map((form) => (
                  <a className={`family-tab-button ${activeForm.id === form.id ? "active" : ""}`} href={`/family-preview?view=pre&form=${form.id}`} key={form.id}>{form.status === "Reviewed" ? "OK " : ""}{form.title}</a>
                ))}
              </div>
              <section className="family-form-panel">
                <div className="family-panel-header"><div><h2>{activeForm.title}</h2><p className="family-helper-text">Status: <strong>{activeForm.status}</strong></p></div><span className="family-status-chip">{activeForm.status}</span></div>
                <div className="family-form-grid">
                  {activeForm.fields.map(([label, value]) => {
                    const isLong = value.length > 58 || label.toLowerCase().includes("note") || label.includes("Acknowledgment");
                    return (
                      <label className={`family-field ${isLong ? "full" : ""}`} key={`${activeForm.id}-${label}`}>
                        <span>{label}</span>
                        {isLong ? <textarea defaultValue={value} /> : <input defaultValue={value} />}
                      </label>
                    );
                  })}
                </div>
                <div className="family-form-actions"><p className="family-helper-text">Preview only. Changes are not saved.</p><div className="family-row-actions"><a className="family-ghost-button" href={`/family-preview?view=pre&form=${activeForm.id}`}>Save draft</a><a className="family-primary-button" href={`/family-preview?view=pre&form=${activeForm.id}`}>Submit for staff review</a></div></div>
              </section>
            </>
          ) : null}

          {view === "post" ? (
            <>
              <section className="family-section-title"><div><h1>Post-Arrangement</h1><p>View what is currently selected and request changes before details are finalized.</p></div></section>
              <section className="family-two-column">
                <div className="family-panel"><h2>Current selections</h2><div className="family-data-list">{selectedItems.map(([item, value]) => <div className="family-data-row" key={item}><strong>{item}</strong><span>{value}</span></div>)}</div></div>
                <div className="family-panel"><h2>Current case status</h2><div className="family-timeline"><div className="family-timeline-item"><strong>Arrangement status</strong><span>Arrangements in progress</span></div><div className="family-timeline-item"><strong>Death certificate</strong><span>Filed with the state, waiting on certified copies</span></div><div className="family-timeline-item"><strong>Obituary</strong><span>Draft waiting on family confirmation</span></div></div></div>
              </section>
            </>
          ) : null}

          {view === "aftercare" ? (
            <>
              <section className="family-section-title"><div><h1>Aftercare</h1><p>Request continued assistance after services.</p></div><span className="family-status-chip">Filed with the state</span></section>
              <section className="family-three-column">{["Death certificate status", "Holiday flowers", "Headstone or marker help"].map((title) => <div className="family-panel" key={title}><h2>{title}</h2><p className="family-helper-text">Marshall staff can help with this request.</p><a className="family-ghost-button" href="/family-preview?view=aftercare">Request help</a></div>)}</section>
            </>
          ) : null}
        </section>
      </main>
    </main>
  );
}
