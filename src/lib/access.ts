export const intakeStaffModules = ["", "intake", "cases"] as const;

type Claims = Record<string, unknown> | null | undefined;

export function allowedModulesFromClaims(claims: Claims): string[] | null {
  const appMetadata = (claims?.app_metadata ?? {}) as Record<string, unknown>;
  if (Array.isArray(appMetadata.allowed_modules)) {
    return appMetadata.allowed_modules.filter((item): item is string => typeof item === "string");
  }
  return appMetadata.role === "intake_staff" ? [...intakeStaffModules] : null;
}

export function canAccessPath(pathname: string, allowedModules: string[] | null) {
  if (!allowedModules) return true;
  const segment = pathname.split("/").filter(Boolean)[0] ?? "";
  return allowedModules.includes(segment);
}
