/**
 * Adaptador Postgres, SQL escrito à mão sobre um executor de consultas parametrizadas.
 * Em produção o executor é o driver HTTP do Neon; nos testes, o pg-mem rodando o
 * `db/schema.sql` real — então o SQL daqui é testado de verdade.
 *
 * Colunas sempre explícitas: nada de `select *` (briefing 5).
 */
import { esquemaLinhaConfirmacao, esquemaRegistro, garantirGravavel } from "@/lib/schemas/dominio";
import type { Confirmacao } from "@/types/dominio";
import type { RegistroDeConfirmacao, RepositorioCasamento } from "./repositorio";

/** Executa SQL com `$1, $2…` e devolve as linhas. */
export type Executor = (texto: string, parametros: readonly unknown[]) => Promise<Record<string, unknown>[]>;

const COLUNAS_CONFIRMACAO =
  "id, nome, telefone, telefone_hash, vai_comparecer, quem_convidou, recado, atualiza_de, criado_em";

function paraConfirmacao(linha: Record<string, unknown>): Confirmacao | null {
  const lido = esquemaLinhaConfirmacao.safeParse(linha);
  if (!lido.success) return null;
  const l = lido.data;
  return {
    id: String(l.id),
    nome: l.nome,
    telefone: l.telefone,
    telefoneHash: l.telefone_hash,
    status: l.vai_comparecer ? "confirmado" : "recusou",
    convidadoPor: l.quem_convidou ?? "",
    recado: l.recado ?? "",
    atualizaDe: l.atualiza_de,
    criadoEm: l.criado_em,
  };
}

export function criarRepositorioPostgres(executar: Executor): RepositorioCasamento {
  return {
    origem: "postgres",

    async registrarConfirmacao(registro: RegistroDeConfirmacao) {
      // Nunca gravar o que a leitura descartaria (DECISOES, "perda silenciosa").
      const r = garantirGravavel(esquemaRegistro, registro);
      await executar(
        `insert into confirmacoes
           (nome, telefone, telefone_hash, vai_comparecer, quem_convidou, recado, atualiza_de)
         values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          r.nome,
          r.telefone,
          r.telefoneHash,
          r.status === "confirmado",
          r.convidadoPor || null,
          r.recado || null,
          r.atualizaDe,
        ],
      );
    },

    async ultimaRespostaDoHash(telefoneHash) {
      const linhas = await executar(
        `select criado_em from confirmacoes where telefone_hash = $1 order by criado_em desc limit 1`,
        [telefoneHash],
      );
      const valor = linhas[0]?.criado_em;
      if (valor === undefined || valor === null) return null;
      const data = valor instanceof Date ? valor : new Date(String(valor));
      return Number.isNaN(data.getTime()) ? null : data;
    },

    async listarConfirmacoes() {
      const linhas = await executar(
        `select ${COLUNAS_CONFIRMACAO} from confirmacoes order by criado_em desc, id desc`,
        [],
      );
      const confirmacoes = linhas.flatMap((linha) => {
        const confirmacao = paraConfirmacao(linha);
        return confirmacao ? [confirmacao] : [];
      });
      // Linha fora do formato não derruba a tela, mas não some calada: só a contagem vai ao log.
      const descartadas = linhas.length - confirmacoes.length;
      if (descartadas > 0) console.error(`[confirmacoes] ${descartadas} linha(s) fora do formato descartada(s)`);
      return confirmacoes;
    },

    async listarReservados() {
      const linhas = await executar(`select cota_id from presentes_reservados order by reservado_em`, []);
      return linhas.map((linha) => String(linha.cota_id));
    },

    async reservarPresente(presenteId) {
      // "where not exists" deixa explícito que só insere se for novo; o "on conflict" é a trava
      // para dois pedidos simultâneos.
      const linhas = await executar(
        `insert into presentes_reservados (cota_id)
         select $1 where not exists (select 1 from presentes_reservados where cota_id = $1)
         on conflict (cota_id) do nothing
         returning cota_id`,
        [presenteId],
      );
      return linhas.length > 0;
    },
  };
}
