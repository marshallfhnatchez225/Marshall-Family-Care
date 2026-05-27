"use client";

import Link from "next/link";
import { useState } from "react";
import type { StaffFamilyRecord } from "@/lib/family-admin";

type ViewKey = "home" | "pre" | "post" | "aftercare";

type ViewAsFamilyPortalProps = {
  family: StaffFamilyRecord;
};

function value(text: string | null | undefined, fallback = "Not added yet") {
  return text?.trim() || fallback;
}

function StatusDot({ complete = false }: { complete?: boolean }) {
  return <span className={complete ? "family-complete-indicator" : "family-complete-indicator open"}>{complete ? "OK" : "-"}</span>;
}

export function ViewAsFamilyPortal({ family }: ViewAsFamilyPortalProps) {
  const [view, setView] = useState<ViewKey>("home");
  const progress = family.portal_progress ?? 0;
  const lovedOne = value(family.loved_one_name, "Loved one not set");
  const nextOfKin = value(family.full_name, "Next of kin not set");
  const phone = value(family.preferred_phone, "Phone number not set");
  const director = value(family.assigned_director, "Not assigned");
  const status = value(family.portal_status, "Not started");

  const nav: { id: ViewKey; label: string; meta: string; complete?: boolean }[] = [
    { id: "home", label: "Case home", meta: "Overview", complete: true },
    { id: "pre", label: "Pre-Arrangement", meta: `${progress}%` },
    { id: "post", label: "Post-Arrangement", meta: "Current" },
    { id: "aftercare", label: "Aftercare", meta: "Support" }
  ];

  return (
    <main className="family-portal staff-view-as-family">
      <aside className="family-sidebar">
        <section className="family-case-card">
          <span className="family-status-chip">Staff view-only mode</span>
          <h2>{lovedOne}</h2>
          <p>Next of kin: {nextOfKin}</p>
          <p>Director: {director}</p>
          <div className="family-progress-bar" aria-label="Form completion">
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>
        <nav className="family-sidebar-nav" aria-label="Family portal preview navigation">
          {nav.map((item) => (
            <button
              className={`family-nav-button ${view === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setView(item.id)}
              type="button"
            >
              <span className="family-nav-label">
                <StatusDot complete={item.complete} />
                <span>{item.label}</span>
              </span>
              <span className="family-mini-chip">{item.meta}</span>
            </button>
          ))}
        </nav>
        <Link className="family-sign-out-button" href={`/dashboard/families/${family.id}`}>
          Return to staff dashboard
        </Link>
        <div className="family-footer-note">
          Need immediate help? Call Marshall Funeral Home at (601) 442-6300 or (601) 384-2732.
        </div>
      </aside>
      <section className="family-content">
        {view === "home" ? (
          <>
            <section className="family-hero">
              <div>
                <span className="family-status-chip">{status}</span>
                <h1>Welcome, {nextOfKin.split(" ")[0]}</h1>
                <p>
                  This is the family-facing view for staff review. Information shown here is read-only in staff preview mode.
                </p>
                <div className="family-row-actions">
                  <button className="family-primary-button" onClick={() => setView("pre")} type="button">
                    View forms
                  </button>
                  <button className="family-ghost-button" onClick={() => setView("post")} type="button">
                    Review selections
                  </button>
                  <button className="family-ghost-button" onClick={() => setView("aftercare")} type="button">
                    Aftercare help
                  </button>
                </div>
              </div>
              <aside className="family-hero-panel">
                <strong>Next requested action</strong>
                <p>Staff can update requests and case details from the staff dashboard.</p>
                <Link className="family-primary-button" href="/dashboard/family-access">
                  Manage access
                </Link>
              </aside>
            </section>
            <section className="family-metric-grid">
              <div className="family-metric">
                <strong>{progress}%</strong>
                <span>Pre-arrangement complete</span>
              </div>
              <div className="family-metric">
                <strong>{family.open_requests ?? 0}</strong>
                <span>Open requests</span>
              </div>
              <div className="family-metric">
                <strong>0</strong>
                <span>Uploads received</span>
              </div>
              <div className="family-metric">
                <strong>View</strong>
                <span>Staff preview mode</span>
              </div>
            </section>
            <section className="family-two-column">
              <div className="family-panel">
                <h2>Current checklist</h2>
                <div className="family-task-list">
                  {["Death certificate information", "Obituary information", "Permission to embalm", "General family information", "Next of kin information", "Veteran, church, cemetery details"].map((label) => (
                    <div className="family-task" key={label}>
                      <StatusDot />
                      <div>
                        <strong>{label}</strong>
                        <div className="family-meta">Ready for family entry</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="family-panel">
                <h2>Family contact</h2>
                <div className="family-data-list">
                  <div className="family-data-row"><strong>Loved one</strong><span>{lovedOne}</span></div>
                  <div className="family-data-row"><strong>Next of kin</strong><span>{nextOfKin}</span></div>
                  <div className="family-data-row"><strong>Phone number</strong><span>{phone}</span></div>
                  <div className="family-data-row"><strong>Assigned director</strong><span>{director}</span></div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {view === "pre" ? (
          <>
            <section className="family-section-title">
              <div>
                <h1>Pre-Arrangement</h1>
                <p>View the family-facing form sections. Staff edits should be made from staff tools.</p>
              </div>
              <span className="family-status-chip">View only</span>
            </section>
            <section className="family-form-panel">
              <h2>Pre-arrangement forms</h2>
              <div className="family-form-grid">
                {[
                  ["Legal name", lovedOne],
                  ["Informant / next of kin", nextOfKin],
                  ["Phone", phone],
                  ["Service preferences", "To be added by family or staff"],
                  ["Veteran / church / cemetery", "To be added by family or staff"],
                  ["Uploads", "No files shown in staff preview"]
                ].map(([label, fieldValue]) => (
                  <label className="family-field" key={label}>
                    <span>{label}</span>
                    <input readOnly value={fieldValue} />
                  </label>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {view === "post" ? (
          <>
            <section className="family-section-title">
              <div>
                <h1>Post-Arrangement</h1>
                <p>View what the family will see once staff enters current selections.</p>
              </div>
              <span className="family-status-chip">{status}</span>
            </section>
            <section className="family-three-column">
              <div className="family-panel">
                <h2>Service details</h2>
                <p className="family-helper-text">To be added by staff.</p>
              </div>
              <div className="family-panel">
                <h2>Selections</h2>
                <p className="family-helper-text">Casket, vault, flowers, programs, transportation, and video selections will appear here.</p>
              </div>
              <div className="family-panel">
                <h2>Obituary draft</h2>
                <p className="family-helper-text">No obituary draft has been added yet.</p>
              </div>
            </section>
          </>
        ) : null}

        {view === "aftercare" ? (
          <>
            <section className="family-section-title">
              <div>
                <h1>Aftercare</h1>
                <p>View certificate status, memorial links, and future assistance areas.</p>
              </div>
              <span className="family-status-chip">View only</span>
            </section>
            <section className="family-three-column">
              <div className="family-panel">
                <h2>Death certificate status</h2>
                <p className="family-helper-text">Not started</p>
              </div>
              <div className="family-panel">
                <h2>Memorial video links</h2>
                <p className="family-helper-text">Staff can add private or public links when ready.</p>
              </div>
              <div className="family-panel">
                <h2>Grief support resources</h2>
                <div className="family-resource-list">
                  <div className="family-resource-item"><strong>Local support call</strong><span>Request a staff follow-up for nearby options.</span></div>
                  <div className="family-resource-item"><strong>Faith community support</strong><span>Coordinate with clergy or church care teams.</span></div>
                  <div className="family-resource-item"><strong>Future assistance</strong><span>Schedule a later check-in.</span></div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
