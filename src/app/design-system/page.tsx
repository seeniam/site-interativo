import { CalendarPlus, Copy, MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { EComercial } from "@/components/brand/EComercial";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { ICONES_DA_MARCA } from "@/components/brand/icons";
import { Monograma } from "@/components/brand/Monograma";
import { TextoPendente } from "@/components/brand/TextoPendente";
import { ValorAConfirmar } from "@/components/brand/ValorAConfirmar";
import { CardConvidado } from "@/components/convidados/CardConvidado";
import { CardPresente } from "@/components/presentes/CardPresente";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { casamento } from "@/config/casamento";
import { formatarDataPorExtenso } from "@/lib/format";
import { listarPendencias } from "@/lib/pendente";
import type { CampoAConfirmar } from "@/types/casamento";
import { GRUPOS_DE_COR } from "./_componentes/paleta";
import { PalcoMonograma } from "./_componentes/PalcoMonograma";
import { Legenda, Secao } from "./_componentes/Secao";

export const metadata: Metadata = {
  title: "Sistema visual",
  robots: { index: false, follow: false },
};

const { ela, ele, titulo: NOME_DO_CASAL } = casamento.noivos;

const SECOES = [
  { id: "monograma", nome: "Monograma" },
  { id: "paleta", nome: "Paleta" },
  { id: "tipografia", nome: "Tipografia" },
  { id: "filete", nome: "Filete" },
  { id: "botoes", nome: "Botões" },
  { id: "icones", nome: "Ícones" },
  { id: "cartoes", nome: "Cartões" },
  { id: "pendencias", nome: "Dados pendentes" },
] as const;

const ESCALA = [
  { px: 76, amostra: "Nós dois", classe: "text-76 font-display font-light" },
  { px: 61, amostra: "Nós dois", classe: "text-61 font-display font-light" },
  { px: 49, amostra: "Nós dois", classe: "text-49 font-display font-light" },
  { px: 39, amostra: "Nossa história", classe: "text-39 font-display font-light" },
  { px: 31, amostra: "Quando e onde", classe: "text-31 font-display font-normal" },
  { px: 25, amostra: "Cota de carinho", classe: "text-25 font-display font-normal" },
  { px: 20, amostra: "Confirme sua presença", classe: "text-20 font-light" },
  { px: 16, amostra: "Vamos guardar um lugar para você.", classe: "text-16 font-light" },
  { px: 14, amostra: "Respondeu em 12/03", classe: "text-14 font-light" },
  { px: 12, amostra: "Dias até o casamento", classe: "versalete" },
] as const;

const ESTADOS = [
  { rotulo: "Padrão", props: {} },
  { rotulo: "Hover", props: { "data-estado": "hover" } },
  { rotulo: "Foco", props: { "data-estado": "foco" } },
  { rotulo: "Pressionado", props: { "data-estado": "pressionado" } },
  { rotulo: "Desabilitado", props: { disabled: true } },
  { rotulo: "Carregando", props: { carregando: true, textoCarregando: "Enviando…" } },
] as const;

const VARIANTES = [
  {
    variante: "primario",
    nome: "Primário",
    texto: "Confirmar presença",
    uso: "A ação principal da tela. Uma por vista.",
  },
  { variante: "contorno", nome: "Contorno", texto: "Presentear", uso: "Ação paralela à principal." },
  { variante: "texto", nome: "Texto", texto: "Escolher outro presente", uso: "Caminho secundário, discreto." },
] as const;

const ICONES_DE_INTERFACE = [
  { nome: "Copiar", Icone: Copy },
  { nome: "Agenda", Icone: CalendarPlus },
  { nome: "Mapa", Icone: MapPin },
  { nome: "Busca", Icone: Search },
  { nome: "Filtro", Icone: SlidersHorizontal },
] as const;

/** Exemplos para visualizar os cartões. Nunca aparecem em rota pública. */
const CONVIDADOS_DE_EXEMPLO = [
  {
    nome: "Nome de exemplo com sobrenome",
    status: "confirmado",
    acompanhantes: 2,
    convidadoPor: ela,
    confirmadoEm: new Date("2027-03-12T15:00:00-03:00"),
  },
  {
    nome: "Outro convidado de exemplo",
    status: "confirmado",
    acompanhantes: 0,
    convidadoPor: ele,
    confirmadoEm: new Date("2027-03-14T10:00:00-03:00"),
  },
  {
    nome: "Convidado que não poderá ir",
    status: "recusou",
    acompanhantes: 0,
    convidadoPor: ela,
    confirmadoEm: new Date("2027-03-20T19:30:00-03:00"),
  },
] as const;

/** Sem repetição: o mesmo dado pode aparecer em mais de um lugar do config (ex.: prazo no RSVP e no FAQ). */
const PENDENCIAS = [...new Map(listarPendencias(casamento).map((p) => [p.descricao, p])).values()];

/** Nome legível de cada campo "a confirmar" — documentação interna desta página. */
const CAMPOS_A_CONFIRMAR: Record<CampoAConfirmar, string> = {
  data: "Data",
  "presentes.valores": "Cotas",
  "pix.nomeRecebedor": "Recebedor do PIX",
  "whatsapp.numero": "WhatsApp",
  "local.cerimoniaNoMesmoLocal": "Cerimônia",
  "versiculo.referencia": "Versículo",
  "rsvp.maxAcompanhantes": "Acompanhantes",
};
const A_CONFIRMAR = Object.entries(casamento.aConfirmar) as [CampoAConfirmar, string][];

export default function DesignSystemPage() {
  return (
    <div className="conteiner lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16 xl:gap-24">
      {/* Índice: no topo no celular, fixo à esquerda no desktop. */}
      <aside className="pt-10 lg:sticky lg:top-0 lg:h-dvh lg:pt-16">
        <Monograma decorativo className="h-auto w-[88px] text-tinta" />
        <nav aria-label="Seções" className="mt-8">
          <ul className="-mx-2.5 flex flex-wrap lg:flex-col">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center px-2.5 text-14 text-fumaca underline-offset-4 transition-[color] hover:text-tinta hover:underline hover:decoration-ouro lg:justify-start"
                >
                  {s.nome}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <main id="conteudo" className="pb-24">
        <header className="pt-12 pb-16 lg:pt-16 lg:pb-24">
          <p className="versalete">Referência interna</p>
          <h1 className="mt-4 font-display text-49 font-light text-tinta lg:text-61">Sistema visual</h1>
          <p className="mt-5 medida text-16 text-fumaca">
            As peças do convite de {NOME_DO_CASAL} num lugar só. Luz de fim de tarde em papel de algodão: branco quente,
            ouro como luz, e a foto do casal como coração. Esta página não aparece para os convidados.
          </p>
        </header>

        <div className="flex flex-col">
          {/* ── Monograma ───────────────────────────────────────────── */}
          <Secao
            id="monograma"
            titulo="Monograma"
            descricao="As iniciais do casal em Cormorant, ligadas por um “&” em Pinyon Script. São contornos reais das fontes, gravados como SVG: se desenham na abertura e não esperam fonte carregar."
          >
            <div className="rounded-secao bg-linho px-6 pt-16 pb-8 sm:pt-20">
              <PalcoMonograma rotulo={NOME_DO_CASAL} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <figure>
                <div className="flex aspect-square items-center justify-center rounded-card bg-branco ring-1 ring-borda">
                  <Monograma decorativo className="h-auto w-[62%] text-tinta" />
                </div>
                <Legenda>Sobre branco</Legenda>
              </figure>
              <figure>
                <div className="flex aspect-square items-center justify-center rounded-card bg-tinta">
                  <Monograma decorativo tom="branco" className="h-auto w-[62%]" />
                </div>
                <Legenda>Sobre tinta</Legenda>
              </figure>
              <figure>
                <div className="relative aspect-square overflow-hidden rounded-card">
                  <Image
                    src={casamento.fotoCasal.imagem}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    placeholder="blur"
                    className="object-cover object-[50%_20%] foto-tratada"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(23_20_15/.55),transparent_55%)]" />
                  <Monograma
                    decorativo
                    tom="branco"
                    className="absolute inset-x-0 bottom-[12%] mx-auto h-auto w-[52%]"
                  />
                </div>
                <Legenda>Sobre a foto</Legenda>
              </figure>
              <figure>
                <div className="flex aspect-square flex-col items-center justify-center gap-5 rounded-card bg-branco ring-1 ring-borda">
                  <Monograma decorativo className="h-auto w-12 text-tinta" />
                  <Monograma decorativo className="h-auto w-8 text-tinta" />
                </div>
                <Legenda>Tamanhos pequenos</Legenda>
              </figure>
            </div>
          </Secao>

          <FileteDourado className="mx-auto my-20 sm:my-28" />

          {/* ── Paleta ──────────────────────────────────────────────── */}
          <Secao
            id="paleta"
            titulo="Paleta"
            descricao="Branco de papel, não de tela. O ouro aparece como luz: em filetes, ícones e no “&”. Texto dourado, só em ouro-escuro."
          >
            <div className="flex flex-col gap-12">
              {GRUPOS_DE_COR.map((grupo) => (
                <div key={grupo.nome}>
                  <h3 className="mb-4 text-14 font-normal text-tinta">{grupo.nome}</h3>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
                    {grupo.cores.map((cor) => (
                      <li key={cor.token}>
                        <div
                          className={`aspect-[4/3] rounded-card ${cor.clara ? "ring-1 ring-borda" : ""}`}
                          style={{ background: `var(--${cor.token})` }}
                        />
                        <p className="mt-3 text-14 font-normal text-tinta">{cor.token}</p>
                        <p className="text-12 text-fumaca uppercase numeros">{cor.hex}</p>
                        <p className="mt-1 text-12 text-fumaca">{cor.papel}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <h3 className="mb-4 text-14 font-normal text-tinta">Gradiente-ouro</h3>
                <div className="h-16 rounded-card" style={{ backgroundImage: "var(--gradiente-ouro)" }} />
                <p className="mt-3 text-12 text-fumaca">
                  O único gradiente do projeto. Monograma, filetes, borda do presente em destaque, e em texto só nos
                  números e no “&”.
                </p>
              </div>
            </div>
          </Secao>

          <FileteDourado className="mx-auto my-20 sm:my-28" />

          {/* ── Tipografia ──────────────────────────────────────────── */}
          <Secao
            id="tipografia"
            titulo="Tipografia"
            descricao="Cormorant Garamond para nomes, títulos e números. Jost para todo o resto. Pinyon Script só no “&” e na assinatura do rodapé."
          >
            <div className="rounded-secao bg-branco px-6 py-14 text-center ring-1 ring-borda sm:py-20">
              <p className="font-display text-49 font-light tracking-[.02em] text-tinta lg:text-76">
                <span className="block">{ela}</span>
                <EComercial className="mx-auto my-1.5 block h-6 w-auto lg:my-2 lg:h-9" />
                <span className="sr-only">e</span>
                <span className="block">{ele}</span>
              </p>
              <p className="mt-6 text-14 text-fumaca">
                Nomes no herói: Cormorant 300, 49px no celular, 76px no desktop
              </p>
            </div>

            <ol className="mt-12 flex flex-col">
              {ESCALA.map((nivel) => (
                <li key={nivel.px} className="flex items-baseline gap-5 border-b border-borda py-4 last:border-b-0">
                  <span className="w-8 shrink-0 text-12 text-fumaca numeros">{nivel.px}</span>
                  <span className={`${nivel.classe} min-w-0 truncate text-tinta`}>{nivel.amostra}</span>
                </li>
              ))}
            </ol>

            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="font-display text-61 leading-none font-light numeros">
                  <span className="texto-ouro">128</span>
                </p>
                <Legenda>Números: Cormorant com algarismos tabulares; em ouro só aqui e no “&”.</Legenda>
              </div>
              <div>
                <p className="medida text-16 text-tinta">
                  A voz é do casal: simples, calorosa, direta. Cada linha com no máximo uns sessenta caracteres, para
                  ler no celular sem esforço.
                </p>
                <Legenda>Texto corrido: Jost 300, 16px, entrelinha 1.65.</Legenda>
              </div>
            </div>
          </Secao>

          <FileteDourado className="mx-auto my-20 sm:my-28" />

          {/* ── Filete ──────────────────────────────────────────────── */}
          <Secao
            id="filete"
            titulo="Filete"
            descricao="Um fio de 1px por 56px com um losango de 5px no meio. É a assinatura gráfica do site: separa seções e nunca muda de forma."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <figure>
                <div className="flex h-56 items-center justify-center rounded-card bg-branco ring-1 ring-borda">
                  <FileteDourado className="filete-dourado--ampliado" />
                </div>
                <Legenda>Ampliado 4×, para ver o losango</Legenda>
              </figure>
              <figure>
                <div className="flex h-56 flex-col items-center justify-center gap-5 rounded-card bg-linho px-6 text-center">
                  <p className="font-display text-31 text-tinta">Quando e onde</p>
                  <FileteDourado />
                  <p className="text-14 text-fumaca">Em tamanho real, entre título e texto</p>
                </div>
                <Legenda>Em uso</Legenda>
              </figure>
            </div>
          </Secao>

          <FileteDourado className="mx-auto my-20 sm:my-28" />

          {/* ── Botões ──────────────────────────────────────────────── */}
          <Secao
            id="botoes"
            titulo="Botões"
            descricao="Pílulas de no mínimo 48px de altura. O texto diz exatamente o que acontece. Estados forçados abaixo para comparar lado a lado."
          >
            <div className="flex flex-col gap-14">
              {VARIANTES.map((v) => (
                <div key={v.variante}>
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-16 font-normal text-tinta">{v.nome}</h3>
                    <p className="text-14 text-fumaca">{v.uso}</p>
                  </div>
                  <ul className="flex flex-wrap gap-x-6 gap-y-6">
                    {ESTADOS.map((estado) => (
                      <li key={estado.rotulo} className="flex flex-col items-start">
                        <Botao variante={v.variante} {...estado.props}>
                          {v.texto}
                        </Botao>
                        <Legenda>{estado.rotulo}</Legenda>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <h3 className="mb-5 text-16 font-normal text-tinta">Tamanhos e composição</h3>
                <div className="flex flex-col items-start gap-6">
                  <div>
                    <Botao tamanho="grande">Confirmar presença</Botao>
                    <Legenda>Grande, 56px — o convite para o RSVP</Legenda>
                  </div>
                  <div>
                    <Botao variante="contorno" icone={<Copy aria-hidden size={18} strokeWidth={1.5} />}>
                      Copiar código PIX
                    </Botao>
                    <Legenda>Com ícone de interface (lucide, traço 1.5)</Legenda>
                  </div>
                  <div className="w-full max-w-sm">
                    <BotaoLink href="#botoes" bloco>
                      Enviar comprovante
                    </BotaoLink>
                    <Legenda>Largura total, para formulários no celular</Legenda>
                  </div>
                </div>
              </div>
            </div>
          </Secao>

          <FileteDourado className="mx-auto my-20 sm:my-28" />

          {/* ── Ícones ──────────────────────────────────────────────── */}
          <Secao
            id="icones"
            titulo="Ícones"
            descricao="Seis ícones desenhados para o convite, na mesma grade de 24px e traço de 1.5px dos filetes. Emoji não entra em lugar nenhum."
          >
            <ul className="grid grid-cols-3 gap-px overflow-hidden rounded-card bg-borda ring-1 ring-borda sm:grid-cols-6">
              {ICONES_DA_MARCA.map(({ nome, Icone }) => (
                <li key={nome} className="flex flex-col items-center gap-4 bg-branco px-2 pt-8 pb-5">
                  {/* Elemento não textual de 1.5px: o ouro puro é permitido aqui (briefing 3.2). */}
                  <Icone tamanho={48} className="text-ouro" />
                  <span className="text-12 text-fumaca">{nome}</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-12 mb-4 text-14 font-normal text-tinta">Interface</h3>
            <ul className="flex flex-wrap gap-x-8 gap-y-4">
              {ICONES_DE_INTERFACE.map(({ nome, Icone }) => (
                <li key={nome} className="flex items-center gap-2 text-tinta">
                  <Icone aria-hidden size={20} strokeWidth={1.5} />
                  <span className="text-14 text-fumaca">{nome}</span>
                </li>
              ))}
            </ul>
          </Secao>

          <FileteDourado className="mx-auto my-20 sm:my-28" />

          {/* ── Cartões ─────────────────────────────────────────────── */}
          <Secao
            id="cartoes"
            titulo="Cartões"
            descricao="O presente e a linha da lista de convidados. As três cotas vêm direto da configuração; os demais cartões são exemplos para ver os estados."
          >
            <h3 className="mb-5 text-16 font-normal text-tinta">As três cotas</h3>
            <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2">
              {casamento.presentes.map((presente) => (
                <li key={presente.id} className="flex flex-col">
                  <div className="flex-1">
                    <CardPresente
                      nivelTitulo="h4"
                      titulo={presente.titulo}
                      valor={presente.valor}
                      descricao={presente.descricao}
                      icone={presente.icone}
                      destaque={"destaque" in presente && presente.destaque}
                      href="#cartoes"
                    />
                  </div>
                  <Legenda>
                    {"destaque" in presente && presente.destaque
                      ? "Em destaque: borda em gradiente-ouro"
                      : "Sem foto: ícone próprio da cota"}
                  </Legenda>
                </li>
              ))}
            </ul>

            <h3 className="mt-14 mb-5 text-16 font-normal text-tinta">Outros estados (exemplos)</h3>
            <ul className="grid gap-x-6 gap-y-10 md:grid-cols-2">
              <li className="flex flex-col">
                <div className="flex-1">
                  <CardPresente
                    nivelTitulo="h4"
                    titulo="Presente com foto"
                    valor={320}
                    descricao="Para presentes nomeados que tiverem foto."
                    foto={{ imagem: casamento.fotoCasal.imagem, alt: casamento.fotoCasal.alt }}
                    href="#cartoes"
                  />
                </div>
                <Legenda>Com foto</Legenda>
              </li>
              <li className="flex flex-col">
                <div className="flex-1">
                  <CardPresente
                    nivelTitulo="h4"
                    titulo="Presente já escolhido"
                    valor={180}
                    descricao="Alguém chegou antes."
                    icone="buque"
                    href="#cartoes"
                    presenteado
                  />
                </div>
                <Legenda>Já presenteado</Legenda>
              </li>
            </ul>

            <h3 className="mt-14 mb-5 text-16 font-normal text-tinta">Convidado</h3>
            <ul className="flex max-w-xl flex-col gap-3">
              {CONVIDADOS_DE_EXEMPLO.map((c) => (
                <li key={c.nome}>
                  <CardConvidado {...c} nivelTitulo="h4" />
                </li>
              ))}
            </ul>
          </Secao>

          <FileteDourado className="mx-auto my-20 sm:my-28" />

          {/* ── Dados pendentes ─────────────────────────────────────── */}
          <Secao
            id="pendencias"
            titulo="Dados pendentes"
            descricao="Dois estados, nunca um pelo outro. “A confirmar”: o dado chegou, mas há dúvida — ele aparece, com o selo. “A definir”: o dado não existe — o lugar dele mostra o que falta. As duas listas são lidas da configuração."
          >
            <h3 className="mb-3 text-16 font-normal text-tinta">A confirmar</h3>
            <p className="mb-4 text-14 text-fumaca">Como um dado com dúvida aparece (exemplo de estado):</p>
            <p className="mb-5 font-display text-25">
              <ValorAConfirmar>{formatarDataPorExtenso(casamento.data)}</ValorAConfirmar>
            </p>
            {A_CONFIRMAR.length > 0 ? (
              <dl className="mb-14 divide-y divide-borda rounded-card bg-branco px-5 ring-1 ring-borda sm:px-8">
                {A_CONFIRMAR.map(([campo, motivo]) => (
                  <div key={campo} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:gap-8">
                    <dt className="w-40 shrink-0 text-14 font-normal text-tinta">{CAMPOS_A_CONFIRMAR[campo]}</dt>
                    <dd className="text-14 text-fumaca">{motivo}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mb-14 rounded-card bg-branco px-5 py-4 text-14 text-fumaca ring-1 ring-borda sm:px-8">
                Nada a confirmar: o casal confirmou todos os dados enviados.
              </p>
            )}

            <h3 className="mb-3 text-16 font-normal text-tinta">A definir</h3>
            <p className="mb-4 text-14 text-fumaca">
              <span className="numeros">{PENDENCIAS.length}</span> itens aguardando o casal
            </p>
            <ul className="grid rounded-card bg-branco px-5 ring-1 ring-borda sm:px-8 md:grid-cols-2 md:gap-x-10">
              {PENDENCIAS.map((item) => (
                <li key={item.descricao} className="border-b border-borda py-3.5 text-16 last:border-b-0">
                  <TextoPendente item={item} />
                </li>
              ))}
            </ul>
          </Secao>
        </div>
      </main>
    </div>
  );
}
