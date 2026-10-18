import { createHash } from "node:crypto";

/**
 * `telefone_hash = sha256(telefone + RSVP_SALT)` — calculado só no servidor; o sal nunca
 * sai dele. Identifica "a mesma pessoa respondendo de novo" sem expor o número.
 */
export function hashTelefone(telefone: string, sal: string): string {
  if (!/^\d{10,11}$/.test(telefone)) throw new RangeError("Telefone deve chegar normalizado (só dígitos)");
  if (!sal) throw new RangeError("RSVP_SALT vazio");
  return createHash("sha256")
    .update(telefone + sal)
    .digest("hex");
}
