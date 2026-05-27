import { FamilyPortal } from "@/components/family/family-portal";

export default function FamilyPreviewPage() {
  return (
    <main className="family-preview-page">
      <style>
        {`
          .family-preview-page .family-content {
            display: flex;
            flex-direction: column;
          }

          .family-preview-page .family-metric-grid {
            order: -1;
            margin: 0 0 22px;
          }

          .family-preview-page .family-hero {
            order: 0;
          }

          .family-preview-page .family-two-column {
            order: 1;
          }
        `}
      </style>
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
      <FamilyPortal
        assignedDirector="Marshall Funeral Home"
        familyContact="Next of Kin"
        lovedOneName="Name of Loved One"
        preferredPhone="601-442-6300"
        userId="preview-family"
      />
    </main>
  );
}
