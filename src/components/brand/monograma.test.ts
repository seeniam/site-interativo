import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import {
  ASSINATURA_EM_TRACOS,
  ECOMERCIAL,
  MONOGRAMA_ALTURAS,
  MONOGRAMA_LETRAS,
  NOMES_EM_TRACOS,
} from "./monograma-glifos";

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

describe("nomes do herói em contornos", () => {
  it("foram gerados com os nomes do config (rode scripts/extrair-glifos.ts se mudarem)", () => {
    expect(NOMES_EM_TRACOS.ela.texto).toBe(casamento.noivos.ela);
    expect(NOMES_EM_TRACOS.ele.texto).toBe(casamento.noivos.ele);
  });

  it("dividem a mesma linha de base (mesma altura de caixa)", () => {
    expect(NOMES_EM_TRACOS.ela.alturaEm).toBe(NOMES_EM_TRACOS.ele.alturaEm);
    expect(NOMES_EM_TRACOS.ela.d.length).toBeGreaterThan(200);
  });
});

describe("assinatura do rodapé em contornos", () => {
  it("reproduz exatamente o texto de textos.rodape.assinatura (rode scripts/extrair-glifos.ts se mudar)", () => {
    const { abertura, casal } = ASSINATURA_EM_TRACOS;
    expect(`${abertura.texto} ${casal.texto}`).toBe(textos.rodape.assinatura(casamento.noivos.titulo));
  });
});
