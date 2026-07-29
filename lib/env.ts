import { hasSupabasePublicConfig, hasSupabaseServerConfig, isSafeLocalDemo } from "./runtime-mode";
export function isSupabaseConfigured() { return hasSupabaseServerConfig(); }
export function isSupabaseBrowserConfigured() { return hasSupabasePublicConfig(); }
export function isLocalDemoConfigured() { return isSafeLocalDemo(); }
