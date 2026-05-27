"use client";

import { useMemo, useState } from "react";

type FamilyView = "home" | "pre" | "post" | "aftercare";

type PreviewForm = {
  id: string;
  title: string;
  status: string;
  fields: [string, string][];
  notice?: string;
};

const previewForms: PreviewForm[] = [
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
    notice:
      "This preview is for layout review only. Marshall staff should review official authorization wording before use.",
    fields: [
      ["Authorizing person", "Next of Kin"],
      ["Relationship", ""],
      ["Phone", "601-442-6300"],
      ["Acknowledgment", "I understand staff will review this authorization before relying on it."],
      ["Timestamp", "Captured automatically on submit"]
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

const selectedItems: [string, string][] = [
  ["Service", "Saturday, May 16, 2026 at 11:00 AM"],
  ["Location", "New Hope Missionary Baptist Church"],
  ["Casket", "Cedarview Oak, selected"],
  ["Vault", "Standard concrete vault"],
  ["Flowers", "Casket spray, white lilies and greenery"],
  ["Programs", "Tri-fold program, 150 copies"],
  ["Transportation", "Family limousine, one vehicle"]
];

function statusIsComplete(status: string) {
  return ["Reviewed", "Completed", "Approved", "Submitted"].some((item) => status.includes(item));
}

function titleCase(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

export function FamilyPreviewPortal() {
  const [familyView, setFamilyView] = useState<FamilyView>("home");
  const [selectedFormId, setSelectedFormId] = useState("death-certificate");
  const [forms, setForms] = useState(previewForms);
  const activeForm = forms.find((form) => form.id === selectedFormId) ?? forms[0];
  const completeCount = forms.filter((form) => statusIsComplete(form.status)).length;
  const completionPercent = Math.round((completeCount / forms.length) * 100);
  const reviewCount = forms.filter((form) => !statusIsComplete(form.status)).length;
  const uploadsReceived = 3;
  const openRequests = 1;

  const nav = useMemo(
    () => [
      { id: "home" as const, label: "Case home", meta: "Overview" },
      { id: "pre" as const, label: "Pre-Arrangement", meta: `${completionPercent}%` },
      { id: "post" as const, label: "Post-Arrangement", meta: "Current" },
      { id: "aftercare" as const, label: "Aftercare", meta: "Support" }
    ],
    [completionPercent]
  );

  function openForm(formId: string) {
    setSelectedFormId(formId);
    setFamilyView("pre");
  }

  function updateField(index: number, value: string) {
    setForms((current) =>
      current.map((form) =>
        form.id === activeForm.id
          ? {
              ...form,
              fields: form.fields.map((field, fieldIndex) =>
                fieldIndex === index ? [field[0], value] : field
              )
            }
          : form
      )
    );
  }

  function setStatus(status: string) {
    setForms((current) =>
      current.map((form) => (form.id === activeForm.id ? { ...form, status } : form))
    );
  }

  return (
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
          {nav.map((item) => (
            <button
              className={`family-nav-button ${familyView === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setFamilyView(item.id)}
              type="button"
            >
              <span className="family-nav-label">
                <span className="family-complete-indicator">OK</span>
                <span>{item.label}</span>
              </span>
              <span className="family-mini-chip">{item.meta}</span>
            </button>
          ))}
        </nav>
        <div className="family-footer-note">
          Need immediate help? Call Marshall Funeral Home at (601) 442-6300 or (601) 384-2732.
        </div>
      </aside>

      <section className="family-content">
        {familyView === "home" ? (
          <>
            <section className="family-metric-grid" style={{ marginTop: 0 }}>
              <div className="family-metric">
                <strong>{completionPercent}%</strong>
                <span>Pre-arrangement complete</span>
              </div>
              <div className="family-metric">
                <strong>{reviewCount}</strong>
                <span>Forms awaiting staff review</span>
              </div>
              <div className="family-metric">
                <strong>{uploadsReceived}</strong>
                <span>Uploads received</span>
              </div>
              <div className="family-metric">
                <strong>{openRequests}</strong>
                <span>Open requests</span>
              </div>
            </section>

            <section className="family-hero">
              <div>
                <span className="family-status-chip">Arrangements in progress</span>
                <h1>Welcome, Next</h1>
                <p>
                  This preview keeps the family flow easy to test without using a real login.
                  Click any section or form below to review how the portal feels.
                </p>
                <div className="family-row-actions">
                  <button className="family-primary-button" onClick={() => setFamilyView("pre")} type="button">
                    Continue forms
                  </button>
                  <button className="family-ghost-button" onClick={() => setFamilyView("post")} type="button">
                    Review selections
                  </button>
                  <button className="family-ghost-button" onClick={() => setFamilyView("aftercare")} type="button">
                    Aftercare help
                  </button>
                </div>
              </div>
              <aside className="family-hero-panel">
                <strong>Next requested action</strong>
                <p>Review the death certificate information and next of kin details.</p>
                <button className="family-primary-button" onClick={() => openForm("death-certificate")} type="button">
                  Open death certificate
                </button>
              </aside>
            </section>

            <section className="family-panel family-section-gap">
              <div className="family-panel-header">
                <h2>Current checklist</h2>
                <button className="family-quiet-button" onClick={() => setFamilyView("pre")} type="button">
                  View all
                </button>
              </div>
              <div className="family-task-list">
                {forms.map((form) => (
                  <div className="family-task" key={form.id}>
                    <span className={statusIsComplete(form.status) ? "family-complete-indicator" : "family-complete-indicator pending"}>
                      {statusIsComplete(form.status) ? "OK" : "-"}
                    </span>
                    <div>
                      <strong>{form.title}</strong>
                      <div className="family-meta">{form.status}</div>
                    </div>
                    <button className="family-ghost-button" onClick={() => openForm(form.id)} type="button">
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {familyView === "pre" ? (
          <>
            <section className="family-section-title">
              <div>
                <h1>Pre-Arrangement</h1>
                <p>Complete the requested forms in manageable sections.</p>
              </div>
            </section>
            <div className="family-tabs">
              {forms.map((form) => (
                <button
                  className={`family-tab-button ${selectedFormId === form.id ? "active" : ""}`}
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  type="button"
                >
                  {statusIsComplete(form.status) ? "OK " : ""}
                  {form.title}
                </button>
              ))}
            </div>
            <section className="family-form-panel">
              <div className="family-panel-header">
                <div>
                  <h2>{activeForm.title}</h2>
                  <p className="family-helper-text">
                    Status: <strong>{activeForm.status}</strong>
                  </p>
                </div>
                <span className="family-status-chip">{activeForm.status}</span>
              </div>
              {activeForm.notice ? <div className="family-notice">{activeForm.notice}</div> : null}
              <div className="family-form-grid">
                {activeForm.fields.map(([label, value], index) => {
                  const isLong = value.length > 58 || label.toLowerCase().includes("story") || label.toLowerCase().includes("notes") || label.includes("Acknowledgment");
                  return (
                    <label className={`family-field ${isLong ? "full" : ""}`} key={`${activeForm.id}-${label}`}>
                      <span>{label}</span>
                      {isLong ? (
                        <textarea value={value} onChange={(event) => updateField(index, event.target.value)} />
                      ) : (
                        <input value={value} onChange={(event) => updateField(index, event.target.value)} />
                      )}
                    </label>
                  );
                })}
              </div>
              <div className="family-form-actions">
                <p className="family-helper-text">Preview changes stay in this browser only.</p>
                <div className="family-row-actions">
                  <button className="family-ghost-button" onClick={() => setStatus("Draft saved")} type="button">
                    Save draft
                  </button>
                  <button className="family-primary-button" onClick={() => setStatus("Submitted for staff review")} type="button">
                    Submit for staff review
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {familyView === "post" ? (
          <>
            <section className="family-section-title">
              <div>
                <h1>Post-Arrangement</h1>
                <p>View what is currently selected and request changes before details are finalized.</p>
              </div>
            </section>
            <section className="family-two-column">
              <div className="family-panel">
                <h2>Current selections</h2>
                <div className="family-data-list">
                  {selectedItems.map(([item, value]) => (
                    <div className="family-data-row" key={item}>
                      <strong>{item}</strong>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="family-panel">
                <h2>Current case status</h2>
                <div className="family-timeline">
                  <div className="family-timeline-item">
                    <strong>Arrangement status</strong>
                    <span>Arrangements in progress</span>
                  </div>
                  <div className="family-timeline-item">
                    <strong>Death certificate</strong>
                    <span>Filed with the state, waiting on certified copies</span>
                  </div>
                  <div className="family-timeline-item">
                    <strong>Obituary</strong>
                    <span>Draft waiting on family confirmation</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {familyView === "aftercare" ? (
          <>
            <section className="family-section-title">
              <div>
                <h1>Aftercare</h1>
                <p>Request continued assistance after services.</p>
              </div>
              <span className="family-status-chip">Filed with the state</span>
            </section>
            <section className="family-three-column">
              {["Death certificate status", "Holiday flowers", "Headstone or marker help"].map((title) => (
                <div className="family-panel" key={title}>
                  <h2>{title}</h2>
                  <p className="family-helper-text">{titleCase(title)} support can be requested through Marshall staff.</p>
                  <button className="family-ghost-button" type="button">
                    Request help
                  </button>
                </div>
              ))}
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
