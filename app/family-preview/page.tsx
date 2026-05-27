import { FamilyPortal } from "@/components/family/family-portal";

export default function FamilyPreviewPage() {
  return (
    <main className="family-preview-page">
      <section className="preview-notice" aria-label="Preview mode notice">
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
