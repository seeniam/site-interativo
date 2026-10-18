import { Gift } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Monograma } from "@/components/brand/Monograma";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { AgendaCasamento } from "@/components/convite/AcoesLocal";
import { Confete } from "@/components/rsvp/Confete";
import { BotaoLink } from "@/components/ui/Botao";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { partesDataPorExtenso, primeiroNome } from "@/lib/format";
import { eventoDoCasamento } from "@/lib/ics";

const { agradecimento } = textos;

export const metadata: Metadata = { title: "Obrigado", robots: { index: false } };

/** O nome vem da URL: passa pelo mesmo filtro do formulário (só letras, curto) antes de aparecer. */
function nomeDaUrl(valor: string | string[] | undefined): string {
  return typeof valor === "string" ? primeiroNome(valor.slice(0, 60)) : "";
}

async function Mensagem({ searchParams }: { searchParams: PageProps<"/agradecimento">["searchParams"] }) {
  const parametros = await searchParams;
  const nome = nomeDaUrl(parametros.nome);
  const recusou = parametros.resposta === "nao";
  const evento = eventoDoCasamento(casamento, textos.agenda);

  return (
    <>
      {/* Quem não vem não ganha confete: o texto muda para algo caloroso (briefing 6.5). */}
      {!recusou && <Confete />}
      <h1 className="font-display text-49 font-light text-balance text-tinta sm:text-61">
        {recusou ? agradecimento.tituloNao(nome) : agradecimento.titulo(nome)}
      </h1>
      <FileteDourado />
      <p className="medida text-16 text-balance text-fumaca">
        {recusou ? agradecimento.textoNao : agradecimento.texto(partesDataPorExtenso(casamento.data).data)}
      </p>
      <div className="mt-4 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <BotaoLink href="/presentear" tamanho="grande" icone={<Gift aria-hidden size={18} strokeWidth={1.5} />}>
          {agradecimento.presentear}
        </BotaoLink>
        <BotaoLink href="/" variante="contorno" tamanho="grande">
          {agradecimento.voltar}
        </BotaoLink>
      </div>
      {/* "Adicionar à agenda" de novo: é o momento de maior intenção — para quem vem. */}
      {!recusou && (
        <div className="mt-6">
          <AgendaCasamento evento={{ ...evento, inicio: evento.inicio.toISOString(), fim: evento.fim.toISOString() }} />
        </div>
      )}
    </>
  );
}

export default function Agradecimento({ searchParams }: PageProps<"/agradecimento">) {
  return (
    <div className="conteiner respiro-secao">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <Monograma className="h-auto w-24" />
        <Suspense fallback={<div className="min-h-64" />}>
          <Mensagem searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}
