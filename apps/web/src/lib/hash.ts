import { createHash } from "crypto";

/**
 * Hash a token using SHA-256 for secure storage/lookup.
 * This reduces blast radius if Redis keys are exposed.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
