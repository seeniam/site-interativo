import { describe, expect, it } from "vitest";
import { estaPendente, listarPendencias, ouSenao, pendente, type Talvez } from "./pendente";

describe("pendente", () => {
  it("marca o valor como pendente e guarda a descrição", () => {
    expect(pendente("Data da cerimônia")).toEqual({ pendente: true, descricao: "Data da cerimônia" });
  });

  it("reconhece um valor pendente", () => {
    const valor: Talvez<string> = pendente("Versículo");
    expect(estaPendente(valor)).toBe(true);
  });

  it.each<[string, Talvez<unknown>]>([
    ["string", "Jaqueline"],
    ["string vazia", ""],
    ["número", 0],
    ["null", null],
    ["objeto comum", { nome: "Recepção" }],
    ["objeto com pendente=false", { pendente: false, descricao: "x" }],
    ["objeto com pendente='true'", { pendente: "true", descricao: "x" }],
  ])("não confunde %s com pendente", (_rotulo, valor) => {
    expect(estaPendente(valor)).toBe(false);
  });

  it("ouSenao devolve o valor real ou o substituto", () => {
    expect(ouSenao<string, null>("16:30", null)).toBe("16:30");
    expect(ouSenao<string, null>(pendente("Horário"), null)).toBeNull();
  });
});

describe("listarPendencias", () => {
  it("encontra pendências em qualquer profundidade, na ordem", () => {
    const config = {
      nome: "Jaqueline",
      data: pendente("Data"),
      lista: [{ a: pendente("A") }, "ok", [pendente("B")]],
      vazio: null,
    };
    expect(listarPendencias(config).map((p) => p.descricao)).toEqual(["Data", "A", "B"]);
  });

  it("devolve lista vazia quando nada está pendente", () => {
    expect(listarPendencias({ a: 1, b: ["x"], c: { d: true } })).toEqual([]);
  });
});
