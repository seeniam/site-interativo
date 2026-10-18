/**
 * Validação do que entra e sai do banco. Linha corrompida é descartada na leitura em vez de
 * quebrar a tela; e nada é gravado se não passar aqui — nunca gravar o que a leitura descartaria.
 */
import { z } from "zod";
import { telefoneValido } from "@/lib/format";
import { LIMITES } from "./limites";

/** Só Date de verdade ou texto ISO — `null`, número e booleano não viram 1970. */
const data = z
  .union([z.date(), z.iso.datetime({ offset: true }).transform((texto) => new Date(texto))])
  .refine((d) => !Number.isNaN(d.getTime()));

const telefone = z
  .string()
  .regex(/^\d{10,11}$/)
  .refine(telefoneValido);

const hash = z.string().regex(/^[0-9a-f]{64}$/);

/** O que vai para `insert into confirmacoes`. */
export const esquemaRegistro = z.object({
  nome: z.string().min(3).max(LIMITES.nome),
  telefone,
  telefoneHash: hash,
  status: z.enum(["confirmado", "recusou"]),
  acompanhantes: z.array(z.string().min(1).max(LIMITES.nomeAcompanhante)).max(LIMITES.acompanhantes),
  convidadoPor: z.string().max(LIMITES.convidadoPor),
  recado: z.string().max(LIMITES.recado),
  atualizaDe: hash.nullable(),
});

/** Uma linha de `confirmacoes` como o banco devolve (bigint chega como texto, jsonb já decodificado). */
export const esquemaLinhaConfirmacao = z.object({
  id: z.union([z.string().regex(/^\d+$/), z.number().int()]),
  nome: z.string().min(1).max(LIMITES.nome),
  telefone,
  telefone_hash: hash,
  vai_comparecer: z.boolean(),
  acompanhantes: z.array(z.string().max(LIMITES.nomeAcompanhante)).max(LIMITES.acompanhantes),
  quem_convidou: z.string().max(LIMITES.convidadoPor).nullable(),
  recado: z.string().max(LIMITES.recado).nullable(),
  atualiza_de: hash.nullable(),
  criado_em: data,
});

/** Erro de programação: tentou gravar algo fora do formato. Nunca deve chegar à tela. */
export class RegistroInvalido extends Error {
  override name = "RegistroInvalido";
}

/** Confere antes de gravar; lança `RegistroInvalido` em vez de gravar lixo. */
export function garantirGravavel<T>(esquema: z.ZodType<T, unknown>, registro: unknown): T {
  const resultado = esquema.safeParse(registro);
  if (!resultado.success) {
    throw new RegistroInvalido(resultado.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  return resultado.data;
}
