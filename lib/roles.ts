export type StaffRole = "admin" | "staff" | "service_director";

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return role === "admin" || role === "staff" || role === "service_director";
}
