import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import { estadoContagem } from "./contagem";

const em = (iso: string) => new Date(iso);

describe("estadoContagem", () => {
  it("antes: decompõe o tempo que falta", () => {
    // De 19/12 17:26:56 até 21/12 16:30:00 (Brasília): 1 dia, 23h, 3min e 4s.
    expect(estadoContagem(em("2026-12-19T17:26:56-03:00"), casamento.data)).toEqual({
      tipo: "antes",
      dias: 1,
      horas: 23,
      minutos: 3,
      segundos: 4,
    });
  });

  it("antes: no dia anterior às 23h59 de Brasília ainda conta", () => {
    expect(estadoContagem(em("2026-12-20T23:59:59-03:00"), casamento.data)).toMatchObject({ tipo: "antes", dias: 0 });
  });

  it("hoje: o dia 21/12 inteiro, no calendário de Brasília (H4)", () => {
    for (const iso of ["2026-12-21T00:00:00-03:00", "2026-12-21T16:29:00-03:00", "2026-12-21T23:59:59-03:00"]) {
      expect(estadoContagem(em(iso), casamento.data), iso).toEqual({ tipo: "hoje" });
    }
  });

  it("hoje vale pelo calendário de Brasília, mesmo com o instante já em 22/12 UTC", () => {
    expect(estadoContagem(em("2026-12-22T02:30:00Z"), casamento.data)).toEqual({ tipo: "hoje" });
  });

  it("depois: a partir de 22/12 em Brasília", () => {
    expect(estadoContagem(em("2026-12-22T00:00:00-03:00"), casamento.data)).toEqual({ tipo: "depois" });
    expect(estadoContagem(em("2030-01-01T12:00:00-03:00"), casamento.data)).toEqual({ tipo: "depois" });
  });

  it("recusa data inválida", () => {
    expect(() => estadoContagem(em("x"), casamento.data)).toThrow(RangeError);
    expect(() => estadoContagem(new Date(), "x")).toThrow(RangeError);
  });
});
