import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** Invitation links carry a random token; only its SHA-256 is stored in the database. */
export const newInvitationToken = () => randomBytes(32).toString("base64url");
export const hashInvitationToken = (token: string) => createHash("sha256").update(token).digest("hex");
