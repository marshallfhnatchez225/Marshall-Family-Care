import { SettingsPanel } from "@/components/settings-panel";
import { getCurrentSession } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export default async function SettingsPage() {
  const session = await getCurrentSession();

  if (!session) {
    return null;
  }

  return (
    <SettingsPanel
      session={session}
      supabaseConfigured={isSupabaseConfigured()}
    />
  );
}
