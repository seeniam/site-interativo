"use client";

import { useState } from "react";
import { CardPresente } from "@/components/presentes/CardPresente";
import { textos } from "@/config/textos";
import { formatarBRL } from "@/lib/format";
import type { Presente } from "@/types/casamento";

const { presentear } = textos;

type Faixa = "todos" | "ate" | "acima";

interface ListaPresentesProps {
  presentes: readonly Omit<Presente, "foto">[];
  /** Ids de presentes nomeados que alguém já deu (lidos no servidor, de presentes_reservados). */
  reservados: readonly string[];
}

/** A linha que divide as faixas: o valor do meio das cotas (DECISOES P3). */
function limiteDasFaixas(presentes: readonly { valor: number }[]): number {
  const valores = presentes.map((p) => p.valor).sort((a, b) => a - b);
  return valores[Math.floor((valores.length - 1) / 2)] ?? 0;
}

/** Três planos de cotas + presentes nomeados, com o filtro por faixa (briefing 6.2). */
export function ListaPresentes({ presentes, reservados }: ListaPresentesProps) {
  const [faixa, setFaixa] = useState<Faixa>("todos");
  const limite = limiteDasFaixas(presentes);
  const naFaixa = (valor: number) => faixa === "todos" || (faixa === "ate" ? valor <= limite : valor > limite);

  const cotas = presentes.filter((p) => p.tipo === "cota" && naFaixa(p.valor));
  const nomeados = presentes.filter((p) => p.tipo === "nomeado" && naFaixa(p.valor));
  const chips: { id: Faixa; rotulo: string }[] = [
    { id: "todos", rotulo: presentear.filtros.todos },
    { id: "ate", rotulo: presentear.filtros.ate(formatarBRL(limite)) },
    { id: "acima", rotulo: presentear.filtros.acima(formatarBRL(limite)) },
  ];

  const card = (p: Omit<Presente, "foto">, nivel: "h2" | "h3") => (
    <CardPresente
      titulo={p.titulo}
      valor={p.valor}
      descricao={p.descricao}
      icone={p.icone}
      destaque={p.destaque}
      // Cotas nunca se esgotam (V2); só presentes nomeados podem estar "já presenteados".
      presenteado={p.tipo === "nomeado" && reservados.includes(p.id)}
      href={`/confirmar-presente/${p.id}`}
      nivelTitulo={nivel}
    />
  );

  return (
    <div className="flex flex-col gap-10">
      <div role="group" aria-label={presentear.filtros.rotulo} className="flex flex-wrap justify-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            aria-pressed={faixa === chip.id}
            onClick={() => setFaixa(chip.id)}
            className="chip"
          >
            {chip.rotulo}
          </button>
        ))}
      </div>

      <div aria-live="polite" className="flex flex-col gap-14">
        {cotas.length > 0 && (
          <ul className="planos-cotas" aria-label={presentear.cotas}>
            {cotas.map((p) => (
              <li key={p.id} data-destaque={p.destaque ? "" : undefined}>
                {card(p, "h2")}
              </li>
            ))}
          </ul>
        )}

        {nomeados.length > 0 && (
          <section aria-labelledby="presentes-nomeados">
            <h2 id="presentes-nomeados" className="mb-6 text-center font-display text-31 text-tinta">
              {presentear.nomeados}
            </h2>
            <ul className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {nomeados.map((p) => (
                <li key={p.id}>{card(p, "h3")}</li>
              ))}
            </ul>
          </section>
        )}

        {cotas.length === 0 && nomeados.length === 0 && (
          <p className="text-center text-16 text-fumaca">{presentear.nenhumNaFaixa}</p>
        )}
      </div>
    </div>
  );
}
