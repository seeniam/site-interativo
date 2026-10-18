"use client";

import { Download, Eye, EyeOff, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useId, useState } from "react";
import { IconeAlianca } from "@/components/brand/icons";
import { Botao } from "@/components/ui/Botao";
import { textos } from "@/config/textos";
import {
  agruparPorQuemConvidou,
  contarRespostas,
  filtrarRespostas,
  ordenarRespostas,
  paginar,
  type CampoOrdenacao,
  type Direcao,
  type FiltroStatus,
  type RespostaConvidado,
} from "@/lib/convidados";
import { gerarCsvConvidados, nomeArquivoCsv } from "@/lib/csv";
import { exibirTelefone, formatarHora } from "@/lib/format";
import { CardConvidado } from "./CardConvidado";
import { ContadoresConvidados } from "./ContadoresConvidados";
import { EsqueletoLista } from "./EsqueletoLista";
import { TabelaConvidados } from "./TabelaConvidados";
import { useListaConvidados } from "./useListaConvidados";

const { convidados } = textos;

const FILTROS: { valor: FiltroStatus; rotulo: string }[] = [
  { valor: "todos", rotulo: convidados.filtros.todos },
  { valor: "confirmado", rotulo: convidados.filtros.confirmados },
  { valor: "recusou", rotulo: convidados.filtros.naoVao },
];

function baixarCsv(respostas: readonly RespostaConvidado[]) {
  const arquivo = new Blob([gerarCsvConvidados(respostas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivoCsv(new Date());
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** A lista de quem confirmou (briefing 6.6). Só aparece com a sessão dos noivos. */
export function PainelConvidados() {
  const router = useRouter();
  const id = useId();
  const { estado, carregar, tentarDeNovo } = useListaConvidados();
  const [busca, setBusca] = useState("");
  const buscaAdiada = useDeferredValue(busca);
  const [status, setStatus] = useState<FiltroStatus>("todos");
  const [agrupar, setAgrupar] = useState(false);
  const [mostrarTelefones, setMostrarTelefones] = useState(false);
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: Direcao }>({
    campo: "data",
    direcao: "desc",
  });
  const [pagina, setPagina] = useState(1);
  const [atualizando, setAtualizando] = useState(false);

  async function sair() {
    await fetch("/api/sair", { method: "POST" }).catch(() => null);
    router.refresh();
  }

  async function atualizarAgora() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  function ordenarPor(campo: CampoOrdenacao) {
    setOrdenacao((atual) =>
      atual.campo === campo
        ? { campo, direcao: atual.direcao === "asc" ? "desc" : "asc" }
        : { campo, direcao: campo === "nome" ? "asc" : "desc" },
    );
    setPagina(1);
  }

  if (estado.tipo === "carregando") return <EsqueletoLista />;

  const cabecalho = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-display text-39 font-light text-tinta sm:text-49">{convidados.titulo}</h1>
      <Botao variante="texto" onClick={() => void sair()}>
        {convidados.sair}
      </Botao>
    </div>
  );

  if (estado.tipo === "erro") {
    return (
      <div className="conteiner flex flex-col gap-8 pt-6">
        {cabecalho}
        <div role="alert" className="alerta-rsvp max-w-xl">
          <p>{convidados.erro}</p>
          <Botao variante="contorno" className="self-start" onClick={tentarDeNovo}>
            {convidados.tentarDeNovo}
          </Botao>
        </div>
      </div>
    );
  }

  const { respostas, atualizadoEm } = estado;
  const filtradas = ordenarRespostas(
    filtrarRespostas(respostas, { busca: buscaAdiada, status }),
    ordenacao.campo,
    ordenacao.direcao,
  );
  const grupos = agrupar ? agruparPorQuemConvidou(filtradas) : null;
  const paginacao = paginar(filtradas, pagina);
  const telefoneDe = (r: RespostaConvidado) => exibirTelefone(r.telefone, mostrarTelefones);

  const cartoes = (lista: readonly RespostaConvidado[], nivel: "h2" | "h3") => (
    <ul className="flex flex-col gap-3 lg:hidden">
      {lista.map((r) => (
        <li key={r.id}>
          <CardConvidado
            nome={r.nome}
            status={r.status}
            acompanhantes={r.acompanhantes.length}
            convidadoPor={r.convidadoPor}
            confirmadoEm={new Date(r.respondidoEm)}
            telefone={telefoneDe(r)}
            recado={r.recado}
            atualizada={r.atualizada}
            nivelTitulo={nivel}
          />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="conteiner flex flex-col gap-8 pt-6">
      {cabecalho}
      <ContadoresConvidados contadores={contarRespostas(respostas)} />

      {respostas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <IconeAlianca tamanho={40} className="text-ouro-escuro" />
          <p className="font-display text-31 font-light text-tinta">{convidados.vazio}</p>
          <p className="max-w-sm text-16 text-fumaca">{convidados.vazioApoio}</p>
          <Link href="/" className="botao botao--texto">
            {convidados.voltarAoConvite}
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-5">
            <div className="campo max-w-md">
              <label htmlFor={`${id}-busca`} className="campo__rotulo">
                {convidados.busca}
              </label>
              <input
                id={`${id}-busca`}
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                className="campo__entrada"
                aria-describedby={`${id}-busca-ajuda`}
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
              />
              <p id={`${id}-busca-ajuda`} className="campo__ajuda">
                {convidados.buscaAjuda}
              </p>
            </div>

            <div role="group" aria-label={convidados.filtros.rotulo} className="flex flex-wrap gap-2">
              {FILTROS.map((f) => (
                <button
                  key={f.valor}
                  type="button"
                  className="chip"
                  aria-pressed={status === f.valor}
                  onClick={() => {
                    setStatus(f.valor);
                    setPagina(1);
                  }}
                >
                  {f.rotulo}
                </button>
              ))}
              <button type="button" className="chip" aria-pressed={agrupar} onClick={() => setAgrupar((a) => !a)}>
                {convidados.filtros.porQuemConvidou}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-borda py-3">
              <Botao
                variante="texto"
                onClick={() => void atualizarAgora()}
                aria-busy={atualizando || undefined}
                icone={
                  <RefreshCw
                    aria-hidden
                    size={16}
                    strokeWidth={1.5}
                    className={atualizando ? "animate-spin" : undefined}
                  />
                }
              >
                {convidados.atualizar}
              </Botao>
              <p className="text-12 text-fumaca">{convidados.atualizadoAs(formatarHora(atualizadoEm))}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-3 sm:ml-auto">
                <Botao
                  variante="texto"
                  aria-pressed={mostrarTelefones}
                  onClick={() => setMostrarTelefones((m) => !m)}
                  icone={
                    mostrarTelefones ? (
                      <EyeOff aria-hidden size={16} strokeWidth={1.5} />
                    ) : (
                      <Eye aria-hidden size={16} strokeWidth={1.5} />
                    )
                  }
                >
                  {mostrarTelefones ? convidados.ocultarTelefones : convidados.mostrarTelefones}
                </Botao>
                <Botao
                  variante="texto"
                  onClick={() => baixarCsv(filtradas)}
                  icone={<Download aria-hidden size={16} strokeWidth={1.5} />}
                >
                  {convidados.exportar}
                </Botao>
              </div>
            </div>

            <p role="status" className="text-14 text-fumaca">
              {convidados.resultado(filtradas.length)}
            </p>
          </div>

          {grupos ? (
            <div className="flex flex-col gap-10">
              {grupos.map((grupo, i) => {
                const idGrupo = `${id}-grupo-${i}`;
                return (
                  <section
                    key={grupo.convidadoPor || "nao-informado"}
                    aria-labelledby={idGrupo}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-ouro/40 pb-2">
                      <h2 id={idGrupo} className="font-display text-25 text-tinta">
                        {grupo.convidadoPor || convidados.naoInformado}
                      </h2>
                      <p className="text-14 text-fumaca numeros">
                        {convidados.subtotal(grupo.contadores.pessoasConfirmadas, grupo.contadores.respostas)}
                      </p>
                    </div>
                    {cartoes(grupo.respostas, "h3")}
                    <div className="hidden lg:block">
                      <TabelaConvidados
                        respostas={grupo.respostas}
                        legenda={`${convidados.tabela.legenda}: ${grupo.convidadoPor || convidados.naoInformado}`}
                        ordenacao={ordenacao}
                        aoOrdenar={ordenarPor}
                        telefoneDe={telefoneDe}
                      />
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <>
              {cartoes(filtradas, "h2")}
              <div className="hidden flex-col gap-4 lg:flex">
                <TabelaConvidados
                  respostas={paginacao.itens}
                  legenda={convidados.tabela.legenda}
                  ordenacao={ordenacao}
                  aoOrdenar={ordenarPor}
                  telefoneDe={telefoneDe}
                />
                {paginacao.paginas > 1 && (
                  <nav aria-label={convidados.paginacao.rotulo} className="flex items-center justify-end gap-4">
                    <Botao
                      variante="texto"
                      aria-disabled={paginacao.atual === 1 || undefined}
                      onClick={() => paginacao.atual > 1 && setPagina(paginacao.atual - 1)}
                    >
                      {convidados.paginacao.anterior}
                    </Botao>
                    <p className="text-14 text-fumaca numeros">
                      {convidados.paginacao.pagina(paginacao.atual, paginacao.paginas)}
                    </p>
                    <Botao
                      variante="texto"
                      aria-disabled={paginacao.atual === paginacao.paginas || undefined}
                      onClick={() => paginacao.atual < paginacao.paginas && setPagina(paginacao.atual + 1)}
                    >
                      {convidados.paginacao.proxima}
                    </Botao>
                  </nav>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
