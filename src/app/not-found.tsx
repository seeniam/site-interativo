import type { Metadata } from "next";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { Monograma } from "@/components/brand/Monograma";
import { BotaoLink } from "@/components/ui/Botao";
import { textos } from "@/config/textos";

export const metadata: Metadata = {
  title: textos.naoEncontrada.titulo,
  robots: { index: false },
};

/** 404 com a identidade do convite (briefing 6.7). */
export default function NaoEncontrada() {
  const { naoEncontrada } = textos;
  return (
    <main
      id="conteudo"
      className="conteiner flex min-h-dvh flex-col items-center justify-center gap-8 py-16 text-center"
    >
      <Monograma decorativo className="h-auto w-36 text-tinta sm:w-44" />
      <FileteDourado />
      <div className="flex max-w-md flex-col gap-4">
        <h1 className="font-display text-39 leading-tight font-light text-balance text-tinta sm:text-49">
          {naoEncontrada.titulo}
        </h1>
        <p className="text-16 text-fumaca">{naoEncontrada.texto}</p>
      </div>
      <BotaoLink href="/" variante="contorno">
        {naoEncontrada.voltar}
      </BotaoLink>
    </main>
  );
}
