import Image, { type StaticImageData } from "next/image";
import { ICONES_POR_NOME, IconePresente, type NomeIconeMarca } from "@/components/brand/icons";
import { TextoPendente } from "@/components/brand/TextoPendente";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { textos } from "@/config/textos";
import { partesBRL } from "@/lib/format";
import { estaPendente, type Talvez } from "@/lib/pendente";

export interface CardPresenteProps {
  titulo: string;
  /** Em reais. */
  valor: number;
  /** Frase do casal sobre o presente. */
  descricao: Talvez<string>;
  foto?: { imagem: StaticImageData | string; alt: string };
  /** Ícone próprio mostrado quando não há foto. Cada cota usa um diferente. */
  icone?: NomeIconeMarca;
  /** Para onde o botão leva: a tela do PIX deste presente. */
  href: string;
  /** Borda em gradiente-ouro — reservado aos presentes em destaque. */
  destaque?: boolean;
  /** Alguém já presenteou este item (lido de `presentes_reservados`). */
  presenteado?: boolean;
  /** Nível do título na página onde o card aparece. */
  nivelTitulo?: "h2" | "h3" | "h4";
}

export function CardPresente({
  titulo,
  valor,
  descricao,
  foto,
  icone = "presente",
  href,
  destaque = false,
  presenteado = false,
  nivelTitulo: Titulo = "h3",
}: CardPresenteProps) {
  const { simbolo, numero } = partesBRL(valor);
  const Icone = ICONES_POR_NOME[icone];

  const corpo = (
    <article
      className={[
        "flex h-full flex-col overflow-hidden",
        presenteado ? "bg-linho" : "bg-branco shadow-quente",
        // Dentro da borda-ouro, o raio interno é 1px menor para acompanhar a curva de fora.
        destaque ? "rounded-[calc(var(--radius-card)-1px)]" : "rounded-card ring-1 ring-borda",
      ].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden",
          // Com foto, a foto manda (16:10). Sem foto, só uma faixa de luz com o ícone — nada de painel vazio.
          foto ? "aspect-[16/10]" : "h-24 sm:h-28",
          presenteado ? "opacity-60 grayscale-[.35]" : "",
        ].join(" ")}
      >
        {foto ? (
          <Image
            src={foto.imagem}
            alt={foto.alt}
            fill
            sizes="(min-width: 1120px) 360px, (min-width: 768px) 50vw, 100vw"
            className="object-cover object-[50%_22%] foto-tratada"
            placeholder={typeof foto.imagem === "string" ? "empty" : "blur"}
          />
        ) : (
          <div className="luz-champanhe flex h-full items-center justify-center text-ouro-escuro">
            <Icone tamanho={36} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <Titulo className="font-display text-25 font-normal text-tinta">{titulo}</Titulo>

        <p className="text-14 text-fumaca">
          {estaPendente(descricao) ? <TextoPendente item={descricao} /> : descricao}
        </p>

        {presenteado ? (
          <div className="mt-auto flex flex-col gap-3 pt-3">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-champanhe px-3 py-1.5 text-12 font-normal text-tinta">
              <IconePresente tamanho={14} className="text-ouro-escuro" />
              {textos.presentes.presenteado.selo}
            </p>
            <p className="text-14 text-fumaca">{textos.presentes.presenteado.convite}</p>
            <Botao variante="contorno" bloco disabled>
              {textos.presentes.presenteado.botao}
            </Botao>
          </div>
        ) : (
          <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pt-4">
            <p className="flex items-baseline gap-1.5 text-tinta">
              <span className="text-14 text-fumaca">{simbolo}</span>
              <span className="font-display text-39 leading-none font-light numeros">{numero}</span>
            </p>
            <BotaoLink
              href={href}
              variante="contorno"
              aria-label={textos.presentes.rotuloAcessivel(titulo, `${simbolo} ${numero}`)}
            >
              {textos.presentes.botao}
            </BotaoLink>
          </div>
        )}
      </div>
    </article>
  );

  if (!destaque) return corpo;

  // Borda de 1px em gradiente-ouro: o fundo dourado aparece só na fresta entre as camadas.
  return <div className="borda-ouro h-full rounded-card p-px">{corpo}</div>;
}
