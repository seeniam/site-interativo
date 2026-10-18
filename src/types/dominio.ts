/** Entidades do domínio guardadas no Postgres (ou no adaptador em memória da demonstração). */

export type StatusResposta = "confirmado" | "recusou";

/** O que o formulário de RSVP produz, já validado. */
export interface NovaConfirmacao {
  nome: string;
  /** Só dígitos, com DDD: 10 (fixo) ou 11 (celular). */
  telefone: string;
  status: StatusResposta;
  /** Nomes de quem vem junto. Vazio quando a pessoa não vai. */
  acompanhantes: readonly string[];
  /** Quem convidou. Vazio quando a pessoa não vai. */
  convidadoPor: string;
  recado: string;
}

/**
 * Uma linha de `confirmacoes`. Respostas são só de inclusão: responder de novo grava outra
 * linha com `atualizaDe`, e vale a mais recente de cada `telefoneHash`.
 * Sai do servidor apenas pela rota dos noivos (`GET /api/convidados`), nunca por rota pública.
 */
export interface Confirmacao extends NovaConfirmacao {
  id: string;
  telefoneHash: string;
  /** Hash da resposta que esta substitui, quando é uma atualização. */
  atualizaDe: string | null;
  criadoEm: Date;
}
