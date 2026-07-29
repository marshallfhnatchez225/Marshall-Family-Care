import "server-only";
import { assertRuntimeConfigured, getRuntimeMode } from "./runtime-mode";
import type { CaseStatus, SectionKey, SectionStatus } from "./family-care-types";

async function repository() {
  const mode = assertRuntimeConfigured();
  return mode === "supabase" ? import("./family-care-supabase-repository") : import("./family-care-local-repository");
}
export async function listFamilyCases() { return (await repository()).listFamilyCases(); }
export async function createFamilyCase(input: { decedentName: string; familyEmail: string; owner: string; nextPromisedUpdate: string; actor: string }) { return (await repository()).createFamilyCase(input); }
export async function createPacketInvitation(input: { familyEmail?: string; familyMobile: string; smsConsentAt: string; owner: string; actor: string }) { return (await repository()).createPacketInvitation(input); }
export async function getCaseByToken(token: string, recordOpen = true) { return (await repository()).getCaseByToken(token, recordOpen); }
export async function updateSection(token: string, section: SectionKey, data: Record<string, string>, submit: boolean) { return (await repository()).updateSection(token, section, data, submit); }
export async function updateCaseReview(id: string, section: SectionKey, status: SectionStatus, actor: string) { return (await repository()).updateCaseReview(id, section, status, actor); }
export async function revokeCaseLink(id: string, actor: string) { return (await repository()).revokeCaseLink(id, actor); }
export async function updateCaseStatus(id: string, status: CaseStatus, actor: string) { return (await repository()).updateCaseStatus(id, status, actor); }
export async function savePhoto(token: string, file: File) { return (await repository()).savePhoto(token, file); }
export async function attachPacketToCase(id: string, targetCaseId: string | undefined, actor: string) { return (await repository()).attachPacketToCase(id, targetCaseId, actor); }
export async function resetLocalDemo(actor: string) {
  if (getRuntimeMode() !== "local-demo") throw new Error("Local demo mode is not enabled.");
  return (await import("./family-care-local-repository")).resetLocalDemo(actor);
}
