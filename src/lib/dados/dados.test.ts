import { afterEach, describe, expect, it, vi } from "vitest";
import type { Confirmacao, NovaConfirmacao } from "@/types/dominio";
import { RegistroInvalido } from "@/lib/schemas/dominio";
import { LIMITES } from "@/lib/schemas/limites";
import { ConfiguracaoDeDadosInvalida, escolherOrigem, lerConfigFirebase } from "./configuracao";
import { paraErroDeRede } from "./firestore";
import { CHAVE_SIMULAR_FALHA, CHAVES_LOCAIS, criarRepositoriosLocais } from "./local";
import { respostaVigenteDoTelefone, respostasVigentes } from "./regras";
import { ErroDeRede } from "./repositorio";

/** localStorage em memória, com o mesmo contrato. */
function armazenamentoEmMemoria() {
  const dados = new Map<string, string>();
  return {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => void dados.set(k, v),
    removeItem: (k: string) => void dados.delete(k),
    dados,
  };
}

const NOVA: NovaConfirmacao = {
  nome: "Maria da Conceição",
  telefone: "98999676346",
  status: "confirmado",
  acompanhantes: ["João"],
  convidadoPor: "Jaqueline",
  recado: "",
};

function criar(opcoes: { agora?: () => Date } = {}) {
  const armazenamento = armazenamentoEmMemoria();
  let n = 0;
  const repos = criarRepositoriosLocais({ armazenamento, gerarId: () => `id-${++n}`, ...opcoes });
  return { repos, armazenamento };
}

describe("repositório local (demonstração)", () => {
  it("registra e lista, com id e data", async () => {
    const { repos } = criar({ agora: () => new Date("2026-10-17T12:00:00Z") });
    const salvo = await repos.confirmacoes.registrar(NOVA);
    expect(salvo).toMatchObject({ ...NOVA, id: "id-1" });
    expect(await repos.confirmacoes.listar()).toEqual([salvo]);
    expect(repos.origem).toBe("local");
  });

  it("é só de inclusão: responder de novo cria outro registro", async () => {
    const { repos } = criar();
    await repos.confirmacoes.registrar(NOVA);
    await repos.confirmacoes.registrar({ ...NOVA, status: "recusou", acompanhantes: [] });
    expect(await repos.confirmacoes.listar()).toHaveLength(2);
  });

  it("observar avisa na hora e a cada mudança, e para depois de cancelado", async () => {
    const { repos } = criar();
    const aoMudar = vi.fn<(todas: Confirmacao[]) => void>();
    const cancelar = repos.confirmacoes.observar(aoMudar, () => {});
    expect(aoMudar).toHaveBeenLastCalledWith([]);
    await repos.confirmacoes.registrar(NOVA);
    expect(aoMudar).toHaveBeenCalledTimes(2);
    expect(aoMudar.mock.lastCall?.[0]).toHaveLength(1);
    cancelar();
    await repos.confirmacoes.registrar(NOVA);
    expect(aoMudar).toHaveBeenCalledTimes(2);
  });

  it("ouve mudanças feitas em outra aba (evento storage)", () => {
    const armazenamento = armazenamentoEmMemoria();
    const alvo = new EventTarget();
    const repos = criarRepositoriosLocais({
      armazenamento,
      alvoDeEventos: alvo as unknown as Pick<Window, "addEventListener" | "removeEventListener">,
    });
    const aoMudar = vi.fn();
    repos.confirmacoes.observar(aoMudar, () => {});
    // Outra aba gravou: simula o evento que o navegador dispara.
    const evento = Object.assign(new Event("storage"), { key: CHAVES_LOCAIS.confirmacoes });
    alvo.dispatchEvent(evento);
    expect(aoMudar).toHaveBeenCalledTimes(2);
    alvo.dispatchEvent(Object.assign(new Event("storage"), { key: "outra-chave" }));
    expect(aoMudar).toHaveBeenCalledTimes(2);
  });

  it("simula falha de rede uma vez, sem perder o que já estava salvo", async () => {
    const { repos, armazenamento } = criar();
    await repos.confirmacoes.registrar(NOVA);
    armazenamento.setItem(CHAVE_SIMULAR_FALHA, "1");
    await expect(repos.confirmacoes.registrar(NOVA)).rejects.toBeInstanceOf(ErroDeRede);
    expect(await repos.confirmacoes.listar()).toHaveLength(1);
    // A tentativa seguinte funciona: "Tentar de novo".
    await repos.confirmacoes.registrar(NOVA);
    expect(await repos.confirmacoes.listar()).toHaveLength(2);
  });

  it("ignora JSON corrompido e registros inválidos em vez de quebrar", async () => {
    const { repos, armazenamento } = criar();
    armazenamento.setItem(CHAVES_LOCAIS.confirmacoes, "{não é json");
    expect(await repos.confirmacoes.listar()).toEqual([]);
    armazenamento.setItem(CHAVES_LOCAIS.confirmacoes, JSON.stringify([{ lixo: 1 }, "x"]));
    expect(await repos.confirmacoes.listar()).toEqual([]);
    await repos.confirmacoes.registrar(NOVA);
    expect(await repos.confirmacoes.listar()).toHaveLength(1);
  });

  it("presentes reservados: reservar, listar e observar", async () => {
    const { repos } = criar();
    const aoMudar = vi.fn();
    repos.presentes.observarReservados(aoMudar, () => {});
    await repos.presentes.reservar("jogo-de-tacas");
    expect((await repos.presentes.listarReservados()).map((r) => r.presenteId)).toEqual(["jogo-de-tacas"]);
    expect(aoMudar).toHaveBeenCalledTimes(2);
  });
});

describe("respostas vigentes (vale a mais recente de cada telefone)", () => {
  const resposta = (id: string, telefone: string, iso: string, status: Confirmacao["status"] = "confirmado") =>
    ({ ...NOVA, id, telefone, status, criadoEm: new Date(iso) }) satisfies Confirmacao;

  const todas = [
    resposta("a", "98999676346", "2026-10-01T10:00:00Z"),
    resposta("b", "11999990000", "2026-10-02T10:00:00Z"),
    resposta("c", "98999676346", "2026-10-05T10:00:00Z", "recusou"),
  ];

  it("uma por telefone, a mais recente, da mais nova para a mais antiga", () => {
    expect(respostasVigentes(todas).map((r) => r.id)).toEqual(["c", "b"]);
  });

  it("não depende da ordem de chegada", () => {
    expect(respostasVigentes([...todas].reverse()).map((r) => r.id)).toEqual(["c", "b"]);
  });

  it("acha a resposta vigente de um telefone, ou null", () => {
    expect(respostaVigenteDoTelefone(todas, "98999676346")?.id).toBe("c");
    expect(respostaVigenteDoTelefone(todas, "21900000000")).toBeNull();
  });

  it("lista vazia", () => {
    expect(respostasVigentes([])).toEqual([]);
  });
});

describe("nunca grava o que a leitura descartaria", () => {
  it("recusa acompanhante com nome acima do limite, sem gravar nada", async () => {
    const { repos, armazenamento } = criar();
    const longo = "A".repeat(LIMITES.nomeAcompanhante + 1);
    await expect(repos.confirmacoes.registrar({ ...NOVA, acompanhantes: [longo] })).rejects.toBeInstanceOf(
      RegistroInvalido,
    );
    expect(armazenamento.dados.has(CHAVES_LOCAIS.confirmacoes)).toBe(false);
  });

  it("recusa telefone que a leitura não aceitaria", async () => {
    const { repos } = criar();
    await expect(repos.confirmacoes.registrar({ ...NOVA, telefone: "0000000000" })).rejects.toBeInstanceOf(
      RegistroInvalido,
    );
  });

  it("o que foi gravado volta igual na leitura", async () => {
    const { repos } = criar({ agora: () => new Date("2026-10-17T12:00:00Z") });
    const salvo = await repos.confirmacoes.registrar(NOVA);
    expect(await repos.confirmacoes.listar()).toEqual([salvo]);
  });
});

describe("ids da demonstração fora de contexto seguro", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sem crypto.randomUUID (http por IP), usa getRandomValues", async () => {
    const original = globalThis.crypto;
    vi.stubGlobal("crypto", { getRandomValues: original.getRandomValues.bind(original) });
    const repos = criarRepositoriosLocais({ armazenamento: armazenamentoEmMemoria() });
    const salvo = await repos.confirmacoes.registrar(NOVA);
    expect(salvo.id).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe("paraErroDeRede", () => {
  it.each<[string, unknown]>([
    ["código unavailable do Firestore", { code: "unavailable", message: "offline" }],
    ["chunk do SDK que não baixou", Object.assign(new Error("Loading chunk 123 failed"), { name: "ChunkLoadError" })],
    ["import dinâmico que falhou", new TypeError("Failed to fetch dynamically imported module: /_next/x.js")],
  ])("%s vira ErroDeRede (a tela oferece 'Tentar de novo')", (_rotulo, erro) => {
    expect(paraErroDeRede(erro)).toBeInstanceOf(ErroDeRede);
  });

  it("erro de permissão não vira ErroDeRede (tentar de novo não resolveria)", () => {
    const erro = paraErroDeRede({ code: "permission-denied", message: "negado" });
    expect(erro).not.toBeInstanceOf(ErroDeRede);
  });
});

describe("configuração do Firebase", () => {
  const completas = {
    NEXT_PUBLIC_FIREBASE_API_KEY: "chave",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "x.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "x",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:2:web:3",
  };

  it("com todas as chaves, a config está completa", () => {
    expect(lerConfigFirebase(completas)).toEqual({
      estado: "completa",
      config: { apiKey: "chave", authDomain: "x.firebaseapp.com", projectId: "x", appId: "1:2:web:3" },
    });
  });

  it("sem nenhuma chave, está ausente", () => {
    expect(lerConfigFirebase({})).toEqual({ estado: "ausente" });
  });

  it.each(Object.keys(completas))("sem %s, está pela metade e diz o que falta", (chave) => {
    for (const vazio of [undefined, "   "]) {
      expect(lerConfigFirebase({ ...completas, [chave]: vazio })).toEqual({ estado: "parcial", faltando: [chave] });
    }
  });

  describe("escolherOrigem — nunca cai em silêncio na demonstração em produção", () => {
    it("Firebase completo → Firestore", () => {
      expect(escolherOrigem(completas, true).origem).toBe("firestore");
    });

    it("sem Firebase em desenvolvimento → demonstração local", () => {
      expect(escolherOrigem({}, false)).toEqual({ origem: "local" });
    });

    it("sem Firebase em produção → erro, a menos que a demonstração seja pedida", () => {
      expect(() => escolherOrigem({}, true)).toThrow(ConfiguracaoDeDadosInvalida);
      expect(escolherOrigem({ NEXT_PUBLIC_MODO_DEMONSTRACAO: "1" }, true)).toEqual({ origem: "local" });
    });

    it("Firebase pela metade → erro com as chaves que faltam, em qualquer ambiente", () => {
      const parcial = { ...completas, NEXT_PUBLIC_FIREBASE_APP_ID: undefined };
      for (const producao of [true, false]) {
        expect(() => escolherOrigem(parcial, producao)).toThrow(/NEXT_PUBLIC_FIREBASE_APP_ID/);
      }
    });
  });
});
