import { notFound } from "next/navigation";
import { deathCertificateCopyOptions, forms, isLongField } from "../form-data";

export function generateStaticParams() {
  return forms.map((form) => ({ formId: form.id }));
}

export default async function FamilyPreviewFormPage({ params }: { params: Promise<{ formId: string }> }) {
  const { formId } = await params;
  const form = forms.find((item) => item.id === formId);

  if (!form) {
    notFound();
  }

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
            <a className="family-nav-button" href="/family-preview#case-home">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Case home</span></span>
              <span className="family-mini-chip">Overview</span>
            </a>
            <a className="family-nav-button active" href="/family-preview#pre-arrangement">
              <span className="family-nav-label"><span className="family-complete-indicator pending">-</span><span>Pre-Arrangement</span></span>
              <span className="family-mini-chip">33%</span>
            </a>
            <a className="family-nav-button" href="/family-preview#post-arrangement">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Post-Arrangement</span></span>
              <span className="family-mini-chip">Current</span>
            </a>
            <a className="family-nav-button" href="/family-preview#aftercare">
              <span className="family-nav-label"><span className="family-complete-indicator">OK</span><span>Aftercare</span></span>
              <span className="family-mini-chip">Support</span>
            </a>
          </nav>

          <div className="family-footer-note">
            Need immediate help? Call Marshall Funeral Home at (601) 442-6300 or (601) 384-2732.
          </div>
        </aside>

        <section className="family-content">
          <section className="family-form-panel" id={`form-${form.id}`}>
            <div className="family-panel-header">
              <div>
                <a className="family-ghost-button" href="/family-preview#pre-arrangement">Back to forms</a>
                <h1 style={{ marginTop: 18 }}>{form.title}</h1>
                <p className="family-helper-text">Status: <strong>{form.status}</strong></p>
              </div>
              <span className="family-status-chip">{form.status}</span>
            </div>

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
                <a className="family-ghost-button" href="/family-preview#pre-arrangement">Back to forms</a>
                <a className="family-primary-button" href="/family-preview#post-arrangement">Next section</a>
              </div>
            </div>
          </section>
        </section>
      </main>
    </main>
  );
}
