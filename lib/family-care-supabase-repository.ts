import "server-only";
import { randomUUID } from "node:crypto";
import { getSupabaseServerClient, getSupabaseServiceClient } from "./supabase-server";
import { hashFamilyToken, issueFamilyToken } from "./family-care-security";
import type { CaseStatus, FamilyCase, SectionKey, SectionStatus, TimelineEvent } from "./family-care-types";

type CaseRow = {
  id: string; decedent_name: string; family_email: string; owner_name: string; next_promised_update: string;
  family_mobile?: string; sms_consent_at?: string; delivery_state?: FamilyCase["deliveryState"]; delivery_error?: string;
  created_at: string; status: CaseStatus; packet_state?: FamilyCase["packetState"]; packet_submitted_at?: string; attached_case_id?: string; packet_sections?: SectionRow[]; family_access_links?: LinkRow[];
  audit_events?: AuditRow[]; uploaded_assets?: AssetRow[];
};
type SectionRow = { section_key: SectionKey; review_status: SectionStatus; responses: Record<string, string>; updated_at: string };
type LinkRow = { token_hash: string; expires_at: string; revoked_at?: string; last_opened_at?: string };
type AuditRow = { id: string; created_at: string; actor_label: string; event_type: TimelineEvent["type"]; detail: string };
type AssetRow = { original_name: string; object_path: string; byte_size: number; mime_type: string };

function mapCase(row: CaseRow): FamilyCase {
  const sectionRows = row.packet_sections || [];
  const sections = Object.fromEntries((["general", "obituary", "deathCertificate", "embalming"] as SectionKey[]).map((key) => {
    const value = sectionRows.find((section) => section.section_key === key);
    return [key, { status: value?.review_status || "incomplete", updatedAt: value?.updated_at, data: value?.responses || {} }];
  })) as FamilyCase["sections"];
  const link = row.family_access_links?.[0];
  const asset = row.uploaded_assets?.[0];
  return {
    id: row.id, decedentName: row.decedent_name, familyEmail: row.family_email || "", familyMobile: row.family_mobile, smsConsentAt: row.sms_consent_at,
    deliveryState: row.delivery_state, deliveryError: row.delivery_error, owner: row.owner_name,
    nextPromisedUpdate: row.next_promised_update, createdAt: row.created_at, caseStatus: row.status, sections,
    packetState: row.packet_state, packetSubmittedAt: row.packet_submitted_at, attachedCaseId: row.attached_case_id,
    access: { tokenHash: link?.token_hash || "", expiresAt: link?.expires_at || row.created_at, revokedAt: link?.revoked_at, lastOpenedAt: link?.last_opened_at },
    photo: asset ? { originalName: asset.original_name, storedName: asset.object_path, size: asset.byte_size, type: asset.mime_type } : undefined,
    timeline: (row.audit_events || []).map((entry) => ({ id: entry.id, at: entry.created_at, actor: entry.actor_label, type: entry.event_type, detail: entry.detail })),
  };
}

async function staffClient() {
  const client = await getSupabaseServerClient();
  if (!client) throw new Error("Supabase Auth is not configured.");
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Authenticated staff session required.");
  return { client, user };
}

const caseSelect = "id,decedent_name,family_email,family_mobile,sms_consent_at,delivery_state,delivery_error,owner_name,next_promised_update,created_at,status,packet_state,packet_submitted_at,attached_case_id,packet_sections(section_key,review_status,responses,updated_at),family_access_links(token_hash,expires_at,revoked_at,last_opened_at),audit_events(id,created_at,actor_label,event_type,detail),uploaded_assets(original_name,object_path,byte_size,mime_type)";

export async function listFamilyCases() {
  const { client } = await staffClient();
  const { data, error } = await client.from("family_cases").select(caseSelect).order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as CaseRow[]).map(mapCase);
}

export async function createFamilyCase(input: { decedentName: string; familyEmail: string; owner: string; nextPromisedUpdate: string; actor: string }) {
  const { client, user } = await staffClient(); const issued = issueFamilyToken();
  const { data: created, error } = await client.from("family_cases").insert({ decedent_name: input.decedentName, family_email: input.familyEmail, owner_name: input.owner, next_promised_update: input.nextPromisedUpdate, created_by: user.id }).select("id").single();
  if (error) throw error;
  const caseId = created.id;
  const { error: sectionError } = await client.from("packet_sections").insert((["general", "obituary", "deathCertificate", "embalming"] as SectionKey[]).map((section_key) => ({ case_id: caseId, section_key })));
  if (sectionError) throw sectionError;
  const { error: linkError } = await client.from("family_access_links").insert({ case_id: caseId, token_hash: issued.tokenHash, expires_at: new Date(Date.now() + 7 * 86400000).toISOString(), created_by: user.id });
  if (linkError) throw linkError;
  await client.from("audit_events").insert([{ case_id: caseId, actor_user_id: user.id, actor_label: input.actor, event_type: "case", detail: `Created private case and assigned ${input.owner}.` }, { case_id: caseId, actor_user_id: user.id, actor_label: input.actor, event_type: "access", detail: "Generated a scoped 7-day family access link." }]);
  const cases = await listFamilyCases(); return { item: cases.find((item) => item.id === caseId)!, token: issued.token };
}

export async function createPacketInvitation(input: { familyEmail?: string; familyMobile: string; smsConsentAt: string; owner: string; actor: string }) {
  const result = await createFamilyCase({ decedentName: "Awaiting family packet", familyEmail: input.familyEmail || "packet-contact@invalid.local", owner: input.owner, nextPromisedUpdate: new Date(Date.now() + 2 * 86400000).toISOString(), actor: input.actor });
  const { client, user } = await staffClient();
  await client.from("family_cases").update({ packet_state: "sent", family_email: input.familyEmail || null, family_mobile: input.familyMobile, sms_consent_at: input.smsConsentAt, delivery_state: "queued-ready", delivery_error: null }).eq("id", result.item.id);
  await client.from("audit_events").insert({ case_id: result.item.id, actor_user_id: user.id, actor_label: input.actor, event_type: "communication", detail: `Consent recorded and SMS-ready packet queued for ${input.familyMobile}; no text was sent because no SMS provider is configured.` });
  return { ...result, item: { ...result.item, familyEmail: input.familyEmail || "", familyMobile: input.familyMobile, smsConsentAt: input.smsConsentAt, deliveryState: "queued-ready" as const, packetState: "sent" as const } };
}

async function activeLink(token: string) {
  const service = getSupabaseServiceClient();
  const { data, error } = await service.from("family_access_links").select("id,case_id,expires_at,revoked_at").eq("token_hash", hashFamilyToken(token)).maybeSingle();
  if (error) throw error;
  if (!data) return { state: "invalid" as const };
  if (data.revoked_at) return { state: "revoked" as const, link: data, service };
  if (new Date(data.expires_at).getTime() <= Date.now()) return { state: "expired" as const, link: data, service };
  return { state: "active" as const, link: data, service };
}

export async function getCaseByToken(token: string, recordOpen = true) {
  const access = await activeLink(token); if (access.state !== "active") return { state: access.state };
  const { data, error } = await access.service.from("family_cases").select(caseSelect).eq("id", access.link.case_id).single();
  if (error) throw error;
  if (recordOpen) {
    await access.service.from("family_access_links").update({ last_opened_at: new Date().toISOString() }).eq("id", access.link.id);
    await access.service.from("audit_events").insert({ case_id: access.link.case_id, actor_label: "Family link", event_type: "access", detail: "Family packet opened." });
  }
  return { state: "active" as const, item: mapCase(data as unknown as CaseRow) };
}

export async function updateSection(token: string, section: SectionKey, data: Record<string, string>, submit: boolean) {
  const access = await activeLink(token); if (access.state !== "active") throw new Error("Access link is not active.");
  const status = submit ? "submitted" : "incomplete";
  const submittedAt = new Date().toISOString();
  const { error } = await access.service.from("packet_sections").update({ responses: data, review_status: status, family_submitted_at: submit ? submittedAt : null }).eq("case_id", access.link.case_id).eq("section_key", section);
  if (error) throw error;
  if (submit) await access.service.from("family_cases").update({ packet_state: "submitted", packet_submitted_at: submittedAt }).eq("id", access.link.case_id);
  const detail = section === "embalming" && submit ? "Submitted electronic authorization pending staff review; signature record retained with the case file." : `${submit ? "Submitted" : "Saved"} ${section} section.`;
  await access.service.from("audit_events").insert({ case_id: access.link.case_id, actor_label: "Family", event_type: submit ? "submission" : "save", detail });
  const result = await getCaseByToken(token, false); if (result.state !== "active") throw new Error("Access link is not active."); return result.item;
}
export async function attachPacketToCase(id: string, targetCaseId: string | undefined, actor: string) {
  const { client, user } = await staffClient();
  const { data: source, error } = await client.from("family_cases").select(caseSelect).eq("id", id).single(); if (error) throw error;
  const packet = mapCase(source as unknown as CaseRow);
  const decedentName = packet.sections.general.data.fullName || packet.sections.obituary.data.name || packet.decedentName;
  if (targetCaseId) {
    for (const key of Object.keys(packet.sections) as SectionKey[]) {
      await client.from("packet_sections").update({ responses: packet.sections[key].data, review_status: packet.sections[key].status }).eq("case_id", targetCaseId).eq("section_key", key);
    }
    await client.from("family_cases").update({ decedent_name: decedentName, family_email: packet.familyEmail || null, family_mobile: packet.familyMobile, sms_consent_at: packet.smsConsentAt }).eq("id", targetCaseId);
  }
  const attachedCaseId = targetCaseId || id;
  const { error: updateError } = await client.from("family_cases").update({ decedent_name: decedentName, packet_state: "attached", attached_case_id: attachedCaseId }).eq("id", id); if (updateError) throw updateError;
  await client.from("audit_events").insert({ case_id: id, actor_user_id: user.id, actor_label: actor, event_type: "case", detail: targetCaseId ? `Attached packet to Family Care case ${targetCaseId}.` : "Created Family Care case from submitted packet without re-entering answers." });
  return { ...packet, decedentName, packetState: "attached" as const, attachedCaseId };
}

export async function updateCaseReview(id: string, section: SectionKey, status: SectionStatus, actor: string) {
  const { client, user } = await staffClient();
  const { error } = await client.from("packet_sections").update({ review_status: status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("case_id", id).eq("section_key", section);
  if (error) throw error;
  await client.from("audit_events").insert({ case_id: id, actor_user_id: user.id, actor_label: actor, event_type: "review", detail: `Marked ${section} ${status}.` });
}

export async function revokeCaseLink(id: string, actor: string) {
  const { client, user } = await staffClient();
  const { error } = await client.from("family_access_links").update({ revoked_at: new Date().toISOString(), revoked_by: user.id }).eq("case_id", id).is("revoked_at", null);
  if (error) throw error;
  await client.from("audit_events").insert({ case_id: id, actor_user_id: user.id, actor_label: actor, event_type: "access", detail: "Revoked family access link." });
}

export async function updateCaseStatus(id: string, status: CaseStatus, actor: string) {
  const { client, user } = await staffClient();
  const { error } = await client.from("family_cases").update({ status, completed_at: status === "complete" ? new Date().toISOString() : null }).eq("id", id);
  if (error) throw error;
  const detail = status === "aftercare-ready" ? "Marked case ready for aftercare handoff." : status === "complete" ? "Completed Family Care case and recorded aftercare handoff." : "Returned case to active Family Care.";
  await client.from("audit_events").insert({ case_id: id, actor_user_id: user.id, actor_label: actor, event_type: "handoff", detail });
}

export async function savePhoto(token: string, file: File) {
  const access = await activeLink(token); if (access.state !== "active") throw new Error("Access link is not active.");
  const allowed = ["image/jpeg", "image/png", "image/webp"]; if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Photo must be JPG, PNG, or WebP and no larger than 5 MB.");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const objectPath = `${access.link.case_id}/${randomUUID()}.${ext}`;
  const { error: uploadError } = await access.service.storage.from("family-care-private").upload(objectPath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;
  const { error } = await access.service.from("uploaded_assets").insert({ case_id: access.link.case_id, section_key: "obituary", bucket_id: "family-care-private", object_path: objectPath, original_name: file.name.replace(/[^\w.\- ]/g, "_"), mime_type: file.type, byte_size: file.size });
  if (error) { await access.service.storage.from("family-care-private").remove([objectPath]); throw error; }
  await access.service.from("audit_events").insert({ case_id: access.link.case_id, actor_label: "Family", event_type: "save", detail: "Uploaded an obituary photo to private storage." });
}
