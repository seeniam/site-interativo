import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import { ECOMERCIAL, MONOGRAMA_ALTURAS, MONOGRAMA_LETRAS } from "./monograma-glifos";

describe("monograma gerado", () => {
  it("usa as letras do config (rode scripts/extrair-glifos.ts se mudarem)", () => {
    expect(MONOGRAMA_LETRAS).toEqual(casamento.noivos.monograma);
  });

  it("o “&” é menor que as capitulares — entre 50% e 75% da altura do D (briefing 3.3)", () => {
    const proporcao = MONOGRAMA_ALTURAS.ecomercial / MONOGRAMA_ALTURAS.segunda;
    expect(proporcao).toBeGreaterThan(0.5);
    expect(proporcao).toBeLessThan(0.75);
  });

  it("o “&” isolado tem path e viewBox", () => {
    expect(ECOMERCIAL.d.length).toBeGreaterThan(100);
    expect(ECOMERCIAL.viewBox.split(" ")).toHaveLength(4);
  });
});
