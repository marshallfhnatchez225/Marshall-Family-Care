"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { signOut } from "@/app/(auth)/login/actions";
import { updateFamilyProgress } from "@/app/dashboard/family-progress/actions";

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
      ["Staff note", "Confirm Marcus phone number"]
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

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "Family";
}

function buildInitialState({
  assignedDirector,
  familyContact,
  lovedOneName,
  preferredPhone
}: FamilyPortalProps): PortalState {
  const contact = familyContact || "Family Contact";
  const contactFirstName = firstName(contact);
  const decedent = lovedOneName || "Your Loved One";
  const decedentFirstName = firstName(decedent);
  const director = assignedDirector || "Marshall Funeral Home Staff";
  const forms = formDefinitions.map((form) => ({
    ...form,
    fields: form.fields.map(([label, value]) => {
      if (label === "Legal name") return [label, decedent];
      if (label === "Primary contact") return [label, contact];
      if (label === "Preferred phone") return [label, preferredPhone || ""];
      if (label === "Email") return [label, ""];
      if (label === "Informant") return [label, contact];
      if (label === "Opening life story") {
        return [label, `${decedentFirstName} will be remembered for faith, family, and service.`];
      }
      if (label === "Authorizing person") return [label, contact];
      if (label === "Phone") return [label, preferredPhone || ""];
      if (label === "Primary next of kin") return [label, contact];
      return [label, value];
    })
  }));

  return {
    familyView: "home",
    selectedFormId: "death-certificate",
    case: {
      decedent,
      familyContact: contact,
      contactPhone: preferredPhone || "",
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
  const portalStatus =
    completionPercent >= 100
      ? "Pre-arrangement complete"
      : reviewCount > 0
        ? "Needs staff review"
        : "In progress";

  useEffect(() => {
    if (!isLoaded) return;

    void updateFamilyProgress({
      lastPortalActivity: new Date().toISOString(),
      openRequests,
      portalProgress: completionPercent,
      portalStatus
    });
  }, [completionPercent, isLoaded, openRequests, portalStatus]);

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
    const text = String(formData.get("text") ?? "").trim();
    const urgency = String(formData.get("urgency") ?? "Normal");
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
    const text = String(formData.get("text") ?? "").trim();
    const contact = String(formData.get("contact") ?? "Phone");
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
          <Link className="family-nav-button family-account-link" href="/dashboard/account">
            <span className="family-nav-label">
              {indicator("Reviewed")}
              <span>Change Password</span>
            </span>
            <span className="family-mini-chip">Account</span>
          </Link>
        </nav>
        <form action={signOut}>
          <button className="family-sign-out-button" type="submit">
            Log out
          </button>
        </form>
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
          <h1>Welcome, {firstName(state.case.familyContact)}</h1>
          <p>
            This portal keeps the most important arrangement details in one place. Save
            drafts as you go; Marshall Funeral Home staff will review each submission before it
            becomes part of the official file.
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
          <p>Review the next of kin details and confirm family contact information.</p>
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
        <FamilyGuidedForm
          form={activeForm}
          onSaveDraft={onSaveDraft}
          onSubmitReview={onSubmitReview}
          onUpdateField={onUpdateField}
        />
      )}
    </>
  );
}

function FamilyGuidedForm({
  form,
  onSaveDraft,
  onSubmitReview,
  onUpdateField
}: {
  form: FamilyForm;
  onSaveDraft: (formId: string) => void;
  onSubmitReview: (formId: string) => void;
  onUpdateField: (formId: string, index: number, value: string) => void;
}) {
  return (
    <section className="family-form-panel">
      <div className="family-panel-header">
        <div>
          <h2>{form.title}</h2>
          <p>Status: {form.status}</p>
        </div>