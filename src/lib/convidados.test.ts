import { describe, expect, it } from "vitest";
import type { Confirmacao } from "@/types/dominio";
import {
  agruparPorQuemConvidou,
  contarRespostas,
  filtrarRespostas,
  normalizarBusca,
  ordenarRespostas,
  paginar,
  respostasValendo,
  type RespostaConvidado,
} from "./convidados";

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

const r = (extra: Partial<RespostaConvidado>): RespostaConvidado => ({
  id: "1",
  nome: "Ana",
  telefone: "98900000001",
  status: "confirmado",
  acompanhantes: [],
  convidadoPor: "Jaqueline",
  recado: "",
  respondidoEm: "2026-10-01T12:00:00.000Z",
  atualizada: false,
  ...extra,
});

const LISTA = [
  r({ id: "1", nome: "Júlia Ávila", acompanhantes: ["Marcos"], convidadoPor: "Jaqueline" }),
  r({ id: "2", nome: "bruno lima", convidadoPor: "Diorlando", respondidoEm: "2026-10-03T12:00:00.000Z" }),
  r({ id: "3", nome: "Carla", status: "recusou", convidadoPor: "", respondidoEm: "2026-10-02T12:00:00.000Z" }),
  r({ id: "4", nome: "Davi", acompanhantes: ["Eva", "Fábio"], convidadoPor: "Diorlando" }),
];

describe("tela dos noivos", () => {
  it("busca ignora acento, caixa e espaços; acha também pelo nome do acompanhante", () => {
    expect(normalizarBusca("  Júlia   ÁVILA ")).toBe("julia avila");
    const busca = (termo: string) => filtrarRespostas(LISTA, { busca: termo, status: "todos" }).map((x) => x.id);
    expect(busca("julia avila")).toEqual(["1"]);
    expect(busca("BRUNO")).toEqual(["2"]);
    expect(busca("fabio")).toEqual(["4"]);
    expect(busca("")).toEqual(["1", "2", "3", "4"]);
  });

  it("filtro de status", () => {
    const ids = (status: "todos" | "confirmado" | "recusou") =>
      filtrarRespostas(LISTA, { busca: "", status }).map((x) => x.id);
    expect(ids("recusou")).toEqual(["3"]);
    expect(ids("confirmado")).toEqual(["1", "2", "4"]);
  });

  it("contadores: confirmados somam acompanhantes; não vão; respostas no total", () => {
    expect(contarRespostas(LISTA)).toEqual({ pessoasConfirmadas: 6, naoVao: 1, respostas: 4 });
    expect(contarRespostas([])).toEqual({ pessoasConfirmadas: 0, naoVao: 0, respostas: 0 });
  });

  it("agrupamento com subtotal; “não informado” por último", () => {
    const grupos = agruparPorQuemConvidou(LISTA);
    expect(grupos.map((g) => [g.convidadoPor, g.respostas.length, g.contadores.pessoasConfirmadas])).toEqual([
      ["Diorlando", 2, 4],
      ["Jaqueline", 1, 2],
      ["", 1, 0],
    ]);
  });

  it("ordenação por nome (sem diferenciar caixa e acento) e por data, nos dois sentidos", () => {
    expect(ordenarRespostas(LISTA, "nome", "asc").map((x) => x.nome)).toEqual([
      "bruno lima",
      "Carla",
      "Davi",
      "Júlia Ávila",
    ]);
    expect(ordenarRespostas(LISTA, "data", "desc").map((x) => x.id)[0]).toBe("2");
    expect(
      ordenarRespostas(LISTA, "data", "asc")
        .map((x) => x.id)
        .at(-1),
    ).toBe("2");
  });

  it("paginação de 25, com página fora do intervalo ajustada", () => {
    const muitos = Array.from({ length: 60 }, (_, i) => i);
    expect(paginar(muitos, 1)).toMatchObject({ atual: 1, paginas: 3 });
    expect(paginar(muitos, 3).itens).toEqual([50, 51, 52, 53, 54, 55, 56, 57, 58, 59]);
    expect(paginar(muitos, 9).atual).toBe(3);
    expect(paginar([], 1)).toEqual({ itens: [], atual: 1, paginas: 1 });
  });
});
