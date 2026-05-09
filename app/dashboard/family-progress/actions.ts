"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateFamilyProgress({
  lastPortalActivity,
  openRequests,
  portalProgress,
  portalStatus
}: {
  lastPortalActivity: string;
  openRequests: number;
  portalProgress: number;
  portalStatus: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("profiles")
    .update({
      last_portal_activity: lastPortalActivity,
      open_requests: openRequests,
      portal_progress: portalProgress,
      portal_status: portalStatus
    })
    .eq("id", user.id)
    .eq("role", "family");
}
