"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentSession } from "@/lib/auth";
import { attachPacketToCase, createFamilyCase, createPacketInvitation, resetLocalDemo, revokeCaseLink, saveArrangementSheet, savePhoto, updateCaseReview, updateCaseStatus, updateSection } from "@/lib/family-care-repository";
import type { CaseStatus, SectionKey, SectionStatus } from "@/lib/family-care-types";
import { createHash } from "node:crypto";

export async function createCaseAction(formData: FormData) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  const result = await createFamilyCase({
    decedentName: String(formData.get("decedentName") || "").trim(),
    familyEmail: String(formData.get("familyEmail") || "").trim(),
    owner: String(formData.get("owner") || "").trim() || session.name,
    nextPromisedUpdate: String(formData.get("nextPromisedUpdate") || ""),
    actor: session.name,
  });
  redirect(`/dashboard/family-care?new=${result.item.id}&token=${encodeURIComponent(result.token)}`);
}
export async function createPacketAction(formData: FormData) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  const rawMobile = String(formData.get("familyMobile") || "").trim();
  const familyMobile = rawMobile.replace(/[^\d+]/g, "");
  if (!/^\+?[1-9]\d{9,14}$/.test(familyMobile)) throw new Error("Enter a valid family mobile number with area code.");
  if (formData.get("smsConsent") !== "yes") throw new Error("Document family consent before preparing a text message.");
  const result = await createPacketInvitation({
    familyEmail: String(formData.get("familyEmail") || "").trim() || undefined,
    familyMobile,
    smsConsentAt: new Date().toISOString(),
    owner: session.name,
    actor: session.name,
  });
  redirect(`/dashboard/family-care?new=${result.item.id}&token=${encodeURIComponent(result.token)}`);
}
export async function attachPacketAction(formData: FormData) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  await attachPacketToCase(String(formData.get("packetId")), String(formData.get("targetCaseId") || "") || undefined, session.name);
  redirect(`/dashboard/family-care?selected=${String(formData.get("packetId"))}&attached=1`);
}
export async function saveArrangementSheetAction(formData: FormData) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  const data: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (key !== "packetId" && typeof value === "string") data[key] = value.trim();
  const packetId = String(formData.get("packetId") || "");
  if (!packetId) throw new Error("Arrangement Sheet is missing its family packet.");
  await saveArrangementSheet(packetId, data, session.name);
  redirect(`/dashboard/family-care?selected=${encodeURIComponent(packetId)}&arrangement=saved`);
}
export async function reviewSectionAction(formData: FormData) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  await updateCaseReview(String(formData.get("caseId")), String(formData.get("section")) as SectionKey, String(formData.get("status")) as SectionStatus, session.name);
  revalidatePath("/dashboard/family-care");
}
export async function revokeLinkAction(formData: FormData) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  await revokeCaseLink(String(formData.get("caseId")), session.name); revalidatePath("/dashboard/family-care");
}
export async function updateCaseStatusAction(formData: FormData) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  await updateCaseStatus(String(formData.get("caseId")), String(formData.get("status")) as CaseStatus, session.name);
  revalidatePath("/dashboard/family-care");
}
export async function resetDemoAction() {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  const result = await resetLocalDemo(session.name);
  redirect(`/dashboard/family-care?new=${result.item.id}&token=${encodeURIComponent(result.token)}&demo=1`);
}
export async function savePacketSectionAction(formData: FormData) {
  const token = String(formData.get("token")); const section = String(formData.get("section")) as SectionKey; const intent = String(formData.get("intent"));
  const data: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (!["token", "section", "intent", "photo", "ssn", "socialSecurityNumber"].includes(key) && typeof value === "string") data[key] = value;
  if (section === "embalming" && intent === "submit") {
    for (const key of ["representativeName", "relationship", "attestation", "signatureIntent", "signatureData"]) if (!data[key]?.trim()) throw new Error("Complete the electronic authorization and signature before submitting.");
    if (!data.signatureData.startsWith("data:image/png;base64,") || data.signatureData.length > 400000) throw new Error("Please provide a valid electronic signature.");
    const recordedAt = new Date().toISOString();
    data.electronicAuthorizationRecord = `Electronic authorization recorded ${recordedAt}; case access verified by protected link; signature digest ${createHash("sha256").update(data.signatureData).digest("hex")}. Pending staff review.`;
  }
  const photo = formData.get("photo"); if (photo instanceof File && photo.size) await savePhoto(token, photo);
  await updateSection(token, section, data, intent === "submit");
  redirect(`/family/${encodeURIComponent(token)}?section=${section}&saved=1`);
}
