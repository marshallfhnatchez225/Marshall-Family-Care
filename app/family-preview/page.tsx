const forms = [
  {
    id: "death-certificate",
    title: "Death Certificate Information",
    status: "Needs review",
    fields: [
      ["Name", "Name of Loved One"],
      ["Age", ""],
      ["Street Address", ""],
      ["City", ""],
      ["County", ""],
      ["State", ""],
      ["Zip", ""],
      ["Within City Limits", "Yes or No"],
      ["Date of Birth", ""],
      ["Place of Birth", ""],
      ["Social Security Number", "Collected securely by staff"],
      ["Veteran", "Yes or No"],
      ["Father's First Name", ""],
      ["Father's Middle Name", ""],
      ["Father's Last Name", ""],
      ["Mother's First Name", ""],
      ["Mother's Middle Name", ""],
      ["Mother's Maiden Name", ""],
      ["Marital Status", "Married / Married, but separated / Widowed / Divorced / Never Married"],
      ["Surviving Spouse", ""],
      ["Spouse Maiden Name", ""],
      ["Highest Level of Education", "8th Grade or Less / 9th-12th no diploma / High School or GED / Some College, No Degree / Associate Degree / Bachelor's Degree / Master's Degree / Doctorate Degree / Unknown"],
      ["Occupation (Longest Job Held)", ""],
      ["Industry", ""],
      ["Informant", "Next of Kin"],
      ["Informant Relationship", ""],
      ["Informant Mailing Address", ""],
      ["Number of Death Certificates Needed (First copy: $17.00. Additional copies: $8.00.)", ""],
      ["Insurance Copy Note", "If insurance is being processed, Marshall Funeral Home can send one death certificate to the company, so the family may want to order one additional copy."]
    ]
  },
  {
    id: "obituary",
    title: "Obituary Information",
    status: "Draft saved",
    fields: [
      ["Name", "Name of Loved One"],
      ["Age", ""],
      ["Address", ""],
      ["City", ""],
      ["State", ""],
      ["Zip Code", ""],
      ["Date of Death", ""],
      ["Place of Death", ""],
      ["Viewing", ""],
      ["Viewing Time", ""],
      ["Viewing Place", ""],
      ["Wake Service Date", ""],
      ["Wake Service Time", ""],
      ["Wake Service Place", ""],
      ["Viewing At Church", ""],
      ["Funeral Service Date", ""],
      ["Funeral Service Time", ""],
      ["Place of Funeral Service", ""],
      ["Cemetery", ""],
      ["Date of Birth", ""],
      ["Place of Birth", ""],
      ["Name of Parents", ""],
      ["Organizations and Clubs", ""],
      ["Preceded in Death by", ""],
      ["Survivors", ""],
      ["Contact Person Name", "Next of Kin"],
      ["Phone", "601-442-6300"]
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
      ["Billing contact", ""]
    ]
  },
  {
    id: "next-of-kin",
    title: "Next Of Kin Information",
    status: "Needs clarification",
    fields: [
      ["Primary next of kin", "Next of Kin"],
      ["Additional next of kin", ""],
      ["Relationship order notes", ""],
      ["Dispute or concern", ""]
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
      ["Plot details", ""]
    ]
  }
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

const deathCertificateCopyOptions = Array.from({ length: 20 }, (_, index) => String(index + 1));

function isLongField(label: string, value: string) {
  const longLabels = [
    "Social Security Number",
    "Marital Status",
    "Highest Level of Education",
    "Informant Mailing Address",
    "Insurance Copy Note",
    "Viewing At Church",
    "Place of Funeral Service",
    "Name of Parents",
    "Organizations and Clubs",
    "Preceded in Death by",
    "Survivors"
  ];

  return value.length > 58 || longLabels.includes(label) || label.toLowerCase().includes("note") || label.includes("Acknowledgment");
}

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
                <a className="family-primary-button" href="#form-death-certificate">Continue forms</a>
                <a className="family-ghost-button" href="#post-arrangement">Review selections</a>
                <a className="family-ghost-button" href="#aftercare">Aftercare help</a>
              </div>
            </div>
            <aside className="family-hero-panel">
              <strong>Next requested action</strong>
              <p>Review the death certificate information and next of kin details.</p>
              <a className="family-primary-button" href="#form-death-certificate">Open death certificate</a>
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
              {forms.map((form) => (
                <div className="family-task" key={form.id}>
                  <span className={form.status === "Reviewed" ? "family-complete-indicator" : "family-complete-indicator pending"}>{form.status === "Reviewed" ? "OK" : "-"}</span>
                  <div><strong>{form.title}</strong><div className="family-meta">{form.status}</div></div>
                  <a className="family-ghost-button" href={`#form-${form.id}`}>Open</a>
                </div>
              ))}
            </div>
          </section>

          {forms.map((form) => (
            <section className="family-form-panel family-section-gap" id={`form-${form.id}`} key={form.id}>
              <div className="family-panel-header">
                <div>
                  <h2>{form.title}</h2>
                  <p className="family-helper-text">Status: <strong>{form.status}</strong></p>
                </div>
                <span className="family-status-chip">{form.status}</span>
              </div>

              {form.id === "death-certificate" ? (
                <section className="death-certificate-stage-picker" aria-label="Death certificate stage" id="death-certificate-stage">
                  <strong>Death certificate stage</strong>
                  <p>Preselected stage choices for staff layout review.</p>
                  <div className="death-certificate-stage-options">
                    {deathCertificateStages.map((stage) => (
                      <a className={`death-certificate-stage-button ${stage === "Filed with the state" ? "active" : ""}`} href="#death-certificate-stage" key={stage}>
                        {stage}
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="family-form-grid">
                {form.fields.map(([label, value]) => {
                  const longField = isLongField(label, value);
                  return (
                    <label className={`family-field ${longField ? "full" : ""}`} key={`${form.id}-${label}`}>
                      <span>{label}</span>
                      {label.startsWith("Number of Death Certificates Needed") ? (
                        <select defaultValue="">
                          <option value="" disabled>Select number</option>
                          {deathCertificateCopyOptions.map((option) => (
                            <option value={option} key={option}>{option}</option>
                          ))}
                        </select>
                      ) : longField ? <textarea defaultValue={value} /> : <input defaultValue={value} />}
                    </label>
                  );
                })}
              </div>
              <div className="family-form-actions">
                <p className="family-helper-text">Preview only. Changes are not saved.</p>
                <div className="family-row-actions">
                  <a className="family-ghost-button" href="#pre-arrangement">Back to list</a>
                  <a className="family-primary-button" href="#post-arrangement">Next section</a>
                </div>
              </div>
            </section>
          ))}

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
