import { describe, expect, it } from "vitest";
import type { Confirmacao } from "@/types/dominio";
import { respostasValendo } from "./convidados";

const base = (extra: Partial<Confirmacao>): Confirmacao => ({
  id: "1",
  nome: "Ana Exemplo",
  telefone: "98900000001",
  telefoneHash: "a".repeat(64),
  status: "confirmado",
  acompanhantes: [],
  convidadoPor: "Jaqueline",
  recado: "",
  atualizaDe: null,
  criadoEm: new Date("2026-10-01T12:00:00Z"),
  ...extra,
});

describe("respostasValendo", () => {
  it("de cada telefone vale a resposta mais recente, marcada como atualizada", () => {
    const lista = respostasValendo([
      base({ id: "1" }),
      base({ id: "2", status: "recusou", criadoEm: new Date("2026-10-02T12:00:00Z"), atualizaDe: "a".repeat(64) }),
      base({ id: "3", nome: "Bruno", telefoneHash: "b".repeat(64), criadoEm: new Date("2026-09-30T12:00:00Z") }),
    ]);
    expect(lista.map((r) => [r.id, r.status, r.atualizada])).toEqual([
      ["2", "recusou", true],
      ["3", "confirmado", false],
    ]);
    expect(lista[0]?.respondidoEm).toBe("2026-10-02T12:00:00.000Z");
  });

  it("mesmo instante: desempata pelo id maior (gravado depois)", () => {
    const mesma = new Date("2026-10-01T12:00:00Z");
    const [r] = respostasValendo([base({ id: "9", criadoEm: mesma }), base({ id: "10", criadoEm: mesma })]);
    expect(r?.id).toBe("10");
  });
});
