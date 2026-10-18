/**
 * A lista dos noivos a partir das linhas de `confirmacoes`. Função pura.
 * Respostas são só de inclusão: de cada telefone (pelo hash) vale a mais recente.
 */
import type { Confirmacao, StatusResposta } from "@/types/dominio";

/** O que `GET /api/convidados` devolve por pessoa — só para a sessão dos noivos. */
export interface RespostaConvidado {
  id: string;
  nome: string;
  telefone: string;
  status: StatusResposta;
  acompanhantes: string[];
  convidadoPor: string;
  recado: string;
  /** ISO 8601. */
  respondidoEm: string;
  /** A pessoa já tinha respondido antes e mudou a resposta. */
  atualizada: boolean;
}

export function respostasValendo(confirmacoes: readonly Confirmacao[]): RespostaConvidado[] {
  const porPessoa = new Map<string, { atual: Confirmacao; total: number }>();
  for (const c of confirmacoes) {
    const visto = porPessoa.get(c.telefoneHash);
    if (!visto) {
      porPessoa.set(c.telefoneHash, { atual: c, total: 1 });
      continue;
    }
    visto.total += 1;
    const maisNova =
      c.criadoEm.getTime() > visto.atual.criadoEm.getTime() ||
      (c.criadoEm.getTime() === visto.atual.criadoEm.getTime() && Number(c.id) > Number(visto.atual.id));
    if (maisNova) visto.atual = c;
  }
  return [...porPessoa.values()]
    .map(({ atual, total }) => ({
      id: atual.id,
      nome: atual.nome,
      telefone: atual.telefone,
      status: atual.status,
      acompanhantes: [...atual.acompanhantes],
      convidadoPor: atual.convidadoPor,
      recado: atual.recado,
      respondidoEm: atual.criadoEm.toISOString(),
      atualizada: total > 1 || atual.atualizaDe !== null,
    }))
    .sort((a, b) => b.respondidoEm.localeCompare(a.respondidoEm) || Number(b.id) - Number(a.id));
}
