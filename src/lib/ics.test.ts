import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import {
  dobrarLinhaIcs,
  escaparTextoIcs,
  eventoDoCasamento,
  formatarDataIcs,
  gerarIcs,
  linkGoogleAgenda,
  type EventoAgenda,
} from "./ics";

const AGORA = new Date("2026-10-17T12:00:00Z");
const evento = eventoDoCasamento(casamento, textos.agenda, "https://exemplo.com.br");

const octetos = (s: string) => new TextEncoder().encode(s).length;

describe("formatarDataIcs", () => {
  it("converte para UTC no formato básico", () => {
    // 16h30 em Brasília (UTC-3) = 19h30 UTC.
    expect(formatarDataIcs(new Date("2026-12-21T16:30:00-03:00"))).toBe("20261221T193000Z");
  });

  it("recusa data inválida", () => {
    expect(() => formatarDataIcs(new Date("x"))).toThrow(RangeError);
  });
});

describe("escaparTextoIcs", () => {
  it("escapa barra, ponto e vírgula, vírgula e quebra de linha", () => {
    expect(escaparTextoIcs("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("dobrarLinhaIcs", () => {
  it("não mexe em linha curta", () => {
    expect(dobrarLinhaIcs("SUMMARY:curto")).toBe("SUMMARY:curto");
  });

  it("dobra em até 75 octetos, continuando com CRLF + espaço", () => {
    const linha = `DESCRIPTION:${"x".repeat(200)}`;
    const partes = dobrarLinhaIcs(linha).split("\r\n");
    expect(partes.length).toBeGreaterThan(2);
    for (const parte of partes) expect(octetos(parte)).toBeLessThanOrEqual(75);
    expect(partes.slice(1).every((p) => p.startsWith(" "))).toBe(true);
    expect(partes.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(linha);
  });

  it("nunca parte um caractere acentuado (2 octetos em UTF-8) ao meio", () => {
    const linha = `LOCATION:${"ã".repeat(100)}`;
    const partes = dobrarLinhaIcs(linha).split("\r\n");
    for (const parte of partes) {
      expect(octetos(parte)).toBeLessThanOrEqual(75);
      expect(parte).not.toContain("�");
    }
    expect(partes.map((p, i) => (i === 0 ? p : p.slice(1))).join("")).toBe(linha);
  });
});

describe("gerarIcs", () => {
  const ics = gerarIcs(evento, AGORA);
  const linhasDesdobradas = ics.replace(/\r\n /g, "").split("\r\n");

  it("usa CRLF em todas as linhas e termina com CRLF", () => {
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
  });

  it("tem a estrutura VCALENDAR/VEVENT/VALARM", () => {
    expect(linhasDesdobradas[0]).toBe("BEGIN:VCALENDAR");
    expect(linhasDesdobradas).toContain("BEGIN:VEVENT");
    expect(linhasDesdobradas).toContain("END:VEVENT");
    expect(linhasDesdobradas).toContain("BEGIN:VALARM");
    expect(linhasDesdobradas.at(-2)).toBe("END:VCALENDAR");
  });

  it("começa às 16h30 de Brasília e dura o que o config diz", () => {
    expect(linhasDesdobradas).toContain("DTSTART:20261221T193000Z");
    expect(linhasDesdobradas).toContain("DTEND:20261222T013000Z");
    expect(linhasDesdobradas).toContain("DTSTAMP:20261017T120000Z");
  });

  it("título com o casal na ordem certa e local com o endereço escapado", () => {
    expect(linhasDesdobradas).toContain("SUMMARY:Casamento de Jaqueline & Diorlando");
    const local = linhasDesdobradas.find((l) => l.startsWith("LOCATION:")) ?? "";
    expect(local).toContain("Espaço Max\\, Av. Dois\\, 13");
  });

  it("nenhuma linha física passa de 75 octetos", () => {
    for (const linha of ics.split("\r\n")) expect(octetos(linha)).toBeLessThanOrEqual(75);
  });

  it("UID estável entre gerações (reimportar atualiza, não duplica)", () => {
    expect(gerarIcs(evento, new Date()).match(/UID:(.+)/)?.[1]).toBe(ics.match(/UID:(.+)/)?.[1]);
  });

  it("recusa evento que termina antes de começar", () => {
    const invertido: EventoAgenda = { ...evento, fim: evento.inicio };
    expect(() => gerarIcs(invertido, AGORA)).toThrow(RangeError);
  });
});

describe("linkGoogleAgenda", () => {
  const url = new URL(linkGoogleAgenda(evento));

  it("aponta para o Google Agenda com o modelo de evento", () => {
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("leva título, datas em UTC, local e fuso", () => {
    expect(url.searchParams.get("text")).toBe("Casamento de Jaqueline & Diorlando");
    expect(url.searchParams.get("dates")).toBe("20261221T193000Z/20261222T013000Z");
    expect(url.searchParams.get("location")).toContain("Espaço Max");
    expect(url.searchParams.get("ctz")).toBe("America/Sao_Paulo");
    expect(url.searchParams.get("details")).toContain("https://exemplo.com.br");
  });
});

describe("eventoDoCasamento", () => {
  it("recusa data inválida no config", () => {
    expect(() => eventoDoCasamento({ ...casamento, data: "x" }, textos.agenda)).toThrow(RangeError);
  });
});

describe("lembrete e duração", () => {
  const linhas = gerarIcs(evento, AGORA).replace(/\r\n /g, "").split("\r\n");

  it("lembra um dia antes, com aviso na tela", () => {
    const inicio = linhas.indexOf("BEGIN:VALARM");
    const alarme = linhas.slice(inicio, linhas.indexOf("END:VALARM") + 1);
    expect(alarme).toContain("TRIGGER:-P1D");
    expect(alarme).toContain("ACTION:DISPLAY");
    expect(alarme.some((l) => l.startsWith("DESCRIPTION:Casamento de Jaqueline & Diorlando"))).toBe(true);
  });

  it("a duração vem do config (padrão técnico, DECISOES V7)", () => {
    expect(evento.fim.getTime() - evento.inicio.getTime()).toBe(casamento.agenda.duracaoHoras * 3_600_000);
    const informado = eventoDoCasamento({ ...casamento, agenda: { duracaoHoras: 4 } }, textos.agenda);
    expect(informado.fim.getTime() - informado.inicio.getTime()).toBe(4 * 3_600_000);
  });
});
