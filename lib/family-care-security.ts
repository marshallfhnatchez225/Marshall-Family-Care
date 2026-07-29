import { createHash, randomBytes } from "node:crypto";
export function issueFamilyToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashFamilyToken(token) };
}
export function hashFamilyToken(token: string) {
  return createHash("sha256").update(`${process.env.MARSHALL_LINK_SECRET || ""}:${token}`).digest("hex");
}
