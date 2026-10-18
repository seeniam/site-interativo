import { Plus } from "lucide-react";
import { TextoPendente } from "@/components/brand/TextoPendente";
import { BotaoLink } from "@/components/ui/Botao";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { formatarDataPontuada, formatarHora } from "@/lib/format";
import { estaPendente, type Talvez } from "@/lib/pendente";
import type { MarcoHistoria } from "@/types/casamento";
import { ContagemRegressiva } from "./ContagemRegressiva";
import { ListaDeCotas } from "./ListaDeCotas";
import { TituloSecao } from "./TituloSecao";

const { convite } = textos;

/** Contagem regressiva (briefing 6.1, item 3). */
export function SecaoContagem() {
  return (
    // Respiro de seção em cima, meio respiro embaixo: a contagem é curta e leva direto a "Quando e onde"
    // (sem o recorte entre as duas, o respiro inteiro dos dois lados virava um buraco — DECISOES A3).
    <section
      id="contagem"
      aria-labelledby="contagem-titulo"
      className="conteiner scroll-mt-20 pt-[clamp(72px,12vw,140px)] pb-[clamp(36px,6vw,70px)]"
    >
      <TituloSecao id="contagem-titulo" variante="discreto">
        {convite.contagem.titulo}
      </TituloSecao>
      <ContagemRegressiva
        data={casamento.data}
        horaTexto={formatarHora(casamento.data)}
        dataPontuada={formatarDataPontuada(casamento.data)}
      />
    </section>
  );
}

/**
 * Nossa história (briefing 6.1, item 4): só texto. Enquanto o casal não mandar os marcos,
 * a seção inteira não existe — nada de marco inventado.
 */
export function SecaoHistoria({ historia = casamento.historia }: { historia?: Talvez<readonly MarcoHistoria[]> }) {
  if (estaPendente(historia)) return null;
  return (
    <section id="historia" aria-labelledby="historia-titulo" className="conteiner respiro-secao">
      <TituloSecao id="historia-titulo">{convite.historia.titulo}</TituloSecao>
      <ol className="historia">
        {historia.map((marco) => (
          <li key={`${marco.ano}-${marco.titulo}`} className="historia__marco">
            <span aria-hidden className="historia__losango" />
            <p className="historia__ano texto-ouro numeros">{marco.ano}</p>
            <h3 className="text-20 font-medium text-tinta">{marco.titulo}</h3>
            <p className="medida text-16 text-fumaca">{marco.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Trajes (briefing 6.1, item 6). */
export function SecaoTrajes() {
  const { trajes } = casamento;
  return (
    <section id="trajes" aria-labelledby="trajes-titulo" className="bg-linho respiro-secao">
      <div className="conteiner flex flex-col items-center text-center">
        <TituloSecao id="trajes-titulo" apoio={trajes.orientacao}>
          {convite.trajes.titulo}
        </TituloSecao>
      </div>
    </section>
  );
}

/** Presentes, teaser (briefing 6.1, item 7): as três cotas, Ouro em destaque. */
export function SecaoPresentes() {
  return (
    <section id="presentes" aria-labelledby="presentes-titulo" className="conteiner respiro-secao">
      <TituloSecao id="presentes-titulo" apoio={convite.presentes.texto}>
        {convite.presentes.titulo}
      </TituloSecao>
      <ListaDeCotas />
      <div className="mt-10 flex justify-center">
        <BotaoLink href="/presentear" variante="texto">
          {convite.presentes.verLista}
        </BotaoLink>
      </div>
    </section>
  );
}

/** Dúvidas frequentes (briefing 6.1, item 8): <details> nativo, acessível por teclado. */
export function SecaoDuvidas() {
  return (
    <section id="duvidas" aria-labelledby="duvidas-titulo" className="duvidas-grade conteiner respiro-secao">
      <TituloSecao id="duvidas-titulo" variante="lateral">
        {convite.duvidas.titulo}
      </TituloSecao>
      <div className="duvidas">
        {casamento.faq.map((item) => (
          <details key={item.pergunta} className="duvidas__item">
            <summary className="duvidas__pergunta">
              <h3 className="text-16 font-normal">{item.pergunta}</h3>
              <Plus aria-hidden size={20} strokeWidth={1.5} className="duvidas__icone" />
            </summary>
            <div className="duvidas__resposta">
              {estaPendente(item.resposta) ? <TextoPendente item={item.resposta} /> : item.resposta}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/** Faixa do RSVP (briefing 6.1, item 9). */
export function FaixaRsvp() {
  return (
    <section aria-labelledby="rsvp-titulo" className="conteiner pb-[clamp(72px,12vw,140px)]">
      <div className="faixa-rsvp">
        <h2 id="rsvp-titulo" className="font-display text-39 font-light text-tinta sm:text-49">
          {convite.rsvp.titulo}
        </h2>
        <BotaoLink href="/confirmar-presenca" tamanho="grande">
          {convite.rsvp.botao}
        </BotaoLink>
      </div>
    </section>
  );
}
