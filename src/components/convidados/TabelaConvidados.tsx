import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { SeloStatus } from "@/components/ui/SeloStatus";
import { textos } from "@/config/textos";
import type { CampoOrdenacao, Direcao, RespostaConvidado } from "@/lib/convidados";
import { formatarDiaMes, formatarHora } from "@/lib/format";

const { tabela } = textos.convidados;

interface TabelaConvidadosProps {
  respostas: readonly RespostaConvidado[];
  legenda: string;
  ordenacao: { campo: CampoOrdenacao; direcao: Direcao };
  aoOrdenar: (campo: CampoOrdenacao) => void;
  telefoneDe: (r: RespostaConvidado) => string;
}

function CabecalhoOrdenavel({
  campo,
  rotulo,
  ordenacao,
  aoOrdenar,
  alinharDireita = false,
}: {
  campo: CampoOrdenacao;
  rotulo: string;
  ordenacao: TabelaConvidadosProps["ordenacao"];
  aoOrdenar: TabelaConvidadosProps["aoOrdenar"];
  alinharDireita?: boolean;
}) {
  const ativo = ordenacao.campo === campo;
  const Icone = !ativo ? ArrowUpDown : ordenacao.direcao === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={ativo ? (ordenacao.direcao === "asc" ? "ascending" : "descending") : "none"}
      className={alinharDireita ? "text-right" : undefined}
    >
      <button type="button" className="tabela-convidados__ordenar" onClick={() => aoOrdenar(campo)}>
        {rotulo}
        <Icone aria-hidden size={14} strokeWidth={1.5} className={ativo ? "text-ouro-escuro" : "text-fumaca"} />
      </button>
    </th>
  );
}

/** A tabela do desktop (≥1024px): densa, cabeçalho fixo, zebra em papel, números à direita (briefing 6.6). */
export function TabelaConvidados({ respostas, legenda, ordenacao, aoOrdenar, telefoneDe }: TabelaConvidadosProps) {
  return (
    <div className="tabela-convidados">
      <table>
        <caption className="sr-only">{legenda}</caption>
        {/* Larguras fixas: com o agrupamento, as tabelas de cada grupo ficam alinhadas entre si. */}
        <colgroup>
          <col className="w-[25%]" />
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[15%]" />
          <col className="w-[22%]" />
          <col className="w-[13%]" />
        </colgroup>
        <thead>
          <tr>
            <CabecalhoOrdenavel campo="nome" rotulo={tabela.nome} ordenacao={ordenacao} aoOrdenar={aoOrdenar} />
            <th scope="col">{tabela.status}</th>
            <th scope="col">{tabela.convidadoPor}</th>
            <th scope="col">{tabela.telefone}</th>
            <th scope="col">{tabela.recado}</th>
            <CabecalhoOrdenavel
              campo="data"
              rotulo={tabela.respondeuEm}
              ordenacao={ordenacao}
              aoOrdenar={aoOrdenar}
              alinharDireita
            />
          </tr>
        </thead>
        <tbody>
          {respostas.map((r) => (
            <tr key={r.id}>
              <th scope="row">
                <span className="block font-normal text-tinta">{r.nome}</span>
              </th>
              <td>
                <SeloStatus status={r.status} />
              </td>
              <td>{r.convidadoPor || "—"}</td>
              <td className="whitespace-nowrap numeros" data-telefone="">
                {telefoneDe(r)}
              </td>
              <td className="tabela-convidados__recado">{r.recado || "—"}</td>
              <td className="text-right whitespace-nowrap numeros">
                <time dateTime={r.respondidoEm}>
                  {formatarDiaMes(r.respondidoEm)} {formatarHora(r.respondidoEm)}
                </time>
                {r.atualizada && <span className="block text-12 text-fumaca">{textos.convidados.mudouResposta}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
