/**
 * "Adicionar à agenda": arquivo .ics (RFC 5545) e link do Google Agenda, gerados no cliente.
 * Funções puras — o "agora" do DTSTAMP entra por parâmetro.
 */
import { ouSenao } from "@/lib/pendente";
import type { ConfiguracaoCasamento } from "@/types/casamento";

/**
 * Plano B enquanto o horário de término está "a definir" (PENDENCIAS P9): o .ics precisa de
 * um fim. Quando o casal informar, `casamento.agenda.duracaoHoras` passa a valer.
 */
export const DURACAO_PLANO_B_HORAS = 6;

export interface EventoAgenda {
  /** Identificador estável: reimportar o arquivo atualiza o evento em vez de duplicar. */
  uid: string;
  titulo: string;
  inicio: Date;
  fim: Date;
  local: string;
  descricao: string;
  url?: string;
}

const LIMITE_OCTETOS = 75;

/** "20261221T193000Z" — sempre em UTC, para não depender do fuso de quem importa. */
export function formatarDataIcs(data: Date): string {
  if (Number.isNaN(data.getTime())) throw new RangeError("Data inválida para a agenda");
  return data
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** Escapa texto conforme a RFC 5545 (barra, ponto e vírgula, vírgula e quebra de linha). */
export function escaparTextoIcs(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/**
 * Dobra a linha em pedaços de até 75 octetos (UTF-8), continuando com CRLF + espaço.
 * Nunca parte um caractere acentuado ao meio.
 */
export function dobrarLinhaIcs(linha: string): string {
  const codificador = new TextEncoder();
  const partes: string[] = [];
  let atual = "";
  let octetos = 0;
  for (const caractere of linha) {
    const tamanho = codificador.encode(caractere).length;
    // A partir da segunda parte, o espaço de continuação ocupa 1 octeto.
    const limite = partes.length === 0 ? LIMITE_OCTETOS : LIMITE_OCTETOS - 1;
    if (octetos + tamanho > limite) {
      partes.push(atual);
      atual = "";
      octetos = 0;
    }
    atual += caractere;
    octetos += tamanho;
  }
  partes.push(atual);
  return partes.join("\r\n ");
}

export function gerarIcs(evento: EventoAgenda, agora: Date): string {
  if (evento.fim.getTime() <= evento.inicio.getTime()) {
    throw new RangeError("O fim do evento precisa ser depois do início");
  }
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Convite Jaqueline e Diorlando//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${evento.uid}`,
    `DTSTAMP:${formatarDataIcs(agora)}`,
    `DTSTART:${formatarDataIcs(evento.inicio)}`,
    `DTEND:${formatarDataIcs(evento.fim)}`,
    `SUMMARY:${escaparTextoIcs(evento.titulo)}`,
    `LOCATION:${escaparTextoIcs(evento.local)}`,
    `DESCRIPTION:${escaparTextoIcs(evento.descricao)}`,
    ...(evento.url ? [`URL:${evento.url}`] : []),
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escaparTextoIcs(evento.titulo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return linhas.map(dobrarLinhaIcs).join("\r\n") + "\r\n";
}

export function linkGoogleAgenda(evento: EventoAgenda): string {
  const parametros = new URLSearchParams({
    action: "TEMPLATE",
    text: evento.titulo,
    dates: `${formatarDataIcs(evento.inicio)}/${formatarDataIcs(evento.fim)}`,
    details: evento.url ? `${evento.descricao}\n\n${evento.url}` : evento.descricao,
    location: evento.local,
    ctz: "America/Sao_Paulo",
  });
  return `https://calendar.google.com/calendar/render?${parametros.toString()}`;
}

/** O evento do casamento a partir do config. Os textos vêm de quem chama (textos.ts). */
export function eventoDoCasamento(
  config: Pick<ConfiguracaoCasamento, "data" | "agenda" | "local" | "noivos">,
  textosEvento: { titulo: (casal: string) => string; descricao: (casal: string) => string },
  url?: string,
): EventoAgenda {
  const inicio = new Date(config.data);
  if (Number.isNaN(inicio.getTime())) throw new RangeError(`Data do casamento inválida: ${config.data}`);
  const horas = ouSenao(config.agenda.duracaoHoras, DURACAO_PLANO_B_HORAS);
  const fim = new Date(inicio.getTime() + horas * 60 * 60 * 1000);
  const { titulo } = config.noivos;
  return {
    uid: `casamento-${config.data.slice(0, 10)}-${config.noivos.monograma.esquerda}${config.noivos.monograma.direita}@convite`.toLowerCase(),
    titulo: textosEvento.titulo(titulo),
    inicio,
    fim,
    local: `${config.local.nome}, ${config.local.endereco}`,
    descricao: textosEvento.descricao(titulo),
    url,
  };
}
