"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

type FormStatus =
  | "Needs review"
  | "Draft saved"
  | "Not submitted"
  | "Reviewed"
  | "Needs clarification"
  | "Submitted for staff review";

type FamilyForm = {
  id: string;
  title: string;
  status: FormStatus;
  notice?: string;
  fields: [string, string][];
};

type UploadRecord = {
  name: string;
  type: string;
  status: string;
  notes?: string;
};

type RequestRecord = {
  category: string;
  text: string;
  status: string;
  urgency?: string;
  contact?: string;
};

type MessageRecord = {
  from: string;
  text: string;
};

type PortalState = {
  familyView: "home" | "pre" | "post" | "aftercare";
  selectedFormId: string;
  case: {
    decedent: string;
    familyContact: string;
    contactPhone: string;
    assignedDirector: string;
    caseStatus: string;
    deathCertificateStatus: string;
    service: Record<string, string>;
    selectedItems: [string, string][];
    obituaryDraft: string;
    photos: string[];
    uploads: UploadRecord[];
    changeRequests: RequestRecord[];
    aftercareRequests: RequestRecord[];
    messages: MessageRecord[];
  };
  forms: FamilyForm[];
};

type FamilyPortalProps = {
  assignedDirector?: string | null;
  familyContact?: string | null;
  lovedOneName?: string | null;
  preferredPhone?: string | null;
  userId?: string | null;
};

const defaultStorageKey = "marshall-family-portal";

const formDefinitions: FamilyForm[] = [
  {
    id: "death-certificate",
    title: "Death Certificate Information",
    status: "Needs review",
    fields: [
      ["Legal name", ""],
      ["Other names used", ""],
      ["Date of birth", "1948-03-12"],
      ["Date of death", "2026-05-03"],
      ["Place of death", "Jackson, Mississippi"],
      ["Residence", "1220 Pine Ridge Road, Jackson, MS"],
      ["Marital status", "Widowed"],
      ["Education", "Some college"],
      ["Occupation", "Retired educator"],
      ["Informant", ""],
      ["Parent information", "Thomas Hinton and Leola Price Hinton"],
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
      ["Publication notes", "Please share with family before newspaper submission"]
    ]
  },
  {
    id: "embalming",
    title: "Permission To Embalm",
    status: "Not submitted",
    notice:
      "This online acknowledgment creates a review record for Marshall Funeral Home staff. It does not replace counsel-approved authorization language unless Marshall has approved it for use.",
    fields: [
      ["Authorizing person", ""],
      ["Relationship", "Daughter / next of kin"],
      ["Phone", ""],
      ["Acknowledgment", "I understand staff will review this authorization before relying on it."],
      ["Timestamp", "Captured automatically on submit"]
    ]
  },
  {
    id: "family-info",
    title: "General Family Information",
    status: "Reviewed",
    fields: [
      ["Primary contact", ""],
      ["Preferred phone", ""],
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
      ["Primary next of kin", ""],
      ["Additional next of kin", ""],
      ["Relationship order notes", "Both children are coordinating together"],
      ["Dispute or concern", "No known dispute"],
      ["Staff note", ""]
    ]
  },
  {
    id: "veteran-church-cemetery",
    title: "Veteran, Church, Cemetery Details",
    status: "Draft saved",
    fields: [
      ["Veteran status", "Not a veteran"],
      ["Church", "New Hope Missionary Baptist Church"],
      ["Clergy", "Rev. Samuel Turner"],
      ["Cemetery", "Garden Memorial Park"],
      ["Plot details", "Section B, Lot 18"],
      ["Special rites", "Church choir requested"]
    ]
  }
];

function buildInitialState({
  assignedDirector,
  familyContact,
  lovedOneName,
  preferredPhone
}: FamilyPortalProps = {}): PortalState {
  const contact = familyContact?.trim() || "Family Contact";
  const decedent = lovedOneName?.trim() || "Loved One";
  const phone = preferredPhone?.trim() || "Phone not provided";
  const director = assignedDirector?.trim() || "Marshall Family Care Staff";
  const contactFirstName = contact.split(" ")[0] || "Family";
  const decedentFirstName = decedent.split(" ")[0] || "Loved";

  const forms = formDefinitions.map((form) => ({
    ...form,
    fields: form.fields.map(([label, value]) => {
      if (label === "Legal name") return [label, decedent] as [string, string];
      if (label === "Other names used") return [label, ""] as [string, string];
      if (label === "Informant") return [label, contact] as [string, string];
      if (label === "Authorizing person") return [label, contact] as [string, string];
      if (label === "Phone") return [label, phone] as [string, string];
      if (label === "Primary contact") return [label, contact] as [string, string];
      if (label === "Preferred phone") return [label, phone] as [string, string];
      if (label === "Email") return [label, ""] as [string, string];
      if (label === "Primary next of kin") return [label, contact] as [string, string];
      if (label === "Additional next of kin") return [label, ""] as [string, string];
      if (label === "Staff note") return [label, `Confirm ${contactFirstName}'s preferred phone number`] as [string, string];
      if (label === "Opening life story") {
        return [label, `${decedentFirstName} will be remembered with care by family and friends.`] as [string, string];
      }
      if (label === "Survived by") return [label, ""] as [string, string];
      if (label === "Billing contact") return [label, contact] as [string, string];
      if (label === "Relationship order notes") return [label, "Family will confirm relationship details with staff"] as [string, string];
      return [label, value] as [string, string];
    })
  }));

  return {
  familyView: "home",
  selectedFormId: "death-certificate",
  case: {
    decedent,
    familyContact: contact,
    contactPhone: phone,
    assignedDirector: director,
    caseStatus: "Arrangements in progress",
    deathCertificateStatus: "Filed with the state, waiting on certified copies",
    service: {
      date: "Saturday, May 16, 2026",
      time: "11:00 AM",
      location: "New Hope Missionary Baptist Church",
      visitation: "Friday, May 15, 5:00 PM to 7:00 PM",
      cemetery: "Garden Memorial Park",
      clergy: "Rev. Samuel Turner"
    },
    selectedItems: [
      ["Casket", "Cedarview Oak, selected"],
      ["Vault", "Standard concrete vault"],
      ["Flowers", "Casket spray, white lilies and greenery"],
      ["Programs", "Tri-fold program, 150 copies"],
      ["Transportation", "Family limousine, one vehicle"],
      ["Video", "Memorial slideshow requested"]
    ],
    obituaryDraft:
      `${decedent} will be remembered with love by family and friends. Marshall Funeral Home staff will help the family review and prepare the obituary draft before publication.`,
    photos: [`${decedentFirstName} portrait for obituary`, "Family remembrance photo"],
    uploads: [
      { name: `${contactFirstName.toLowerCase()}-id.pdf`, type: "ID", status: "Private, staff reviewed" },
      { name: "cemetery-paperwork.jpg", type: "Cemetery", status: "Needs staff review" },
      { name: `${decedentFirstName.toLowerCase()}-portrait.png`, type: "Photo", status: "Approved for obituary" }
    ],
    changeRequests: [
      { category: "Obituary", text: "Please add the scholarship fund note before publishing.", status: "Open" },
      { category: "Programs", text: "Increase printed programs from 125 to 150.", status: "Completed" }
    ],
    aftercareRequests: [
      { category: "Death certificates", text: "Need six certified copies when ready.", status: "In progress" },
      { category: "Marker help", text: "Family would like options for a companion marker.", status: "Open" }
    ],
    messages: [
      { from: director, text: "Welcome to the Marshall Family Care Portal. Please review the requested items and send any questions here." }
    ]
  },
  forms
  };
}

function cloneState(state: PortalState) {
  return JSON.parse(JSON.stringify(state)) as PortalState;
}

function isCompleteStatus(status: string) {
  return ["Reviewed", "Completed", "Approved", "Submitted for staff review"].some((label) =>
    status.includes(label)
  );
}

function isPendingStatus(status: string) {
  return ["Needs review", "Draft saved", "Needs clarification", "Submitted for staff review"].some((label) =>
    status.includes(label)
  );
}

function titleCase(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

export function FamilyPortal(props: FamilyPortalProps) {
  const seededState = useMemo(() => buildInitialState(props), [
    props.assignedDirector,
    props.familyContact,
    props.lovedOneName,
    props.preferredPhone
  ]);
  const storageKey = props.userId ? `${defaultStorageKey}-${props.userId}` : defaultStorageKey;
  const [state, setState] = useState<PortalState>(() => cloneState(seededState));
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setState(JSON.parse(stored) as PortalState);
      } else {
        setState(cloneState(seededState));
      }
    } finally {
      setIsLoaded(true);
    }
  }, [seededState, storageKey]);

  useEffect(() => {
    if (isLoaded) {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [isLoaded, state]);

  const completionPercent = useMemo(() => {
    const reviewed = state.forms.filter((form) => isCompleteStatus(form.status)).length;
    return Math.round((reviewed / state.forms.length) * 100);
  }, [state.forms]);

  const reviewCount = state.forms.filter((form) => isPendingStatus(form.status)).length;
  const openRequests = state.case.changeRequests.filter((item) => item.status === "Open").length;
  const activeForm = state.forms.find((form) => form.id === state.selectedFormId) ?? state.forms[0];

  function setFamilyView(familyView: PortalState["familyView"]) {
    setState((current) => ({ ...current, familyView }));
  }

  function openForm(formId: string) {
    setState((current) => ({ ...current, familyView: "pre", selectedFormId: formId }));
  }

  function updateFormField(formId: string, index: number, value: string) {
    setState((current) => ({
      ...current,
      forms: current.forms.map((form) =>
        form.id === formId
          ? {
              ...form,
              fields: form.fields.map((field, fieldIndex) =>
                fieldIndex === index ? [field[0], value] : field
              )
            }
          : form
      )
    }));
  }

  function updateFormStatus(formId: string, status: FormStatus) {
    setState((current) => ({
      ...current,
      forms: current.forms.map((form) => (form.id === formId ? { ...form, status } : form))
    }));
  }

  function resetDemo() {
    setState(cloneState(seededState));
  }

  function handleMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = String(formData.get("message") ?? "").trim();
    if (!text) return;
    setState((current) => ({
      ...current,
      case: {
        ...current.case,
        messages: [{ from: current.case.familyContact, text }, ...current.case.messages]
      }
    }));
    event.currentTarget.reset();
  }

  function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const type = String(formData.get("type") ?? "Miscellaneous");
    const notes = String(formData.get("notes") ?? "").trim();
    if (!name) return;
    setState((current) => ({
      ...current,
      case: {
        ...current.case,
        uploads: [{ name, type, notes, status: "Needs staff review" }, ...current.case.uploads]
      }
    }));
    event.currentTarget.reset();
  }

  function handleChangeRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const category = String(formData.get("category") ?? "Other");
    const urgency = String(formData.get("urgency") ?? "Normal");
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return;
    setState((current) => ({
      ...current,
      case: {
        ...current.case,
        changeRequests: [{ category, urgency, text, status: "Open" }, ...current.case.changeRequests]
      }
    }));
    event.currentTarget.reset();
  }

  function handleAftercare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const category = String(formData.get("category") ?? "Future assistance");
    const contact = String(formData.get("contact") ?? "Phone");
    const text = String(formData.get("text") ?? "").trim();
    if (!text) return;
    setState((current) => ({
      ...current,
      case: {
        ...current.case,
        aftercareRequests: [{ category, contact, text, status: "Open" }, ...current.case.aftercareRequests]
      }
    }));
    event.currentTarget.reset();
  }

  function indicator(status: string) {
    const className = isCompleteStatus(status)
      ? "family-complete-indicator"
      : isPendingStatus(status)
        ? "family-complete-indicator pending"
        : "family-complete-indicator open";
    return <span className={className}>{isCompleteStatus(status) ? "OK" : "-"}</span>;
  }

  const nav = [
    { id: "home" as const, label: "Case home", meta: "Overview" },
    { id: "pre" as const, label: "Pre-Arrangement", meta: `${completionPercent}%` },
    { id: "post" as const, label: "Post-Arrangement", meta: "Current" },
    { id: "aftercare" as const, label: "Aftercare", meta: "Support" }
  ];

  return (
    <main className="family-portal">
      <aside className="family-sidebar">
        <section className="family-case-card">
          <span className="family-status-chip">{state.case.caseStatus}</span>
          <h2>{state.case.decedent}</h2>
          <p>Primary contact: {state.case.familyContact}</p>
          <p>Director: {state.case.assignedDirector}</p>
          <div className="family-progress-bar" aria-label="Form completion">
            <span style={{ width: `${completionPercent}%` }} />
          </div>
        </section>
        <nav className="family-sidebar-nav" aria-label="Family portal navigation">
          {nav.map((item) => (
            <button
              className={`family-nav-button ${state.familyView === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setFamilyView(item.id)}
              type="button"
            >
              <span className="family-nav-label">
                {item.id === "home" ? indicator(state.case.caseStatus) : indicator(item.id === "pre" ? `${completionPercent}%` : "Reviewed")}
                <span>{item.label}</span>
              </span>
              <span className="family-mini-chip">{item.meta}</span>
            </button>
          ))}
        </nav>
        <div className="family-footer-note">
          Need immediate help? Call Marshall Funeral Home at (601) 555-0139.
        </div>
      </aside>
      <section className="family-content">
        {state.familyView === "home" ? (
          <FamilyHome
            completionPercent={completionPercent}
            onMessage={handleMessage}
            onOpenForm={openForm}
            onSetView={setFamilyView}
            openRequests={openRequests}
            reviewCount={reviewCount}
            state={state}
          />
        ) : null}
        {state.familyView === "pre" ? (
          <PreArrangement
            activeForm={activeForm}
            forms={state.forms}
            onOpenForm={(formId) =>
              setState((current) => ({ ...current, selectedFormId: formId }))
            }
            onReset={resetDemo}
            onSaveDraft={(formId) => updateFormStatus(formId, "Draft saved")}
            onSubmitReview={(formId) => updateFormStatus(formId, "Submitted for staff review")}
            onUpdateField={updateFormField}
            onUpload={handleUpload}
            selectedFormId={state.selectedFormId}
            state={state}
          />
        ) : null}
        {state.familyView === "post" ? (
          <PostArrangement
            indicator={indicator}
            onChangeRequest={handleChangeRequest}
            onRequestCategory={(category) => {
              setState((current) => ({
                ...current,
                case: {
                  ...current.case,
                  changeRequests: [
                    {
                      category,
                      text: `Please review ${category.toLowerCase()} details with the family.`,
                      status: "Open"
                    },
                    ...current.case.changeRequests
                  ]
                }
              }));
            }}
            state={state}
          />
        ) : null}
        {state.familyView === "aftercare" ? (
          <Aftercare
            onAftercare={handleAftercare}
            onCategory={(category) => {
              setState((current) => ({
                ...current,
                case: {
                  ...current.case,
                  aftercareRequests: [
                    {
                      category,
                      text: `Please contact the family about ${category.toLowerCase()}.`,
                      status: "Open"
                    },
                    ...current.case.aftercareRequests
                  ]
                }
              }));
            }}
            state={state}
          />
        ) : null}
      </section>
    </main>
  );
}

function FamilyHome({
  completionPercent,
  onMessage,
  onOpenForm,
  onSetView,
  openRequests,
  reviewCount,
  state
}: {
  completionPercent: number;
  onMessage: (event: FormEvent<HTMLFormElement>) => void;
  onOpenForm: (formId: string) => void;
  onSetView: (view: PortalState["familyView"]) => void;
  openRequests: number;
  reviewCount: number;
  state: PortalState;
}) {
  return (
    <>
      <section className="family-hero">
        <div>
          <span className="family-status-chip">{state.case.caseStatus}</span>
          <h1>Welcome, {state.case.familyContact.split(" ")[0]}</h1>
          <p>
            This portal keeps the most important arrangement details in one place.
            Save drafts as you go; Marshall Funeral Home staff will review each
            submission before it becomes part of the official file.
          </p>
          <div className="family-row-actions">
            <button className="family-primary-button" onClick={() => onSetView("pre")} type="button">
              Continue forms
            </button>
            <button className="family-ghost-button" onClick={() => onSetView("post")} type="button">
              Review selections
            </button>
            <button className="family-ghost-button" onClick={() => onSetView("aftercare")} type="button">
              Aftercare help
            </button>
          </div>
        </div>
        <aside className="family-hero-panel">
          <strong>Next requested action</strong>
          <p>Review the next of kin details and confirm the family&apos;s preferred phone number.</p>
          <button className="family-primary-button" onClick={() => onOpenForm("next-of-kin")} type="button">
            Open requested form
          </button>
        </aside>
      </section>
      <section className="family-metric-grid">
        <div className="family-metric">
          <strong>{completionPercent}%</strong>
          <span>Pre-arrangement complete</span>
        </div>
        <div className="family-metric">
          <strong>{reviewCount}</strong>
          <span>Forms awaiting staff review</span>
        </div>
        <div className="family-metric">
          <strong>{state.case.uploads.length}</strong>
          <span>Uploads received</span>
        </div>
        <div className="family-metric">
          <strong>{openRequests}</strong>
          <span>Open requests</span>
        </div>
      </section>
      <section className="family-two-column">
        <div className="family-panel">
          <div className="family-panel-header">
            <h2>Current checklist</h2>
            <button className="family-quiet-button" onClick={() => onSetView("pre")} type="button">
              View all
            </button>
          </div>
          <div className="family-task-list">
            {state.forms.map((form) => (
              <div className="family-task" key={form.id}>
                <span className={isCompleteStatus(form.status) ? "family-complete-indicator" : "family-complete-indicator pending"}>
                  {isCompleteStatus(form.status) ? "OK" : "-"}
                </span>
                <div>
                  <strong>{form.title}</strong>
                  <div className="family-meta">{form.status}</div>
                </div>
                <button className="family-ghost-button" onClick={() => onOpenForm(form.id)} type="button">
                  Open
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="family-panel">
          <h2>Recent messages</h2>
          <div className="family-message-list">
            {state.case.messages.map((message, index) => (
              <div className="family-message" key={`${message.from}-${index}`}>
                <strong>{message.from}</strong>
                <span>{message.text}</span>
              </div>
            ))}
          </div>
          <form className="family-form-actions" onSubmit={onMessage}>
            <label className="family-field full">
              <span>Send a note to staff</span>
              <textarea name="message" placeholder="Type a question or update" />
            </label>
            <button className="family-primary-button" type="submit">
              Send note
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

function PreArrangement({
  activeForm,
  forms,
  onOpenForm,
  onReset,
  onSaveDraft,
  onSubmitReview,
  onUpdateField,
  onUpload,
  selectedFormId,
  state
}: {
  activeForm: FamilyForm;
  forms: FamilyForm[];
  onOpenForm: (formId: string) => void;
  onReset: () => void;
  onSaveDraft: (formId: string) => void;
  onSubmitReview: (formId: string) => void;
  onUpdateField: (formId: string, index: number, value: string) => void;
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  selectedFormId: string;
  state: PortalState;
}) {
  return (
    <>
      <section className="family-section-title">
        <div>
          <h1>Pre-Arrangement</h1>
          <p>Complete the requested forms in manageable sections. You can save drafts and return later.</p>
        </div>
        <button className="family-ghost-button" onClick={onReset} type="button">
          Reset demo data
        </button>
      </section>
      <div className="family-tabs">
        {forms.map((form) => (
          <button
            className={`family-tab-button ${selectedFormId === form.id ? "active" : ""}`}
            key={form.id}
            onClick={() => onOpenForm(form.id)}
            type="button"
          >
            {isCompleteStatus(form.status) ? "OK " : ""}
            {form.title}
          </button>
        ))}
        <button
          className={`family-tab-button ${selectedFormId === "uploads" ? "active" : ""}`}
          onClick={() => onOpenForm("uploads")}
          type="button"
        >
          Uploads
        </button>
      </div>
      {selectedFormId === "uploads" ? (
        <UploadCenter onUpload={onUpload} state={state} />
      ) : (
        <section className="family-form-panel">
          <div className="family-panel-header">
            <div>
              <h2>{activeForm.title}</h2>
              <p className="family-helper-text">
                Status: <strong>{activeForm.status}</strong>
              </p>
            </div>
            <div className="family-row-actions">
              <span className="family-status-chip">{activeForm.status}</span>
            </div>
          </div>
          {activeForm.notice ? <div className="family-notice">{activeForm.notice}</div> : null}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitReview(activeForm.id);
            }}
          >
            <div className="family-form-grid">
              {activeForm.fields.map(([label, value], index) => {
                const isLong =
                  value.length > 58 ||
                  label.toLowerCase().includes("story") ||
                  label.toLowerCase().includes("notes") ||
                  label.includes("Acknowledgment");
                return (
                  <label className={`family-field ${isLong ? "full" : ""}`} key={`${activeForm.id}-${label}`}>
                    <span>{label}</span>
                    {isLong ? (
                      <textarea
                        name={`field-${index}`}
                        onChange={(event) => onUpdateField(activeForm.id, index, event.target.value)}
                        value={value}
                      />
                    ) : (
                      <input
                        name={`field-${index}`}
                        onChange={(event) => onUpdateField(activeForm.id, index, event.target.value)}
                        value={value}
                      />
                    )}
                  </label>
                );
              })}
            </div>
            <div className="family-form-actions">
              <p className="family-helper-text">
                Sensitive entries are visible only to authorized case staff. SSN should
                be collected according to Marshall&apos;s approved policy.
              </p>
              <div className="family-row-actions">
                <button className="family-ghost-button" onClick={() => onSaveDraft(activeForm.id)} type="button">
                  Save draft
                </button>
                <button className="family-primary-button" type="submit">
                  Submit for staff review
                </button>
              </div>
            </div>
          </form>
        </section>
      )}
    </>
  );
}

function UploadCenter({
  onUpload,
  state
}: {
  onUpload: (event: FormEvent<HTMLFormElement>) => void;
  state: PortalState;
}) {
  return (
    <section className="family-two-column">
      <div className="family-form-panel">
        <h2>Upload documents and photos</h2>
        <p className="family-helper-text">
          Accepted MVP categories: ID, DD214, cemetery paperwork, obituary photo,
          family photo, miscellaneous document.
        </p>
        <form onSubmit={onUpload}>
          <div className="family-form-grid">
            <label className="family-field">
              <span>File name</span>
              <input name="name" placeholder="example-photo.jpg" required />
            </label>
            <label className="family-field">
              <span>Category</span>
              <select name="type">
                <option>ID</option>
                <option>DD214</option>
                <option>Cemetery</option>
                <option>Obituary photo</option>
                <option>Family photo</option>
                <option>Miscellaneous</option>
              </select>
            </label>
            <label className="family-field full">
              <span>Notes for staff</span>
              <textarea name="notes" placeholder="Anything staff should know about this file" />
            </label>
          </div>
          <div className="family-form-actions">
            <p className="family-helper-text">
              This demo records upload metadata. A production version stores files
              privately with malware scanning and expiring access links.
            </p>
            <button className="family-primary-button" type="submit">
              Add upload record
            </button>
          </div>
        </form>
      </div>
      <div className="family-panel">
        <h2>Received files</h2>
        <div className="family-task-list">
          {state.case.uploads.map((upload, index) => (
            <div className="family-upload-row" key={`${upload.name}-${index}`}>
              <div>
                <strong>{upload.name}</strong>
                <div className="family-meta">
                  {upload.type} - {upload.status}
                </div>
              </div>
              <span className="family-mini-chip">Private</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PostArrangement({
  indicator,
  onChangeRequest,
  onRequestCategory,
  state
}: {
  indicator: (status: string) => ReactNode;
  onChangeRequest: (event: FormEvent<HTMLFormElement>) => void;
  onRequestCategory: (category: string) => void;
  state: PortalState;
}) {
  return (
    <>
      <section className="family-section-title">
        <div>
          <h1>Post-Arrangement</h1>
          <p>View what is currently selected and request changes before staff finalizes production details.</p>
        </div>
        <button className="family-primary-button" onClick={() => onRequestCategory("Service details")} type="button">
          Request change
        </button>
      </section>
      <section className="family-two-column">
        <div className="family-panel">
          <h2>Service details</h2>
          <div className="family-data-list">
            {Object.entries(state.case.service).map(([key, value]) => (
              <div className="family-data-row" key={key}>
                <strong>{titleCase(key)}</strong>
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
              <span>{state.case.caseStatus}</span>
            </div>
            <div className="family-timeline-item">
              <strong>Death certificate</strong>
              <span>{state.case.deathCertificateStatus}</span>
            </div>
            <div className="family-timeline-item">
              <strong>Obituary</strong>
              <span>Draft waiting on family confirmation</span>
            </div>
          </div>
        </div>
      </section>
      <section className="family-three-column family-section-gap">
        <div className="family-panel">
          <h2>Selections</h2>
          <div className="family-data-list">
            {state.case.selectedItems.map(([item, value]) => (
              <div className="family-data-row" key={item}>
                <strong>{item}</strong>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="family-panel">
          <h2>Obituary draft</h2>
          <p className="family-helper-text">{state.case.obituaryDraft}</p>
          <button className="family-ghost-button" onClick={() => onRequestCategory("Obituary")} type="button">
            Request obituary edit
          </button>
        </div>
        <div className="family-panel">
          <h2>Photos submitted</h2>
          <div className="family-task-list">
            {state.case.photos.map((photo) => (
              <div className="family-task" key={photo}>
                {indicator("Reviewed")}
                <strong>{photo}</strong>
                <span className="family-mini-chip">Received</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="family-form-panel family-section-gap" id="change-request">
        <div className="family-panel-header">
          <h2>Requests for changes or updates</h2>
          <span className="family-mini-chip">
            {state.case.changeRequests.filter((request) => request.status === "Open").length} open
          </span>
        </div>
        <form onSubmit={onChangeRequest}>
          <div className="family-form-grid">
            <label className="family-field">
              <span>Category</span>
              <select name="category">
                <option>Service details</option>
                <option>Obituary</option>
                <option>Photos</option>
                <option>Flowers</option>
                <option>Programs</option>
                <option>Transportation</option>
                <option>Other</option>
              </select>
            </label>
            <label className="family-field">
              <span>Urgency</span>
              <select name="urgency">
                <option>Normal</option>
                <option>Time sensitive</option>
              </select>
            </label>
            <label className="family-field full">
              <span>Request details</span>
              <textarea name="text" required placeholder="Describe the update you would like staff to review" />
            </label>
          </div>
          <div className="family-form-actions">
            <p className="family-helper-text">Urgent changes should also be confirmed by phone.</p>
            <button className="family-primary-button" type="submit">
              Send request
            </button>
          </div>
        </form>
        <div className="family-task-list">
          {state.case.changeRequests.map((request, index) => (
            <div className="family-request-row" key={`${request.category}-${index}`}>
              <div>
                <strong>{request.category}</strong>
                <div>{request.text}</div>
              </div>
              <span className="family-status-chip">{request.status}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Aftercare({
  onAftercare,
  onCategory,
  state
}: {
  onAftercare: (event: FormEvent<HTMLFormElement>) => void;
  onCategory: (category: string) => void;
  state: PortalState;
}) {
  return (
    <>
      <section className="family-section-title">
        <div>
          <h1>Aftercare</h1>
          <p>
            Request continued assistance after services, including certificates,
            markers, flowers, memorial links, and grief support.
          </p>
        </div>
        <span className="family-status-chip">{state.case.deathCertificateStatus}</span>
      </section>
      <section className="family-three-column">
        <div className="family-panel">
          <h2>Death certificate status</h2>
          <p className="family-helper-text">{state.case.deathCertificateStatus}</p>
          <button className="family-ghost-button" onClick={() => onCategory("Death certificates")} type="button">
            Request certificate update
          </button>
        </div>
        <div className="family-panel">
          <h2>Memorial video links</h2>
          <p className="family-helper-text">
            Staff can add private or public links here when the video is ready.
          </p>
          <button className="family-ghost-button" onClick={() => onCategory("Memorial video")} type="button">
            Ask about video
          </button>
        </div>
        <div className="family-panel">
          <h2>Grief support resources</h2>
          <div className="family-resource-list">
            <div className="family-resource-item">
              <strong>Local support call</strong>
              <span>Request a staff follow-up for nearby options.</span>
            </div>
            <div className="family-resource-item">
              <strong>Faith community support</strong>
              <span>Ask staff to coordinate with clergy or church care teams.</span>
            </div>
            <div className="family-resource-item">
              <strong>Family check-in</strong>
              <span>Schedule a future assistance call.</span>
            </div>
          </div>
        </div>
      </section>
      <section className="family-form-panel family-section-gap">
        <h2>Request future assistance</h2>
        <form onSubmit={onAftercare}>
          <div className="family-form-grid">
            <label className="family-field">
              <span>Request type</span>
              <select name="category">
                <option>Death certificates</option>
                <option>Holiday flowers</option>
                <option>Headstone or marker help</option>
                <option>Memorial video</option>
                <option>Grief support</option>
                <option>Future assistance</option>
              </select>
            </label>
            <label className="family-field">
              <span>Preferred contact</span>
              <select name="contact">
                <option>Phone</option>
                <option>Email</option>
                <option>Text</option>
              </select>
            </label>
            <label className="family-field full">
              <span>How can Marshall help?</span>
              <textarea name="text" required />
            </label>
          </div>
          <div className="family-form-actions">
            <p className="family-helper-text">
              Requests are reviewed by staff. Pricing and payments, if any, are handled outside this MVP portal.
            </p>
            <button className="family-primary-button" type="submit">
              Send aftercare request
            </button>
          </div>
        </form>
        <div className="family-task-list">
          {state.case.aftercareRequests.map((request, index) => (
            <div className="family-request-row" key={`${request.category}-${index}`}>
              <div>
                <strong>{request.category}</strong>
                <div>{request.text}</div>
              </div>
              <span className="family-status-chip">{request.status}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
