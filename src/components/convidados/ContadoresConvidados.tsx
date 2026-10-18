import type { CSSProperties } from "react";
import { textos } from "@/config/textos";
import type { Contadores } from "@/lib/convidados";

const { contadores: rotulos } = textos.convidados;

/**
 * Três contadores com filete dourado (briefing 6.6). O número sobe de 0 até o valor uma única
 * vez, quando o painel aparece — só CSS (`@property` + `counter()`), sem JS. O número real está
 * no texto para leitores de tela; o animado é decorativo.
 */
function Contador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="contador">
      <dt className="text-14 font-normal text-tinta">{rotulo}</dt>
      <dd>
        <span aria-hidden className="contador__numero" style={{ "--valor": valor } as CSSProperties} />
        <span className="sr-only" data-contador="">
          {valor}
        </span>
      </dd>
    </div>
  );
}

export function ContadoresConvidados({ contadores }: { contadores: Contadores }) {
  return (
    <dl className="contadores">
      <Contador rotulo={rotulos.confirmados} valor={contadores.confirmados} />
      <Contador rotulo={rotulos.naoVao} valor={contadores.naoVao} />
      <Contador rotulo={rotulos.respostas} valor={contadores.respostas} />
    </dl>
  );
}
