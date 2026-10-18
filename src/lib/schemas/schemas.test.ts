import { describe, expect, it } from "vitest";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { esquemaConfig } from "./config";
import { esquemaLinhaConfirmacao, esquemaRegistro } from "./dominio";
import { criarEsquemaRsvp, paraNovaConfirmacao, pareceRobo, type EntradaRsvp } from "./rsvp";

const esquema = criarEsquemaRsvp(casamento.rsvp.maxAcompanhantes);
const erros = textos.rsvp.erros;

const VALIDO: EntradaRsvp = {
  nome: "  Maria   da Conceição ",
  telefone: "(98) 99967-6346",
  status: "confirmado",
  acompanhantes: [{ nome: "João Pedro" }],
  convidadoPor: "Jaqueline",
  recado: "Felicidades!",
  site: "",
};

/** Mensagens de erro de um campo, para conferir o texto humano. */
function errosDe(entrada: EntradaRsvp, campo: string): string[] {
  const resultado = esquema.safeParse(entrada);
  if (resultado.success) return [];
  return resultado.error.issues.filter((i) => i.path.join(".") === campo).map((i) => i.message);
}

describe("formulário de RSVP", () => {
  it("aceita uma resposta completa e normaliza nome e telefone", () => {
    const dados = esquema.parse(VALIDO);
    expect(dados.nome).toBe("Maria da Conceição");
    expect(dados.telefone).toBe("98999676346");
  });

  it("aceita quem não vai sem 'quem convidou'", () => {
    expect(esquema.safeParse({ ...VALIDO, status: "recusou", convidadoPor: "", acompanhantes: [] }).success).toBe(true);
  });

  describe("nome", () => {
    it.each<[string, string, string]>([
      ["vazio", "   ", erros.nomeObrigatorio],
      ["com duas letras", "Al", erros.nomeCurto],
      ["com números", "Maria 2", erros.nomeCaracteres],
      ["com emoji", "Maria ✨", erros.nomeCaracteres],
      ["longo demais", "A".repeat(121), erros.nomeLongo],
    ])("recusa nome %s", (_rotulo, valor, mensagem) => {
      expect(errosDe({ ...VALIDO, nome: valor }, "nome")).toContain(mensagem);
    });

    it.each(["Zé Ló", "Ana-Clara", "Joana d'Arc", "Dr. João"])("aceita %s", (valor) => {
      expect(errosDe({ ...VALIDO, nome: valor }, "nome")).toEqual([]);
    });
  });

  describe("telefone", () => {
    it("vazio pede o telefone com a frase do briefing", () => {
      expect(errosDe({ ...VALIDO, telefone: "" }, "telefone")).toEqual([
        "Faltou o telefone pra gente te avisar de mudanças.",
      ]);
    });

    it.each(["123", "(98) 8996-76346", "00999676346"])("recusa %s", (valor) => {
      expect(errosDe({ ...VALIDO, telefone: valor }, "telefone")).toContain(erros.telefoneInvalido);
    });
  });

  it("exige escolher se vem", () => {
    const resultado = esquema.safeParse({ ...VALIDO, status: undefined });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe(erros.statusObrigatorio);
  });

  it("limita os acompanhantes ao máximo do config", () => {
    const muitos = Array.from({ length: casamento.rsvp.maxAcompanhantes + 1 }, (_, i) => ({
      nome: `Pessoa ${"a".repeat(i + 1)}`,
    }));
    expect(errosDe({ ...VALIDO, acompanhantes: muitos }, "acompanhantes")).toContain(
      erros.acompanhantesDemais(casamento.rsvp.maxAcompanhantes),
    );
  });

  it("recusa acompanhante sem nome", () => {
    expect(errosDe({ ...VALIDO, acompanhantes: [{ nome: " " }] }, "acompanhantes.0.nome")).toContain(
      erros.acompanhanteNome,
    );
  });

  it("quem vai precisa dizer quem convidou", () => {
    expect(errosDe({ ...VALIDO, convidadoPor: " " }, "convidadoPor")).toContain(erros.convidadoPorObrigatorio);
  });

  it("recado até 240 caracteres", () => {
    expect(errosDe({ ...VALIDO, recado: "a".repeat(240) }, "recado")).toEqual([]);
    expect(errosDe({ ...VALIDO, recado: "a".repeat(241) }, "recado")).toContain(erros.recadoLongo(240));
  });

  it("honeypot preenchido denuncia robô", () => {
    expect(pareceRobo(esquema.parse(VALIDO))).toBe(false);
    expect(pareceRobo(esquema.parse({ ...VALIDO, site: "http://spam" }))).toBe(true);
  });

  it("paraNovaConfirmacao descarta acompanhantes e 'quem convidou' de quem não vai", () => {
    const naoVai = esquema.parse({ ...VALIDO, status: "recusou" });
    expect(paraNovaConfirmacao(naoVai)).toEqual({
      nome: "Maria da Conceição",
      telefone: "98999676346",
      status: "recusou",
      acompanhantes: [],
      convidadoPor: "",
      recado: "Felicidades!",
    });
    expect(paraNovaConfirmacao(esquema.parse(VALIDO)).acompanhantes).toEqual(["João Pedro"]);
  });
});

describe("linhas lidas do banco", () => {
  const linha = {
    id: "12",
    nome: "Maria",
    telefone: "98999676346",
    telefone_hash: "a".repeat(64),
    vai_comparecer: true,
    acompanhantes: ["João"],
    quem_convidou: "Jaqueline",
    recado: null,
    atualiza_de: null,
    criado_em: "2026-10-17T12:00:00.000Z",
  };

  it("aceita a linha como o Postgres devolve (bigint em texto, data ISO, nulos)", () => {
    const lido = esquemaLinhaConfirmacao.parse(linha);
    expect(lido.criado_em).toEqual(new Date("2026-10-17T12:00:00.000Z"));
    expect(esquemaLinhaConfirmacao.parse({ ...linha, id: 12, criado_em: new Date() }).id).toBe(12);
  });

  it.each<[string, Record<string, unknown>]>([
    ["telefone com máscara", { telefone: "(98) 99967-6346" }],
    ["telefone que o app não formataria", { telefone: "0000000000" }],
    ["hash fora do formato", { telefone_hash: "abc" }],
    ["data inválida", { criado_em: "ontem" }],
    ["data nula (não vira 1970)", { criado_em: null }],
    ["data numérica (não vira 1970)", { criado_em: 0 }],
    ["acompanhantes demais", { acompanhantes: Array.from({ length: 11 }, () => "X") }],
    ["recado longo", { recado: "a".repeat(241) }],
  ])("recusa %s", (_rotulo, alteracao) => {
    expect(esquemaLinhaConfirmacao.safeParse({ ...linha, ...alteracao }).success).toBe(false);
  });
});

describe("config do casamento", () => {
  it("passa na validação (limites do PIX, ids únicos, telefone do WhatsApp)", () => {
    const resultado = esquemaConfig.safeParse(casamento);
    expect(resultado.error?.issues ?? []).toEqual([]);
  });

  it.each<[string, (c: typeof casamento) => unknown]>([
    ["nome do recebedor com 26 letras", (c) => ({ ...c, pix: { ...c.pix, nomeRecebedor: "A".repeat(26) } })],
    ["cidade com acento", (c) => ({ ...c, pix: { ...c.pix, cidade: "SÃO LUÍS" } })],
    ["cidade com 16 letras", (c) => ({ ...c, pix: { ...c.pix, cidade: "B".repeat(16) } })],
    ["WhatsApp sem 55", (c) => ({ ...c, whatsapp: { ...c.whatsapp, numero: "98999676346" } })],
    ["data sem fuso", (c) => ({ ...c, data: "2026-12-21T16:30:00" })],
    ["presentes com id repetido", (c) => ({ ...c, presentes: [c.presentes[0], c.presentes[0]] })],
    ["valor com fração de centavo", (c) => ({ ...c, presentes: [{ ...c.presentes[0], valor: 10.001 }] })],
  ])("recusa %s", (_rotulo, alterar) => {
    expect(esquemaConfig.safeParse(alterar(casamento)).success).toBe(false);
  });
});

describe("uma mensagem por vez", () => {
  it.each<[string, Partial<EntradaRsvp>, string]>([
    ["telefone vazio", { telefone: "" }, "telefone"],
    ["nome vazio", { nome: "" }, "nome"],
    ["nome longo com número", { nome: `${"A".repeat(121)}1` }, "nome"],
    ["nome curto com símbolo", { nome: "Al!" }, "nome"],
  ])("%s mostra só um erro no campo", (_rotulo, alteracao, campo) => {
    expect(errosDe({ ...VALIDO, ...alteracao }, campo)).toHaveLength(1);
  });
});

describe("quem responde 'não' não fica preso no passo que pulou", () => {
  it("acompanhante vazio e 'quem convidou' longo são ignorados e limpos", () => {
    const dados = esquema.parse({
      ...VALIDO,
      status: "recusou",
      acompanhantes: [{ nome: "" }],
      convidadoPor: "x".repeat(61),
    });
    expect(paraNovaConfirmacao(dados)).toMatchObject({ acompanhantes: [], convidadoPor: "" });
  });
});

describe("nomes digitados no celular", () => {
  it("aceita o apóstrofo tipográfico do iPhone e normaliza", () => {
    expect(esquema.parse({ ...VALIDO, nome: "Joana d’Arc" }).nome).toBe("Joana d'Arc");
  });

  it("aceita acento decomposto (NFD) e devolve composto", () => {
    expect(esquema.parse({ ...VALIDO, nome: "José Silva" }).nome).toBe("José Silva");
  });

  it("aceita telefone colado com +55 ou com o 0 de tronco", () => {
    expect(esquema.parse({ ...VALIDO, telefone: "+55 98 99967-6346" }).telefone).toBe("98999676346");
    expect(esquema.parse({ ...VALIDO, telefone: "(098) 99967-6346" }).telefone).toBe("98999676346");
  });

  it("recusa acompanhante com nome acima do limite gravável", () => {
    const longo = "Maria ".repeat(25).trim();
    expect(longo.length).toBeGreaterThan(120);
    expect(errosDe({ ...VALIDO, acompanhantes: [{ nome: longo }] }, "acompanhantes.0.nome")).toContain(
      erros.acompanhanteNome,
    );
  });
});

describe("propriedade: tudo que o formulário aprova, o banco grava e a leitura aceita", () => {
  // Fecha a classe de bug "gravou e sumiu": se um limite divergir, este teste quebra.
  const entradas: EntradaRsvp[] = [
    VALIDO,
    { ...VALIDO, nome: "A".repeat(120) },
    {
      ...VALIDO,
      acompanhantes: Array.from({ length: casamento.rsvp.maxAcompanhantes }, () => ({ nome: "B".repeat(120) })),
    },
    { ...VALIDO, convidadoPor: "C".repeat(60), recado: "d".repeat(240) },
    { ...VALIDO, status: "recusou", acompanhantes: [{ nome: "x".repeat(500) }], convidadoPor: "y".repeat(500) },
    { ...VALIDO, telefone: "(11) 3232-1234" },
  ];

  it.each(entradas.map((e, i) => [i, e] as const))("entrada %i", (_i, entrada) => {
    const dados = esquema.safeParse(entrada);
    expect(dados.success).toBe(true);
    if (!dados.success) return;
    const nova = paraNovaConfirmacao(dados.data);
    const hash = "f".repeat(64);
    expect(esquemaRegistro.safeParse({ ...nova, telefoneHash: hash, atualizaDe: null }).error?.issues ?? []).toEqual(
      [],
    );
    const linha = {
      id: "1",
      nome: nova.nome,
      telefone: nova.telefone,
      telefone_hash: hash,
      vai_comparecer: nova.status === "confirmado",
      acompanhantes: nova.acompanhantes,
      quem_convidou: nova.convidadoPor || null,
      recado: nova.recado || null,
      atualiza_de: null,
      criado_em: new Date(),
    };
    expect(esquemaLinhaConfirmacao.safeParse(linha).error?.issues ?? []).toEqual([]);
  });
});

describe("config: chave e recebedor do PIX", () => {
  it.each<[string, (c: typeof casamento) => unknown]>([
    ["chave de telefone sem +55", (c) => ({ ...c, pix: { ...c.pix, chaveFormatoBrCode: "98999676346" } })],
    ["nome do recebedor em minúsculas", (c) => ({ ...c, pix: { ...c.pix, nomeRecebedor: "Jaqueline" } })],
    ["nome do recebedor com acento", (c) => ({ ...c, pix: { ...c.pix, nomeRecebedor: "JOSÉ" } })],
  ])("recusa %s", (_rotulo, alterar) => {
    expect(esquemaConfig.safeParse(alterar(casamento)).success).toBe(false);
  });
});
