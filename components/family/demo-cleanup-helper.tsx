"use client";

import { useEffect } from "react";

const storagePrefix = "marshall-family-portal";

const demoMarkers = [
  "1948-03-12",
  "2026-05-03",
  "Jackson, Mississippi",
  "1220 Pine Ridge Road",
  "Retired educator",
  "Thomas Hinton",
  "New Hope Missionary Baptist Church",
  "Rev. Samuel Turner",
  "Garden Memorial Park",
  "Cedarview Oak",
  "white lilies",
  "scholarship fund",
  "companion marker",
  "cemetery-paperwork.jpg",
  "Family remembrance photo"
];

const serviceTemplate = {
  date: "To be added by staff",
  time: "To be added by staff",
  location: "To be added by staff",
  visitation: "To be added by staff",
  cemetery: "To be added by staff",
  clergy: "To be added by staff"
};

const selectedItemsTemplate: [string, string][] = [
  ["Casket", "To be added by staff"],
  ["Vault", "To be added by staff"],
  ["Flowers", "To be added by staff"],
  ["Programs", "To be added by staff"],
  ["Transportation", "To be added by staff"],
  ["Video", "To be added by staff"]
];

const blankDemoValues = new Set([
  "1948-03-12",
  "2026-05-03",
  "Jackson, Mississippi",
  "1220 Pine Ridge Road, Jackson, MS",
  "Widowed",
  "Some college",
  "Retired educator",
  "Thomas Hinton and Leola Price Hinton",
  "Daughter / next of kin",
  "Text for urgent items, email for documents",
  "Both children are coordinating together",
  "No known dispute",
  "Not a veteran",
  "New Hope Missionary Baptist Church",
  "Rev. Samuel Turner",
  "Garden Memorial Park",
  "Section B, Lot 18",
  "Church choir requested",
  "Please share with family before newspaper submission"
]);

function hasDemoContent(value: string) {
  return demoMarkers.some((marker) => value.includes(marker));
}

function sanitizeStoredPortal(value: string) {
  const parsed = JSON.parse(value) as any;
  const caseRecord = parsed.case;

  if (caseRecord) {
    caseRecord.caseStatus = "Case opened - staff review pending";
    caseRecord.deathCertificateStatus = "Not started";
    caseRecord.service = serviceTemplate;
    caseRecord.selectedItems = selectedItemsTemplate;
    caseRecord.obituaryDraft = "No obituary draft has been added yet.";
    caseRecord.photos = [];
    caseRecord.uploads = [];
    caseRecord.changeRequests = [];
    caseRecord.aftercareRequests = [];
    caseRecord.messages = [
      {
        from: caseRecord.assignedDirector || "Marshall Family Care Staff",
        text: "Welcome to the Marshall Family Care Portal. Staff will add case details as they are confirmed."
      }
    ];
  }

  if (Array.isArray(parsed.forms)) {
    parsed.forms = parsed.forms.map((form: any) => ({
      ...form,
      status: form.status === "Reviewed" ? "Not submitted" : form.status,
      fields: Array.isArray(form.fields)
        ? form.fields.map(([label, fieldValue]: [string, string]) => {
            if (blankDemoValues.has(fieldValue) || fieldValue?.includes("will be remembered with care")) {
              return [label, ""];
            }
            if (label === "Staff note") return [label, ""];
            if (label === "Billing contact") return [label, ""];
            if (label === "Relationship order notes") return [label, ""];
            return [label, fieldValue];
          })
        : form.fields
    }));
  }

  return JSON.stringify(parsed);
}

function sanitizeLocalStorage() {
  let changed = false;

  Object.keys(window.localStorage)
    .filter((key) => key.startsWith(storagePrefix))
    .forEach((key) => {
      const value = window.localStorage.getItem(key);
      if (!value || !hasDemoContent(value)) return;

      try {
        window.localStorage.setItem(key, sanitizeStoredPortal(value));
        changed = true;
      } catch {
        // Leave unrelated saved values untouched.
      }
    });

  if (changed && !window.sessionStorage.getItem("marshall-demo-cleanup-reloaded")) {
    window.sessionStorage.setItem("marshall-demo-cleanup-reloaded", "true");
    window.location.reload();
  }
}

function updateVisibleCopy() {
  const replacements: [string, string][] = [
    ["Reset demo data", "Clear saved entries"],
    [
      "This demo records upload metadata. A production version stores files privately with malware scanning and expiring access links.",
      "Upload records are saved for staff review. Files should be stored privately with malware scanning and expiring access links."
    ],
    [
      "Pricing and payments, if any, are handled outside this MVP portal.",
      "Pricing and payments, if any, are handled directly with Marshall Funeral Home staff."
    ]
  ];

  document.querySelectorAll("button, p").forEach((element) => {
    const text = element.textContent?.replace(/\s+/g, " ").trim();
    const replacement = replacements.find(([from]) => text === from);
    if (replacement) {
      element.textContent = replacement[1];
    }
  });
}

export function DemoCleanupHelper() {
  useEffect(() => {
    const runCleanup = () => {
      sanitizeLocalStorage();
      updateVisibleCopy();
    };

    runCleanup();
    const delayed = window.setTimeout(runCleanup, 600);

    const observer = new MutationObserver(runCleanup);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.clearTimeout(delayed);
      observer.disconnect();
    };
  }, []);

  return null;
}
