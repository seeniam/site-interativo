/**
 * Formulário de confirmação de presença (briefing 6.4).
 * Mensagens humanas em `textos.rsvp.erros`; os limites de tamanho vêm de `limites.ts` (os mesmos
 * da gravação e da leitura do banco). O convite é individual: não há acompanhantes.
 */
import { z } from "zod";
import { textos } from "@/config/textos";
import { normalizarNome, normalizarTelefone, telefoneValido } from "@/lib/format";
import type { NovaConfirmacao } from "@/types/dominio";
import { LIMITES } from "./limites";

export const LIMITE_RECADO = LIMITES.recado;

const erros = textos.rsvp.erros;

const contarLetras = (texto: string) => texto.match(/\p{L}/gu)?.length ?? 0;
const SO_LETRAS = /^[\p{L}\s'.-]+$/u;
const limparNome = (v: string) => normalizarNome(v).trim().replace(/\s+/g, " ");

const nome = z
  .string()
  .transform(limparNome)
  .pipe(
    z
      .string()
      .min(1, { error: erros.nomeObrigatorio, abort: true })
      .max(LIMITES.nome, { error: erros.nomeLongo, abort: true })
      .refine((v) => SO_LETRAS.test(v), { error: erros.nomeCaracteres, abort: true })
      .refine((v) => contarLetras(v) >= 3, { error: erros.nomeCurto }),
  );

export const esquemaTelefone = z
  .string()
  .trim()
  .min(1, { error: erros.telefoneObrigatorio, abort: true })
  .refine(telefoneValido, { error: erros.telefoneInvalido })
  .transform(normalizarTelefone);

/** O esquema do formulário — o mesmo no navegador e, repetido, no servidor. */
export const esquemaRsvp = z
  .object({
    nome,
    telefone: esquemaTelefone,
    status: z.enum(["confirmado", "recusou"], { error: erros.statusObrigatorio }),
    // Sem validação aqui: quem responde "não" pula o passo 3 e não pode ficar preso nele.
    convidadoPor: z.string().transform(limparNome),
    recado: z
      .string()
      .trim()
      .max(LIMITES.recado, { error: erros.recadoLongo(LIMITES.recado) }),
    /** Honeypot: escondido de pessoas; robô que preenche é descartado. */
    site: z.string(),
  })
  .superRefine((dados, ctx) => {
    if (dados.status !== "confirmado") return;
    if (dados.convidadoPor.length < 2) {
      ctx.addIssue({ code: "custom", path: ["convidadoPor"], message: erros.convidadoPorObrigatorio });
    } else if (dados.convidadoPor.length > LIMITES.convidadoPor) {
      ctx.addIssue({ code: "custom", path: ["convidadoPor"], message: erros.convidadoPorLongo });
    }
  });

export type EntradaRsvp = z.input<typeof esquemaRsvp>;
export type DadosRsvp = z.output<typeof esquemaRsvp>;

/** Em que passo do formulário (1, 2 ou 3) mora cada campo — para levar a pessoa ao erro que o servidor apontou. */
export function passoDoCampo(campo: string): 1 | 2 | 3 {
  const raiz = campo.split(".")[0];
  return raiz === "nome" || raiz === "telefone" ? 1 : raiz === "status" ? 2 : 3;
}

/** Robô: preencheu o campo que pessoas não veem. */
export function pareceRobo(dados: Pick<DadosRsvp, "site">): boolean {
  return dados.site.trim().length > 0;
}

/** Do formulário validado para o registro. Quem não vai não informa "quem convidou". */
export function paraNovaConfirmacao(dados: DadosRsvp): NovaConfirmacao {
  return {
    nome: dados.nome,
    telefone: dados.telefone,
    status: dados.status,
    convidadoPor: dados.status === "confirmado" ? dados.convidadoPor : "",
    recado: dados.recado,
  };
}
