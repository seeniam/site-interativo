import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import {
  formatarBRL,
  formatarDataPontuada,
  formatarDataPorExtenso,
  formatarDiaMes,
  formatarHora,
  formatarTelefone,
  mascararDigitacaoTelefone,
  normalizarNome,
  normalizarTelefone,
  ocultarTelefone,
  partesBRL,
  partesDataPorExtenso,
  primeiroNome,
  somenteDigitos,
  telefoneValido,
} from "./format";

// Intl usa espaço não separável entre "R$" e o número.
const nbsp = (s: string) => s.replace(/\s/gu, " ");

describe("formatarBRL", () => {
  it.each([
    [100, "R$ 100"],
    [150, "R$ 150"],
    [1250, "R$ 1.250"],
    [149.9, "R$ 149,90"],
    [0.5, "R$ 0,50"],
  ])("%d → %s", (valor, esperado) => {
    expect(formatarBRL(valor)).toBe(nbsp(esperado));
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])("recusa %d", (valor) => {
    expect(() => formatarBRL(valor)).toThrow(RangeError);
  });

  it("partesBRL separa símbolo e número", () => {
    expect(partesBRL(1250)).toEqual({ simbolo: "R$", numero: "1.250" });
    expect(partesBRL(149.9)).toEqual({ simbolo: "R$", numero: "149,90" });
  });
});

describe("telefone", () => {
  it("somenteDigitos", () => {
    expect(somenteDigitos("+55 (98) 99967-6346")).toBe("5598999676346");
  });

  it.each([
    ["+55 (98) 99967-6346", "98999676346"],
    ["(098) 99967-6346", "98999676346"],
    ["0 98 99967 6346", "98999676346"],
    ["55 11 3232-1234", "1132321234"],
    ["98999676346", "98999676346"],
  ])("normalizarTelefone(%s) → %s", (entrada, saida) => {
    expect(normalizarTelefone(entrada)).toBe(saida);
  });

  it.each(["98999676346", "(98) 99967-6346", "1132321234", "(11) 3232-1234", "+55 98 99967-6346", "(098) 99967-6346"])(
    "%s é válido",
    (tel) => {
      expect(telefoneValido(tel)).toBe(true);
    },
  );

  it.each([
    ["vazio", ""],
    ["curto", "9899967"],
    ["longo", "989996763466"],
    ["DDD terminado em 0", "10999990000"],
    ["DDD 20", "2032321234"],
    ["celular sem o 9", "98899676346"],
    ["fixo começando com 9", "9899967634"],
    ["fixo começando com 1", "9819967634"],
    ["fixo começando com 6", "9862321234"],
    ["fixo começando com 7", "9872321234"],
    ["fixo começando com 8", "9882321234"],
  ])("%s é inválido", (_rotulo, tel) => {
    expect(telefoneValido(tel)).toBe(false);
  });

  it("formatarTelefone: celular e fixo", () => {
    expect(formatarTelefone("98999676346")).toBe("(98) 99967-6346");
    expect(formatarTelefone("1132321234")).toBe("(11) 3232-1234");
    expect(formatarTelefone("+55 98 99967-6346")).toBe("(98) 99967-6346");
    expect(() => formatarTelefone("123")).toThrow(RangeError);
  });

  it.each([
    ["", ""],
    ["9", "(9"],
    ["98", "(98"],
    ["989", "(98) 9"],
    ["9899967", "(98) 99967"],
    ["98999676", "(98) 99967-6"],
    ["9899967634", "(98) 99967-634"],
    ["1132321234", "(11) 3232-1234"],
    ["113232", "(11) 3232"],
    ["98999676346", "(98) 99967-6346"],
    ["989996763469999", "(98) 99967-6346"],
    ["+55 98 99967-6346", "(98) 99967-6346"],
    ["(098) 99967-6346", "(98) 99967-6346"],
    ["abc", ""],
  ])("máscara de digitação: %s → %s", (entrada, saida) => {
    expect(mascararDigitacaoTelefone(entrada)).toBe(saida);
  });

  it("ocultarTelefone mostra só DDD, primeiro e dois últimos dígitos", () => {
    expect(ocultarTelefone("98999676394")).toBe("(98) 9****-**94");
    expect(ocultarTelefone("1132321234")).toBe("(11) 3***-**34");
    expect(() => ocultarTelefone("abc")).toThrow(RangeError);
    expect(() => ocultarTelefone("0000000000")).toThrow(RangeError);
  });
});

describe("datas no fuso de Brasília", () => {
  it("a data do casamento por extenso, como no herói", () => {
    expect(formatarDataPorExtenso(casamento.data)).toBe("21 de dezembro de 2026 · segunda-feira · 16h30");
  });

  it("confirma que 21/12/2026 é segunda-feira (motivo da dúvida C1)", () => {
    expect(partesDataPorExtenso(casamento.data).diaDaSemana).toBe("segunda-feira");
  });

  it("usa o fuso de Brasília mesmo com o instante em UTC", () => {
    // 01:30 UTC do dia 20 = 22:30 de 19/07 em Brasília.
    expect(partesDataPorExtenso("2027-07-20T01:30:00Z")).toEqual({
      data: "19 de julho de 2027",
      diaDaSemana: "segunda-feira",
      hora: "22h30",
    });
    expect(formatarDiaMes(new Date("2027-03-13T02:00:00Z"))).toBe("12/03");
  });

  it("hora cheia sem minutos, sem zero à esquerda", () => {
    expect(formatarHora("2026-12-21T16:00:00-03:00")).toBe("16h");
    expect(formatarHora("2026-12-21T09:05:00-03:00")).toBe("9h05");
  });

  it.each([
    ["2026-12-21T03:00:00Z", "0h", "21/12"],
    ["2026-12-21T02:59:00Z", "23h59", "20/12"],
    ["2026-12-21T15:00:00Z", "12h", "21/12"],
  ])("borda do dia: %s → %s em %s", (iso, hora, dia) => {
    expect(formatarHora(iso)).toBe(hora);
    expect(formatarDiaMes(iso)).toBe(dia);
  });

  // Instantes em que Nova York e Lisboa mudam o relógio: um Date "de parede" no fuso
  // da máquina erraria a hora aqui. Os testes rodam nesses fusos (vitest.config.mts).
  it.each([
    ["2027-03-14T02:30:00-03:00", "2h30"],
    ["2027-03-28T01:30:00-03:00", "1h30"],
    ["2026-11-01T01:30:00-03:00", "1h30"],
  ])("não sofre com horário de verão da máquina: %s → %s", (iso, hora) => {
    expect(formatarHora(iso)).toBe(hora);
  });

  it("data pontuada para 'Casados desde'", () => {
    expect(formatarDataPontuada(casamento.data)).toBe("21.12.2026");
  });

  it.each(["não é data", "2026-13-45"])("recusa data inválida: %s", (entrada) => {
    expect(() => formatarDataPorExtenso(entrada)).toThrow(RangeError);
    expect(() => formatarDiaMes(new Date(entrada))).toThrow(RangeError);
  });
});

describe("nomes", () => {
  it("normalizarNome troca o apóstrofo do iPhone e compõe acentos", () => {
    expect(normalizarNome("Joana d’Arc")).toBe("Joana d'Arc");
    expect(normalizarNome("José")).toBe("José");
  });

  it.each([
    ["Jaqueline Souza", "Jaqueline"],
    ["  ana maria  ", "Ana"],
    ["JOÃO DA SILVA", "João"],
    ["d'Ávila Santos", "D'Ávila"],
    ["d’ávila santos", "D'Ávila"],
    ["Ana-Clara Lima", "Ana-Clara"],
    ["ana-clara lima", "Ana-Clara"],
    ["Dr. João Silva", "João"],
    ["Dra Ana Lima", "Ana"],
    ["McKenzie Souza", "McKenzie"],
    ["José Silva", "José"],
    ["<script>alert(1)</script> Ana", "Scriptalertscript"],
    ["", ""],
    ["123 456", ""],
  ])("primeiroNome(%s) → %s", (entrada, saida) => {
    expect(primeiroNome(entrada)).toBe(saida);
  });

  it("nunca passa de 30 caracteres", () => {
    expect(primeiroNome("A".repeat(80)).length).toBe(30);
  });
});
