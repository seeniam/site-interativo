/**
 * Validação do que volta do armazenamento (Firestore ou localStorage) — e do que vai para ele.
 * Dado corrompido ou adulterado é descartado na leitura em vez de quebrar a tela; e nada é
 * gravado se não passar aqui, para nunca gravar o que a leitura descartaria.
 */
import { z } from "zod";
import { telefoneValido } from "@/lib/format";
import type { Confirmacao, PresenteReservado } from "@/types/dominio";
import { LIMITES } from "./limites";

/** Só Date de verdade ou texto ISO com fuso — `null`, número e booleano não viram 1970. */
const data = z
  .union([z.date(), z.iso.datetime({ offset: true }).transform((texto) => new Date(texto))])
  .refine((d) => !Number.isNaN(d.getTime()));

export const esquemaConfirmacao = z.object({
  id: z.string().min(1),
  nome: z.string().min(3).max(LIMITES.nome),
  telefone: z
    .string()
    .regex(/^\d{10,11}$/)
    .refine(telefoneValido),
  status: z.enum(["confirmado", "recusou"]),
  acompanhantes: z.array(z.string().min(1).max(LIMITES.nomeAcompanhante)).max(LIMITES.acompanhantes),
  convidadoPor: z.string().max(LIMITES.convidadoPor),
  recado: z.string().max(LIMITES.recado),
  criadoEm: data,
}) satisfies z.ZodType<Confirmacao, unknown>;

export const esquemaPresenteReservado = z.object({
  id: z.string().min(1),
  presenteId: z.string().min(1).max(LIMITES.presenteId),
  criadoEm: data,
}) satisfies z.ZodType<PresenteReservado, unknown>;

/** Filtra uma lista crua, mantendo só os itens válidos. */
export function filtrarValidos<T>(esquema: z.ZodType<T, unknown>, itens: readonly unknown[]): T[] {
  return itens.flatMap((item) => {
    const resultado = esquema.safeParse(item);
    return resultado.success ? [resultado.data] : [];
  });
}

/** Erro de programação: tentou gravar algo que a leitura descartaria. Nunca deve chegar à tela. */
export class RegistroInvalido extends Error {
  override name = "RegistroInvalido";
}

/** Confere antes de gravar. Lança `RegistroInvalido` em vez de gravar um registro que sumiria. */
export function garantirGravavel<T>(esquema: z.ZodType<T, unknown>, registro: unknown): T {
  const resultado = esquema.safeParse(registro);
  if (!resultado.success) {
    throw new RegistroInvalido(resultado.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return resultado.data;
}
