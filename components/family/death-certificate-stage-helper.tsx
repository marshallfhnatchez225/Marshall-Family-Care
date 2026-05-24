"use client";

import { useEffect } from "react";

const storagePrefix = "marshall-family-portal";

const deathCertificateStages = [
  "Not started",
  "Information needed from family",
  "Ready for staff review",
  "Filed with the state",
  "Waiting on state approval",
  "Certified copies ordered",
  "Certified copies ready for pickup",
  "Completed"
];

function getPortalStorageKeys() {
  return Object.keys(window.localStorage).filter((key) => key.startsWith(storagePrefix));
}

function getCurrentStatus() {
  for (const key of getPortalStorageKeys()) {
    const value = window.localStorage.getItem(key);
    if (!value) continue;

    try {
      const parsed = JSON.parse(value) as { case?: { deathCertificateStatus?: string } };
      if (parsed.case?.deathCertificateStatus) {
        return parsed.case.deathCertificateStatus;
      }
    } catch {
      // Ignore unrelated or older saved portal values.
    }
  }

  return "Filed with the state, waiting on certified copies";
}

function updateSavedStatus(status: string) {
  const keys = getPortalStorageKeys();
  const targetKeys = keys.length > 0 ? keys : [storagePrefix];

  for (const key of targetKeys) {
    const value = window.localStorage.getItem(key);
    if (!value) continue;

    try {
      const parsed = JSON.parse(value) as { case?: { deathCertificateStatus?: string } };
      if (parsed.case) {
        parsed.case.deathCertificateStatus = status;
        window.localStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch {
      // Ignore unrelated or older saved portal values.
    }
  }
}

function injectStyles() {
  if (document.getElementById("death-certificate-stage-styles")) return;

  const style = document.createElement("style");
  style.id = "death-certificate-stage-styles";
  style.textContent = `
    .death-certificate-stage-picker {
      display: grid;
      gap: 12px;
      margin: 16px 0;
      padding: 14px;
      border: 1px solid rgba(216, 173, 47, 0.42);
      border-radius: 8px;
      background: #fff8e8;
    }

    .death-certificate-stage-picker strong {
      color: #3b111b;
    }

    .death-certificate-stage-picker p {
      margin: 0;
      color: #657174;
      line-height: 1.45;
    }

    .death-certificate-stage-options {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .death-certificate-stage-button {
      min-height: 38px;
      padding: 8px 11px;
      border: 1px solid #ead7b1;
      border-radius: 999px;
      background: #ffffff;
      color: #3b111b;
      cursor: pointer;
      font-weight: 800;
    }

    .death-certificate-stage-button:hover,
    .death-certificate-stage-button.active {
      border-color: rgba(255, 231, 155, 0.88);
      background: linear-gradient(135deg, #ffe79b, #d8ad2f, #9d6f09);
      color: #3b111b;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.62);
    }
  `;
  document.head.appendChild(style);
}

function buildPicker() {
  const currentStatus = getCurrentStatus();
  const wrapper = document.createElement("div");
  wrapper.className = "death-certificate-stage-picker";
  wrapper.setAttribute("data-death-certificate-stage-picker", "true");

  const heading = document.createElement("strong");
  heading.textContent = "Death certificate stage";
  wrapper.appendChild(heading);

  const note = document.createElement("p");
  note.textContent = "Choose a preselected stage. The portal will save it and refresh the case status.";
  wrapper.appendChild(note);

  const options = document.createElement("div");
  options.className = "death-certificate-stage-options";

  for (const stage of deathCertificateStages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `death-certificate-stage-button ${currentStatus === stage ? "active" : ""}`.trim();
    button.textContent = stage;
    button.addEventListener("click", () => {
      updateSavedStatus(stage);
      window.location.reload();
    });
    options.appendChild(button);
  }

  wrapper.appendChild(options);
  return wrapper;
}

function addPickerAfter(element: Element | null) {
  if (!element || element.parentElement?.querySelector("[data-death-certificate-stage-picker='true']")) {
    return;
  }

  element.insertAdjacentElement("afterend", buildPicker());
}

function attachPickers() {
  injectStyles();

  const headings = Array.from(document.querySelectorAll("h2"));
  const deathCertificateFormHeading = headings.find(
    (heading) => heading.textContent?.trim() === "Death Certificate Information"
  );
  const deathCertificateStatusHeading = headings.find(
    (heading) => heading.textContent?.trim() === "Death certificate status"
  );

  const formPanelHeader = deathCertificateFormHeading?.closest(".family-panel-header");
  addPickerAfter(formPanelHeader ?? null);

  const statusPanelText = deathCertificateStatusHeading
    ?.closest(".family-panel")
    ?.querySelector(".family-helper-text");
  addPickerAfter(statusPanelText ?? null);
}

export function DeathCertificateStageHelper() {
  useEffect(() => {
    attachPickers();

    const observer = new MutationObserver(() => attachPickers());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
