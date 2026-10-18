import { describe, expect, it } from "vitest";
import type { RespostaConvidado } from "./convidados";
import { COLUNAS_CSV, celulaCsv, gerarCsvConvidados, nomeArquivoCsv } from "./csv";

const resposta = (extra: Partial<RespostaConvidado>): RespostaConvidado => ({
  id: "1",
  nome: "Ana Exemplo",
  telefone: "98900000001",
  status: "confirmado",
  convidadoPor: "Jaqueline",
  recado: "",
  respondidoEm: "2026-10-18T18:05:00.000Z",
  atualizada: false,
  ...extra,
});

describe("celulaCsv", () => {
  it("texto simples passa como está; número vira texto", () => {
    expect(celulaCsv("Ana")).toBe("Ana");
    expect(celulaCsv(2)).toBe("2");
  });

  it("separador, aspas e quebra de linha vão entre aspas, com aspas dobradas", () => {
    expect(celulaCsv("a;b")).toBe('"a;b"');
    expect(celulaCsv('diz "oi"')).toBe('"diz ""oi"""');
    expect(celulaCsv("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
  });

  it("injeção de fórmula: =, +, - e @ no começo ganham apóstrofo", () => {
    expect(celulaCsv('=HYPERLINK("http://x")')).toBe('"\'=HYPERLINK(""http://x"")"');
    expect(celulaCsv("+55 98")).toBe("'+55 98");
    expect(celulaCsv("-1")).toBe("'-1");
    expect(celulaCsv("@SOMA(A1)")).toBe("'@SOMA(A1)");
  });
});

describe("gerarCsvConvidados", () => {
  it("UTF-8 com BOM, ponto e vírgula, CRLF e cabeçalho em português", () => {
    const csv = gerarCsvConvidados([resposta({})]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const [cabecalho, linha] = csv.slice(1).split("\r\n");
    expect(cabecalho).toBe(COLUNAS_CSV.join(";"));
    expect(linha).toBe("Ana Exemplo;Confirmado;Jaqueline;(98) 90000-0001;;18/10/2026 15:05");
  });

  it("acentos sobrevivem e quem não vai sai como “Não vai”", () => {
    const csv = gerarCsvConvidados([
      resposta({ nome: "Júlia D'Ávila", status: "recusou", convidadoPor: "", recado: "Saúde!" }),
    ]);
    expect(csv).toContain("Júlia D'Ávila;Não vai;;(98) 90000-0001;Saúde!;18/10/2026 15:05");
  });

  it("lista vazia: só o cabeçalho", () => {
    expect(gerarCsvConvidados([]).trim().split("\r\n")).toHaveLength(1);
  });
});

describe("nomeArquivoCsv", () => {
  it("usa a data de Brasília (23h de Brasília ainda é o mesmo dia)", () => {
    expect(nomeArquivoCsv(new Date("2026-10-19T02:30:00Z"))).toBe("convidados-2026-10-18.csv");
  });
});
