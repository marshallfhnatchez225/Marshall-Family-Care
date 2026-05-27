"use client";

import { useEffect } from "react";

const immediateHelpText =
  "Need immediate help? Call Marshall Funeral Home at (601) 442-6300 or (601) 384-2732.";

function updateContactNumbers() {
  const footerNotes = document.querySelectorAll(".family-footer-note");

  footerNotes.forEach((note) => {
    if (note.textContent?.includes("Need immediate help?")) {
      note.textContent = immediateHelpText;
    }
  });
}

export function ContactNumberHelper() {
  useEffect(() => {
    updateContactNumbers();

    const observer = new MutationObserver(() => updateContactNumbers());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
