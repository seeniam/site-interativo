"use client";

import { useSyncExternalStore } from "react";
import { textos } from "@/config/textos";
import { estadoContagem, type EstadoContagem } from "@/lib/contagem";

const { contagem } = textos.convite;

/** Relógio de 1s compartilhado; o servidor não sabe a hora de quem abre (DECISOES H4). */
let agoraAtual = 0;
function assinar(avisar: () => void): () => void {
  agoraAtual = Date.now();
  const relogio = setInterval(() => {
    agoraAtual = Date.now();
    avisar();
  }, 1000);
  return () => clearInterval(relogio);
}
// Estável entre leituras antes da primeira assinatura (o React compara snapshots).
const lerAgora = () => (agoraAtual ||= Date.now());
const lerAgoraNoServidor = () => null;

interface ContagemProps {
  /** ISO da cerimônia. */
  data: string;
  /** "16h30" — para "A gente se encontra às 16h30" no próprio dia. */
  horaTexto: string;
  /** "21.12.2026" — para "Casados desde". */
  dataPontuada: string;
}

/** Contagem regressiva com os três estados (briefing 6.1, item 3). */
export function ContagemRegressiva({ data, horaTexto, dataPontuada }: ContagemProps) {
  const agora = useSyncExternalStore(assinar, lerAgora, lerAgoraNoServidor);
  // Antes de hidratar: os blocos com traço, no mesmo tamanho — sem salto de layout.
  const estado: EstadoContagem | null = agora === null ? null : estadoContagem(new Date(agora), data);

  if (estado?.tipo === "hoje") {
    return (
      <div className="contagem-caixa contagem-estado">
        <p className="font-display text-49 font-light text-tinta sm:text-61">{contagem.hoje}</p>
        <p className="text-16 text-fumaca">{contagem.hojeDetalhe(horaTexto)}</p>
      </div>
    );
  }

  if (estado?.tipo === "depois") {
    return (
      <div className="contagem-caixa contagem-estado">
        <p className="font-display text-39 font-light text-tinta sm:text-49">{contagem.casadosDesde(dataPontuada)}</p>
      </div>
    );
  }

  const blocos = [
    { rotulo: contagem.unidades.dias, valor: estado?.dias },
    { rotulo: contagem.unidades.horas, valor: estado?.horas },
    { rotulo: contagem.unidades.minutos, valor: estado?.minutos },
    { rotulo: contagem.unidades.segundos, valor: estado?.segundos },
  ];

  return (
    <div className="contagem-caixa">
      {estado && <p className="sr-only">{contagem.leitorDeTela(estado.dias)}</p>}
      <ol aria-hidden className="contagem">
        {blocos.map(({ rotulo, valor }) => (
          <li key={rotulo} className="contagem__bloco">
            <span className="contagem__numero numeros">
              {valor === undefined ? (
                <span className="contagem__digito">–</span>
              ) : (
                String(valor)
                  .padStart(2, "0")
                  .split("")
                  .map((digito, i, todos) => (
                    // A key muda só quando o dígito muda: só ele "vira" (briefing 3.5.2).
                    <span key={`${todos.length - i}-${digito}`} className="contagem__digito contagem__digito--vira">
                      {digito}
                    </span>
                  ))
              )}
            </span>
            <span className="versalete">{rotulo}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
