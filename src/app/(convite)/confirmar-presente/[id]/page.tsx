import { ArrowLeft, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { ICONES_POR_NOME } from "@/components/brand/icons";
import { CopiaECola, QrPix } from "@/components/presentes/PainelPix";
import { BotaoLink } from "@/components/ui/Botao";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { formatarBRL, partesBRL } from "@/lib/format";
import { payloadPixDoPresente } from "@/lib/pix";
import { linkComprovante } from "@/lib/whatsapp";

const { pix } = textos;

export function generateStaticParams() {
  return casamento.presentes.map((p) => ({ id: p.id }));
}

function presenteDoId(id: string) {
  return casamento.presentes.find((p) => p.id === id);
}

export async function generateMetadata({ params }: PageProps<"/confirmar-presente/[id]">): Promise<Metadata> {
  const presente = presenteDoId((await params).id);
  return presente ? { title: presente.titulo, robots: { index: false } } : {};
}

/** A tela do PIX (briefing 6.3). Id desconhecido → 404 com a identidade do site. */
export default async function ConfirmarPresente({ params }: PageProps<"/confirmar-presente/[id]">) {
  const presente = presenteDoId((await params).id);
  if (!presente) notFound();

  const payload = payloadPixDoPresente(casamento.pix, presente);
  const { simbolo, numero } = partesBRL(presente.valor);
  const Icone = ICONES_POR_NOME[presente.icone];
  const whatsapp = linkComprovante(
    casamento.whatsapp.numero,
    casamento.whatsapp.mensagemComprovante,
    pix.comprovanteLinhas(presente.titulo, formatarBRL(presente.valor)),
  );

  return (
    <div className="conteiner respiro-secao">
      <div className="mx-auto flex max-w-md flex-col gap-10 lg:max-w-4xl lg:flex-row lg:items-start lg:gap-16">
        <div className="flex flex-col items-center gap-5 text-center lg:sticky lg:top-28 lg:flex-1 lg:items-start lg:text-left">
          <p className="versalete">{pix.voceEstaPresenteando}</p>
          <div className="flex items-center gap-3">
            <Icone tamanho={32} className="text-ouro" />
            <h1 className="font-display text-39 font-light text-tinta sm:text-49">{presente.titulo}</h1>
          </div>
          <p className="flex items-baseline gap-2">
            <span className="text-16 text-fumaca">{simbolo}</span>
            <span className="font-display text-61 leading-none font-light text-tinta numeros sm:text-76">{numero}</span>
          </p>
          <FileteDourado />
          <p className="text-14 text-fumaca">{pix.recebedor(casamento.noivos.titulo)}</p>

          <div className="hidden w-full lg:block">
            <h2 className="mb-3 text-14 font-normal text-tinta">{pix.passosTitulo}</h2>
            <ol className="passos-pix">
              {pix.passos.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-1">
          <section aria-labelledby="qr-titulo" className="cartao-pix">
            <h2 id="qr-titulo" className="text-center text-14 font-normal text-tinta">
              {pix.qrTitulo}
            </h2>
            <QrPix payload={payload} />
          </section>

          <section aria-labelledby="codigo-titulo" className="flex flex-col gap-3">
            <h2 id="codigo-titulo" className="text-14 font-normal text-tinta">
              {pix.codigoTitulo}
            </h2>
            <CopiaECola payload={payload} />
          </section>

          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="botao botao--contorno botao--bloco"
            data-comprovante=""
          >
            <MessageCircle aria-hidden size={18} strokeWidth={1.5} />
            <span>{pix.enviarComprovante}</span>
            <span className="sr-only"> {textos.convite.local.abreEmNovaAba}</span>
          </a>

          <div className="lg:hidden">
            <h2 className="mb-3 text-14 font-normal text-tinta">{pix.passosTitulo}</h2>
            <ol className="passos-pix">
              {pix.passos.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ol>
          </div>

          <BotaoLink
            href="/presentear"
            variante="texto"
            className="self-center"
            icone={<ArrowLeft aria-hidden size={16} strokeWidth={1.5} />}
          >
            {pix.voltar}
          </BotaoLink>
        </div>
      </div>
    </div>
  );
}
