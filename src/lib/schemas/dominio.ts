/**
 * Validação do que entra e sai do banco. Linha corrompida é descartada na leitura em vez de
 * quebrar a tela; e nada é gravado se não passar aqui — nunca gravar o que a leitura descartaria.
 */
import { z } from "zod";
import { telefoneValido } from "@/lib/format";
import { LIMITES } from "./limites";

/**
 * `timestamptz` em texto, como o Postgres escreve: "2026-10-18 12:00:00.123456+00" (espaço no
 * lugar do T, fuso sem minutos). Vira ISO antes de virar Date.
 */
const TIMESTAMPTZ_POSTGRES = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?([+-]\d{2})(?::?(\d{2}))?$/;

export function lerTimestamptz(texto: string): Date | null {
  const partes = TIMESTAMPTZ_POSTGRES.exec(texto);
  if (!partes) return null;
  const [, dia, hora, fracao = "", fuso, minutosFuso = "00"] = partes;
  const data = new Date(`${dia}T${hora}${fracao.slice(0, 4)}${fuso}:${minutosFuso}`);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Só Date de verdade, texto ISO ou o texto do Postgres — `null`, número e booleano não viram 1970.
 * (O driver costuma devolver Date; se um dia devolver texto, a lista dos noivos não pode esvaziar.)
 */
const data = z
  .union([
    z.date(),
    z.iso.datetime({ offset: true }).transform((texto) => new Date(texto)),
    z
      .string()
      .transform((texto) => lerTimestamptz(texto))
      .pipe(z.date()),
  ])
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
