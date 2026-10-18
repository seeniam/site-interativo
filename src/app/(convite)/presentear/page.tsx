import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { ListaPresentes } from "@/components/presentes/ListaPresentes";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { obterRepositorio } from "@/lib/db";
import { linkWhatsApp } from "@/lib/whatsapp";

const { presentear } = textos;

export const metadata: Metadata = { title: presentear.titulo };

const presentes = casamento.presentes.map(({ id, tipo, titulo, valor, descricao, icone, ...resto }) => ({
  id,
  tipo,
  titulo,
  valor,
  descricao,
  icone,
  destaque: "destaque" in resto ? resto.destaque : false,
}));

/** O estado "já presenteado" vem do banco, a cada visita (briefing 6.2). */
async function ListaComReservas() {
  await connection();
  const reservados = await obterRepositorio().listarReservados();
  return <ListaPresentes presentes={presentes} reservados={reservados} />;
}

export default function Presentear() {
  return (
    <div className="conteiner respiro-secao">
      <header className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-5 text-center sm:mb-16">
        <h1 className="font-display text-49 font-light text-tinta sm:text-61">{presentear.titulo}</h1>
        <FileteDourado />
      </header>

      {/* Enquanto o banco responde, as cotas já aparecem (cotas nunca ficam indisponíveis). */}
      <Suspense fallback={<ListaPresentes presentes={presentes} reservados={[]} />}>
        <ListaComReservas />
      </Suspense>

      <p className="mt-14 text-center text-14 text-fumaca">
        {presentear.outroValor}{" "}
        <a
          href={linkWhatsApp(casamento.whatsapp.numero, presentear.mensagemOutroValor)}
          target="_blank"
          rel="noopener noreferrer"
          className="botao botao--texto inline-flex text-14"
        >
          {presentear.outroValorLink}
          <span className="sr-only"> {textos.convite.local.abreEmNovaAba}</span>
        </a>
      </p>
    </div>
  );
}
