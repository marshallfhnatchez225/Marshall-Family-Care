import { FamilyPreviewPortal } from "@/components/family/family-preview-portal";

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
      <FamilyPreviewPortal />
    </main>
  );
}
