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
      convidadoPor: atual.convidadoPor,
      recado: atual.recado,
      respondidoEm: atual.criadoEm.toISOString(),
      atualizada: total > 1 || atual.atualizaDe !== null,
    }))
    .sort((a, b) => b.respondidoEm.localeCompare(a.respondidoEm) || Number(b.id) - Number(a.id));
}

// ── A tela dos noivos: busca, filtros, contadores, agrupamento, ordenação ────

export type FiltroStatus = "todos" | "confirmado" | "recusou";

export interface Filtro {
  busca: string;
  status: FiltroStatus;
}

/** "Jôse  Ávila" → "jose avila": a busca ignora acento, caixa e espaço repetido. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

export function filtrarRespostas(respostas: readonly RespostaConvidado[], filtro: Filtro): RespostaConvidado[] {
  const termo = normalizarBusca(filtro.busca);
  return respostas.filter(
    (r) =>
      (filtro.status === "todos" || r.status === filtro.status) && (!termo || normalizarBusca(r.nome).includes(termo)),
  );
}

export interface Contadores {
  /** Quem vem. O convite é individual: uma confirmação é uma pessoa. */
  confirmados: number;
  naoVao: number;
  respostas: number;
}

export function contarRespostas(respostas: readonly RespostaConvidado[]): Contadores {
  return respostas.reduce<Contadores>(
    (total, r) =>
      r.status === "confirmado"
        ? { ...total, confirmados: total.confirmados + 1, respostas: total.respostas + 1 }
        : { ...total, naoVao: total.naoVao + 1, respostas: total.respostas + 1 },
    { confirmados: 0, naoVao: 0, respostas: 0 },
  );
}

export interface GrupoConvidados {
  /** Vazio = não informado (quem respondeu que não vai). */
  convidadoPor: string;
  respostas: RespostaConvidado[];
  contadores: Contadores;
}

/** Grupos por quem convidou, com subtotal; "não informado" por último. A ordem dentro do grupo é preservada. */
export function agruparPorQuemConvidou(respostas: readonly RespostaConvidado[]): GrupoConvidados[] {
  const grupos = new Map<string, RespostaConvidado[]>();
  for (const r of respostas) grupos.set(r.convidadoPor, [...(grupos.get(r.convidadoPor) ?? []), r]);
  return [...grupos.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "pt-BR")))
    .map(([convidadoPor, lista]) => ({ convidadoPor, respostas: lista, contadores: contarRespostas(lista) }));
}

export type CampoOrdenacao = "nome" | "data";
export type Direcao = "asc" | "desc";

export function ordenarRespostas(
  respostas: readonly RespostaConvidado[],
  campo: CampoOrdenacao,
  direcao: Direcao,
): RespostaConvidado[] {
  const sinal = direcao === "asc" ? 1 : -1;
  return [...respostas].sort((a, b) =>
    campo === "nome"
      ? sinal * a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
      : sinal * a.respondidoEm.localeCompare(b.respondidoEm),
  );
}

export const POR_PAGINA = 25;

export function paginar<T>(lista: readonly T[], pagina: number, porPagina = POR_PAGINA) {
  const paginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const atual = Math.min(Math.max(1, pagina), paginas);
  return { itens: lista.slice((atual - 1) * porPagina, atual * porPagina), atual, paginas };
}
