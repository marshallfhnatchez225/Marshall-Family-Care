import { createAdminClient } from "@/lib/supabase/admin";

export type StaffFamilyRecord = {
  assigned_director: string | null;
  created_at: string;
  email: string | null;
  full_name: string | null;
  id: string;
  last_portal_activity: string | null;
  loved_one_name: string | null;
  open_requests: number | null;
  portal_progress: number | null;
  portal_status: string | null;
  preferred_phone: string | null;
};

type ProfileRow = Partial<StaffFamilyRecord> & {
  role?: string | null;
};

export async function getFamilyRecords(): Promise<StaffFamilyRecord[]> {
  const admin = createAdminClient();
  const { data: authRows } = await admin.auth.admin.listUsers();
  let profileRows: ProfileRow[] = [];

  try {
    const { data } = await admin
      .from("profiles")
      .select(
        "id, full_name, loved_one_name, preferred_phone, assigned_director, portal_progress, portal_status, open_requests, last_portal_activity, created_at, role"
      )
      .eq("role", "family")
      .order("created_at", { ascending: false });
    profileRows = data ?? [];
  } catch {
    try {
      const { data } = await admin
        .from("profiles")
        .select("id, full_name, loved_one_name, preferred_phone, assigned_director, created_at, role")
        .eq("role", "family")
        .order("created_at", { ascending: false });
      profileRows = data ?? [];
    } catch {
      profileRows = [];
    }
  }

  const familyMap = new Map<string, StaffFamilyRecord>();

  for (const profile of profileRows) {
    if (!profile.id) continue;

    familyMap.set(profile.id, {
      assigned_director: profile.assigned_director ?? null,
      created_at: profile.created_at ?? "",
      email: null,
      full_name: profile.full_name ?? null,
      id: profile.id,
      last_portal_activity: profile.last_portal_activity ?? null,
      loved_one_name: profile.loved_one_name ?? null,
      open_requests: profile.open_requests ?? 0,
      portal_progress: profile.portal_progress ?? 0,
      portal_status: profile.portal_status ?? "Not started",
      preferred_phone: profile.preferred_phone ?? null
    });
  }

  for (const authUser of authRows?.users ?? []) {
    const metadata = authUser.user_metadata ?? {};
    const existing = familyMap.get(authUser.id);

    if (metadata.role !== "family" && !existing) {
      continue;
    }

    familyMap.set(authUser.id, {
      assigned_director:
        existing?.assigned_director ?? ((metadata.assigned_director as string | undefined) || null),
      created_at: existing?.created_at || authUser.created_at || "",
      email: authUser.email ?? existing?.email ?? null,
      full_name: existing?.full_name ?? ((metadata.full_name as string | undefined) || null),
      id: authUser.id,
      last_portal_activity: existing?.last_portal_activity ?? null,
      loved_one_name:
        existing?.loved_one_name ?? ((metadata.loved_one_name as string | undefined) || null),
      open_requests: existing?.open_requests ?? 0,
      portal_progress: existing?.portal_progress ?? 0,
      portal_status: existing?.portal_status ?? "Not started",
      preferred_phone:
        existing?.preferred_phone ?? ((metadata.preferred_phone as string | undefined) || null)
    });
  }

  return Array.from(familyMap.values()).sort((a, b) => {
    return (b.created_at || "").localeCompare(a.created_at || "");
  });
}
