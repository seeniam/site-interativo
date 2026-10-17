import { describe, expect, it } from "vitest";
import { formatarBRL, formatarDiaMes, partesBRL } from "./format";

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
});

describe("partesBRL", () => {
  it("separa símbolo e número", () => {
    expect(partesBRL(1250)).toEqual({ simbolo: "R$", numero: "1.250" });
    expect(partesBRL(149.9)).toEqual({ simbolo: "R$", numero: "149,90" });
  });
});

describe("formatarDiaMes", () => {
  it("formata no fuso de Brasília", () => {
    // 02:00 UTC do dia 13 ainda é dia 12 em Brasília (UTC-3).
    expect(formatarDiaMes(new Date("2027-03-13T02:00:00Z"))).toBe("12/03");
  });

  it("recusa data inválida", () => {
    expect(() => formatarDiaMes(new Date("não é data"))).toThrow(RangeError);
  });
});
