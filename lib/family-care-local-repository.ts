import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { CaseStatus, FamilyCase, SectionKey, SectionStatus, TimelineEvent } from "./family-care-types";
import { hashFamilyToken, issueFamilyToken } from "./family-care-security";

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "family-care.json");
const uploadDir = path.join(dataDir, "uploads");
async function readCases(): Promise<FamilyCase[]> { try { return JSON.parse(await fs.readFile(dataFile, "utf8")); } catch { return []; } }
async function writeCases(cases: FamilyCase[]) { await fs.mkdir(dataDir, { recursive: true }); await fs.writeFile(dataFile, JSON.stringify(cases, null, 2), { mode: 0o600 }); }
function event(actor: string, type: TimelineEvent["type"], detail: string): TimelineEvent { return { id: randomUUID(), at: new Date().toISOString(), actor, type, detail }; }
export async function listFamilyCases() { return readCases(); }
export async function createFamilyCase(input: { decedentName: string; familyEmail: string; owner: string; nextPromisedUpdate: string; actor: string }) {
  if (!process.env.MARSHALL_LINK_SECRET) throw new Error("Family link security is not configured.");
  const cases = await readCases(); const issued = issueFamilyToken(); const createdAt = new Date().toISOString();
  const sections = Object.fromEntries(["general", "obituary", "deathCertificate", "embalming"].map((key) => [key, { status: "incomplete", data: {} }])) as FamilyCase["sections"];
  const item: FamilyCase = { id: randomUUID(), ...input, createdAt, sections, access: { tokenHash: issued.tokenHash, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() }, timeline: [event(input.actor, "case", `Created private case and assigned ${input.owner}.`), event(input.actor, "access", "Generated a scoped 7-day family access link.")] };
  cases.unshift(item); await writeCases(cases); return { item, token: issued.token };
}
export async function createPacketInvitation(input: { familyEmail?: string; familyMobile: string; smsConsentAt: string; owner: string; actor: string }) {
  const result = await createFamilyCase({ decedentName: "Awaiting family packet", familyEmail: input.familyEmail || "", owner: input.owner, nextPromisedUpdate: new Date(Date.now() + 2 * 86400000).toISOString(), actor: input.actor });
  const cases = await readCases(); const item = cases.find((entry) => entry.id === result.item.id)!;
  item.packetState = "sent";
  item.familyMobile = input.familyMobile;
  item.smsConsentAt = input.smsConsentAt;
  item.deliveryState = "queued-ready";
  item.timeline.unshift(event(input.actor, "communication", `Consent recorded and SMS-ready packet queued for ${input.familyMobile}; no text was sent because no SMS provider is configured.`));
  await writeCases(cases); return { item, token: result.token };
}
export async function getCaseByToken(token: string, recordOpen = true) {
  if (!token || !process.env.MARSHALL_LINK_SECRET) return { state: "invalid" as const };
  const cases = await readCases(); const item = cases.find((entry) => entry.access.tokenHash === hashFamilyToken(token));
  if (!item) return { state: "invalid" as const };
  if (item.access.revokedAt) return { state: "revoked" as const, item };
  if (new Date(item.access.expiresAt).getTime() <= Date.now()) return { state: "expired" as const, item };
  if (recordOpen) { item.access.lastOpenedAt = new Date().toISOString(); item.timeline.unshift(event("Family link", "access", "Family packet opened.")); await writeCases(cases); }
  return { state: "active" as const, item };
}
export async function updateSection(token: string, section: SectionKey, data: Record<string, string>, submit: boolean) {
  const cases = await readCases(); const item = cases.find((entry) => entry.access.tokenHash === hashFamilyToken(token));
  if (!item || item.access.revokedAt || new Date(item.access.expiresAt).getTime() <= Date.now()) throw new Error("Access link is not active.");
  item.sections[section] = { data, status: submit ? "submitted" : "incomplete", updatedAt: new Date().toISOString() };
  if (submit) { item.packetState = "submitted"; item.packetSubmittedAt = new Date().toISOString(); }
  const detail = section === "embalming" && submit ? "Submitted electronic authorization pending staff review; signature record retained with the case file." : `${submit ? "Submitted" : "Saved"} ${section} section.`;
  item.timeline.unshift(event("Family", submit ? "submission" : "save", detail)); await writeCases(cases); return item;
}
export async function attachPacketToCase(id: string, targetCaseId: string | undefined, actor: string) {
  const cases = await readCases(); const packet = cases.find((entry) => entry.id === id); if (!packet) throw new Error("Packet not found.");
  const general = packet.sections.general.data; const obituary = packet.sections.obituary.data;
  const decedentName = general.fullName || obituary.name || packet.decedentName;
  if (targetCaseId) {
    const target = cases.find((entry) => entry.id === targetCaseId); if (!target) throw new Error("Target case not found.");
    for (const key of Object.keys(packet.sections) as SectionKey[]) {
      target.sections[key] = { ...packet.sections[key], data: { ...target.sections[key].data, ...packet.sections[key].data } };
    }
    target.decedentName = decedentName; target.familyEmail = packet.familyEmail; target.familyMobile = packet.familyMobile; target.smsConsentAt = packet.smsConsentAt;
    target.timeline.unshift(event(actor, "case", `Attached submitted family packet from ${packet.familyEmail} without re-entering answers.`));
    packet.attachedCaseId = target.id;
  } else {
    packet.decedentName = decedentName; packet.attachedCaseId = packet.id;
  }
  packet.packetState = "attached";
  packet.timeline.unshift(event(actor, "case", targetCaseId ? `Attached packet to Family Care case ${targetCaseId}.` : "Created Family Care case from submitted packet without re-entering answers."));
  await writeCases(cases); return packet;
}
export async function saveArrangementSheet(id: string, data: Record<string, string>, actor: string) {
  const cases = await readCases(); const item = cases.find((entry) => entry.id === id); if (!item) throw new Error("Family packet not found.");
  item.arrangementSheet = data; item.arrangementUpdatedAt = new Date().toISOString();
  item.timeline.unshift(event(actor, "save", "Saved the staff Arrangement Sheet.")); await writeCases(cases); return item;
}
export async function updateCaseReview(id: string, section: SectionKey, status: SectionStatus, actor: string) {
  const cases = await readCases(); const item = cases.find((entry) => entry.id === id); if (!item) throw new Error("Case not found.");
  item.sections[section].status = status; item.sections[section].updatedAt = new Date().toISOString(); item.timeline.unshift(event(actor, "review", `Marked ${section} ${status}.`)); await writeCases(cases);
}
export async function revokeCaseLink(id: string, actor: string) {
  const cases = await readCases(); const item = cases.find((entry) => entry.id === id); if (!item) throw new Error("Case not found.");
  item.access.revokedAt = new Date().toISOString(); item.timeline.unshift(event(actor, "access", "Revoked family access link.")); await writeCases(cases);
}
export async function updateCaseStatus(id: string, status: CaseStatus, actor: string) {
  const cases = await readCases(); const item = cases.find((entry) => entry.id === id); if (!item) throw new Error("Case not found.");
  item.caseStatus = status;
  const detail = status === "aftercare-ready" ? "Marked case ready for aftercare handoff." : status === "complete" ? "Completed Family Care case and recorded aftercare handoff." : "Returned case to active Family Care.";
  item.timeline.unshift(event(actor, "handoff", detail)); await writeCases(cases);
}
export async function resetLocalDemo(actor: string) {
  if (process.env.MARSHALL_DEMO_MODE !== "true") throw new Error("Local demo mode is not enabled.");
  if (!process.env.MARSHALL_LINK_SECRET) throw new Error("Family link security is not configured.");
  const issued = issueFamilyToken(); const now = Date.now();
  const at = (hoursAgo: number) => new Date(now - hoursAgo * 3600000).toISOString();
  const item: FamilyCase = {
    id: "demo-family-care-case",
    isDemo: true,
    demoAccessToken: issued.token,
    decedentName: "DEMO — Evelyn Rose Carter (Fictional)",
    familyEmail: "evelyn.carter.family@example.test",
    owner: "Jessica Marshall",
    nextPromisedUpdate: new Date(now + 20 * 3600000).toISOString(),
    createdAt: at(30),
    caseStatus: "aftercare-ready",
    packetState: "submitted",
    packetSubmittedAt: at(5),
    access: { tokenHash: issued.tokenHash, expiresAt: new Date(now + 7 * 86400000).toISOString(), lastOpenedAt: at(22) },
    photo: { originalName: "DEMO-fictional-portrait.jpg", storedName: "demo-only-no-public-file", size: 184320, type: "image/jpeg" },
    sections: {
      general: { status: "incomplete", updatedAt: at(21), data: { fullName: "Evelyn Rose Carter", usualResidence: "124 Demo Lane", state: "Mississippi", county: "Fiction County", city: "Example", placeOfDeath: "Example Regional Hospital", dateOfDeath: "2026-07-26", timeOfDeath: "18:42", dateOfBirth: "1942-03-14", age: "84", placeOfBirth: "Example, Mississippi", maritalStatus: "Widowed", education: "High school graduate", spouse: "Samuel Carter", father: "Henry Example", mother: "Louise Sample", occupation: "Elementary school teacher", business: "Fiction County Schools", veteran: "No", informantName: "Danielle Carter (Fictional)", informantAddress: "55 Sample Street, Example, MS", informantTelephone: "(555) 010-0184", insuranceInformation: "DEMO Mutual — fictional policy", policyNumber: "DEMO-44821", funeralDate: "2026-08-01", funeralTime: "11:00", funeralPlace: "Marshall Funeral Home Chapel", officiant: "", ministerNotified: "Yes", cemeteryName: "Fictional Memorial Gardens", cemeteryLocation: "Example, Mississippi" } },
      obituary: { status: "needs-follow-up", updatedAt: at(8), data: { name: "Evelyn Rose Carter", age: "84", address: "124 Demo Lane", city: "Example", state: "Mississippi", zip: "39000", dateOfDeath: "2026-07-26", placeOfDeath: "Example Regional Hospital", viewingDate: "2026-07-31", viewingTime: "16:00", viewingPlace: "Marshall Funeral Home Chapel", wakeDate: "2026-07-31", wakeTime: "18:00", wakePlace: "Marshall Funeral Home Chapel", serviceDate: "2026-08-01", serviceTime: "11:00", servicePlace: "Marshall Funeral Home Chapel", cemetery: "Fictional Memorial Gardens", dateOfBirth: "1942-03-14", placeOfBirth: "Example, Mississippi", parents: "Henry and Louise Sample", organizations: "Fictional Retired Educators Association; Demo Garden Club", lifeDetails: "DEMO: Evelyn was a fictional educator remembered for mentoring young readers and sharing roses from her garden.", precededInDeath: "Her fictional husband, Samuel Carter", survivors: "Daughter Danielle Carter; son Marcus Carter; four fictional grandchildren", contactName: "Danielle Carter (Fictional)", contactPhone: "(555) 010-0184", familyApproval: "I approve this obituary information for staff review" } },
      deathCertificate: { status: "submitted", updatedAt: at(7), data: { fullName: "Evelyn Rose Carter", age: "84", dateOfBirth: "1942-03-14", streetAddress: "124 Demo Lane", city: "Example", county: "Fiction County", state: "Mississippi", zip: "39000", placeOfBirth: "Example, Mississippi", withinCityLimits: "Yes", veteran: "No", fatherName: "Henry Example", motherFirst: "Louise", motherMiddle: "Mae", motherMaiden: "Sample", maritalStatus: "Widowed", survivingSpouse: "Samuel Carter", education: "Bachelor's Degree", occupation: "Elementary school teacher", industry: "Public education", informantName: "Danielle Carter (Fictional)", relationship: "Daughter", mailingAddress: "55 Sample Street, Example, MS 39000", email: "danielle.carter@example.test", quantity: "4" } },
      embalming: { status: "approved", updatedAt: at(5), data: { decedentName: "Evelyn Rose Carter", permission: "YES - Permission Granted", representativeName: "Danielle Carter (Fictional)", relationship: "Daughter", date: "2026-07-27", attestation: "I confirm and attest to the statements above", signatureRecord: "DEMO ONLY — Danielle Carter / typed demonstration; not a legal e-signature" } },
    },
    timeline: [
      { id: randomUUID(), at: at(2), actor, type: "handoff", detail: "DEMO: Marked case ready for aftercare handoff." },
      { id: randomUUID(), at: at(5), actor: "Jessica Marshall", type: "review", detail: "DEMO: Approved Permission to Embalm after staff review." },
      { id: randomUUID(), at: at(7), actor: "Family (fictional)", type: "submission", detail: "DEMO: Submitted Death Certificate Worksheet requesting 4 copies ($41 total)." },
      { id: randomUUID(), at: at(8), actor: "Jessica Marshall", type: "communication", detail: "DEMO: Requested confirmation of obituary organization name; promised an update tomorrow morning." },
      { id: randomUUID(), at: at(10), actor: "Family (fictional)", type: "submission", detail: "DEMO: Submitted obituary with photo and family approval." },
      { id: randomUUID(), at: at(21), actor: "Family (fictional)", type: "save", detail: "DEMO: Saved General Information and chose to return later." },
      { id: randomUUID(), at: at(24), actor: "Jessica Marshall", type: "communication", detail: "DEMO: Previewed secure packet message; no email was sent." },
      { id: randomUUID(), at: at(30), actor, type: "case", detail: "DEMO: Created fictional private case and assigned Jessica Marshall." },
    ],
  };
  await writeCases([item]); return { item, token: issued.token };
}
export async function savePhoto(token: string, file: File) {
  const result = await getCaseByToken(token, false); if (result.state !== "active") throw new Error("Access link is not active.");
  const allowed = ["image/jpeg", "image/png", "image/webp"]; if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Photo must be JPG, PNG, or WebP and no larger than 5 MB.");
  await fs.mkdir(uploadDir, { recursive: true }); const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"; const storedName = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(uploadDir, storedName), Buffer.from(await file.arrayBuffer()), { mode: 0o600 });
  const cases = await readCases(); const item = cases.find((entry) => entry.id === result.item.id)!; item.photo = { originalName: path.basename(file.name), storedName, size: file.size, type: file.type }; item.timeline.unshift(event("Family", "save", "Uploaded an obituary photo to private development storage.")); await writeCases(cases);
}
