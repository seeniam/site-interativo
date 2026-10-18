/** Entidades do domínio que vivem no backend (Firestore ou mock local). */

export type StatusResposta = "confirmado" | "recusou";

/**
 * Uma resposta de RSVP. As confirmações são só de inclusão (DECISOES F2):
 * responder de novo cria outro registro, e vale o mais recente de cada telefone.
 */
export interface Confirmacao {
  id: string;
  nome: string;
  /** Só dígitos, com DDD: 10 (fixo) ou 11 (celular). */
  telefone: string;
  status: StatusResposta;
  /** Nomes de quem vem junto. Vazio quando a pessoa não vai. */
  acompanhantes: readonly string[];
  /** Quem convidou (nome da noiva, do noivo, ou o que a pessoa digitou). Vazio quando não vai. */
  convidadoPor: string;
  recado: string;
  criadoEm: Date;
}

export type NovaConfirmacao = Omit<Confirmacao, "id" | "criadoEm">;

/** Um presente nomeado que alguém já deu. Sem dado pessoal (DECISOES F3). */
export interface PresenteReservado {
  id: string;
  presenteId: string;
  criadoEm: Date;
}
