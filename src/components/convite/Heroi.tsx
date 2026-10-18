import Image from "next/image";
import { EComercial } from "@/components/brand/EComercial";
import { Monograma } from "@/components/brand/Monograma";
import { NomeEmTracos } from "@/components/brand/NomeEmTracos";
import { ID_HEROI } from "@/components/layout/BarraInferior";
import { BotaoLink } from "@/components/ui/Botao";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { partesDataPorExtenso } from "@/lib/format";

const { ela, ele } = casamento.noivos;

/**
 * O primeiro impacto (briefing 6.1, item 2). Celular: a foto em tela cheia (dvh).
 * Desktop: quadro 16:10 dentro do container (DECISOES H2). É um dos dois únicos lugares
 * onde a foto aparece (H1).
 */
export function Heroi() {
  const { data, diaDaSemana, hora } = partesDataPorExtenso(casamento.data);
  const { heroi } = textos.convite;

  return (
    <section id={ID_HEROI} aria-labelledby="heroi-titulo" className="lg:conteiner lg:pt-2">
      <div className="heroi">
        <Image
          src={casamento.fotoCasal.imagem}
          alt={casamento.fotoCasal.alt}
          fill
          loading="eager"
          fetchPriority="high"
          placeholder="blur"
          sizes="(min-width: 1184px) 1120px, (min-width: 768px) calc(100vw - 64px), 100vw"
          className="heroi__foto heroi-foto-revela foto-tratada"
        />
        <div aria-hidden className="heroi__veu" />

        {/* O monograma "pousa" aqui depois da abertura — no celular não há cabeçalho. */}
        <Monograma decorativo tom="branco" className="heroi__monograma heroi-revela md:hidden" />

        <div className="heroi__texto heroi-revela">
          <h1 id="heroi-titulo" className="heroi__nomes">
            <span className="sr-only">
              {ela} e {ele}
            </span>
            <NomeEmTracos quem="ela" className="heroi__nome" />
            <EComercial className="heroi__ecomercial" />
            <NomeEmTracos quem="ele" className="heroi__nome" />
          </h1>

          <blockquote className="heroi__versiculo">
            <p>“{casamento.versiculo.texto}”</p>
            <footer>{casamento.versiculo.referencia}</footer>
          </blockquote>

          <p className="heroi__data">
            <time dateTime={casamento.data}>
              <span className="whitespace-nowrap">{data}</span>
              <span aria-hidden> · </span>
              <span className="whitespace-nowrap">{diaDaSemana}</span>
              <span aria-hidden> · </span>
              <span className="whitespace-nowrap">{hora}</span>
            </time>
          </p>

          <div className="heroi__acoes">
            <BotaoLink href="/confirmar-presenca" bloco>
              {textos.navegacao.confirmarPresenca}
            </BotaoLink>
            <BotaoLink href="/presentear" variante="claro" bloco>
              {heroi.presentear}
            </BotaoLink>
          </div>
        </div>

        <a href="#contagem" className="heroi__rolar" aria-label={heroi.rolar}>
          <span aria-hidden className="heroi__rolar-trilho" />
        </a>
      </div>
    </section>
  );
}
