/**
 * Estado da contagem regressiva (briefing 6.1, item 3; DECISOES H4).
 * O "dia" é sempre o calendário de Brasília, independente do fuso de quem abre.
 */
import { formatarDataPontuada } from "@/lib/format";

export type EstadoContagem =
  | { tipo: "antes"; dias: number; horas: number; minutos: number; segundos: number }
  | { tipo: "hoje" }
  | { tipo: "depois" };

export function estadoContagem(agora: Date, data: Date | string): EstadoContagem {
  const inicio = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(agora.getTime())) throw new RangeError("Data inválida");

  if (formatarDataPontuada(agora) === formatarDataPontuada(inicio)) return { tipo: "hoje" };
  if (agora.getTime() > inicio.getTime()) return { tipo: "depois" };

  const totalSegundos = Math.floor((inicio.getTime() - agora.getTime()) / 1000);
  return {
    tipo: "antes",
    dias: Math.floor(totalSegundos / 86_400),
    horas: Math.floor((totalSegundos % 86_400) / 3_600),
    minutos: Math.floor((totalSegundos % 3_600) / 60),
    segundos: totalSegundos % 60,
  };
}
