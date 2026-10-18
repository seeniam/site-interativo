import { describe, expect, it } from "vitest";
import { RegistroInvalido } from "@/lib/schemas/dominio";
import { LIMITES } from "@/lib/schemas/limites";
import { bancoDeTeste } from "./banco-de-teste";
import { AmbienteInvalido, DEMONSTRACAO, lerAmbiente, senhaVisivelNoLogin } from "./ambiente";
import { hashTelefone } from "./hash";
import { criarRepositorioMemoria, seedDemonstracao } from "./memoria";
import { criarRepositorioPostgres } from "./postgres";
import type { RegistroDeConfirmacao, RepositorioCasamento } from "./repositorio";

const SAL = "sal-de-teste-com-16+";

function registro(telefone: string, extra: Partial<RegistroDeConfirmacao> = {}): RegistroDeConfirmacao {
  return {
    nome: "Maria da Conceição",
    telefone,
    telefoneHash: hashTelefone(telefone, SAL),
    status: "confirmado",
    acompanhantes: ["João Pedro"],
    convidadoPor: "Jaqueline",
    recado: "Felicidades!",
    atualizaDe: null,
    ...extra,
  };
}

const adaptadores: [string, () => RepositorioCasamento][] = [
  ["postgres (pg-mem com o schema real)", () => criarRepositorioPostgres(bancoDeTeste().executar)],
  ["memória", () => criarRepositorioMemoria()],
];

describe.each(adaptadores)("repositório %s", (_nome, criar) => {
  it("grava e lista com os campos de volta", async () => {
    const repo = criar();
    await repo.registrarConfirmacao(registro("98999676346"));
    const [linha] = await repo.listarConfirmacoes();
    expect(linha).toMatchObject({
      nome: "Maria da Conceição",
      telefone: "98999676346",
      status: "confirmado",
      acompanhantes: ["João Pedro"],
      convidadoPor: "Jaqueline",
      recado: "Felicidades!",
      atualizaDe: null,
    });
    expect(linha?.criadoEm).toBeInstanceOf(Date);
  });

  it("quem não vai: vazio vira vazio (sem 'quem convidou' nem recado)", async () => {
    const repo = criar();
    await repo.registrarConfirmacao(
      registro("98999676346", { status: "recusou", acompanhantes: [], convidadoPor: "", recado: "" }),
    );
    expect((await repo.listarConfirmacoes())[0]).toMatchObject({ status: "recusou", convidadoPor: "", recado: "" });
  });

  it("ultimaRespostaDoHash: null antes, data depois — nada além da data", async () => {
    const repo = criar();
    const hash = hashTelefone("98999676346", SAL);
    expect(await repo.ultimaRespostaDoHash(hash)).toBeNull();
    await repo.registrarConfirmacao(registro("98999676346"));
    expect(await repo.ultimaRespostaDoHash(hash)).toBeInstanceOf(Date);
    expect(await repo.ultimaRespostaDoHash(hashTelefone("11999990000", SAL))).toBeNull();
  });

  it("atualizar resposta grava outra linha com atualiza_de, sem apagar a anterior", async () => {
    const repo = criar();
    const hash = hashTelefone("98999676346", SAL);
    await repo.registrarConfirmacao(registro("98999676346"));
    await repo.registrarConfirmacao(
      registro("98999676346", { status: "recusou", acompanhantes: [], convidadoPor: "", atualizaDe: hash }),
    );
    const linhas = await repo.listarConfirmacoes();
    expect(linhas).toHaveLength(2);
    expect(linhas.map((l) => l.atualizaDe)).toContain(hash);
  });

  it("presentes reservados: marca uma vez só", async () => {
    const repo = criar();
    expect(await repo.listarReservados()).toEqual([]);
    expect(await repo.reservarPresente("jogo-de-tacas")).toBe(true);
    expect(await repo.reservarPresente("jogo-de-tacas")).toBe(false);
    expect(await repo.listarReservados()).toEqual(["jogo-de-tacas"]);
  });
});

describe("adaptador postgres: SQL", () => {
  it("nunca usa select *", async () => {
    const { executar, consultas } = bancoDeTeste();
    const repo = criarRepositorioPostgres(executar);
    await repo.registrarConfirmacao(registro("98999676346"));
    await repo.listarConfirmacoes();
    await repo.ultimaRespostaDoHash("a".repeat(64));
    await repo.listarReservados();
    await repo.reservarPresente("x");
    expect(consultas.length).toBeGreaterThanOrEqual(5);
    for (const sql of consultas) expect(sql).not.toMatch(/select\s+\*/i);
  });

  it("guarda acompanhantes em jsonb e devolve como lista", async () => {
    const { executar } = bancoDeTeste();
    const repo = criarRepositorioPostgres(executar);
    await repo.registrarConfirmacao(registro("98999676346", { acompanhantes: ["Ana", "Zé d'Ávila"] }));
    const linhas = await executar("select acompanhantes from confirmacoes", []);
    expect(linhas[0]?.acompanhantes).toEqual(["Ana", "Zé d'Ávila"]);
  });

  it("descarta linha corrompida na leitura em vez de quebrar a lista", async () => {
    const { executar } = bancoDeTeste();
    const repo = criarRepositorioPostgres(executar);
    await repo.registrarConfirmacao(registro("98999676346"));
    await executar(
      `insert into confirmacoes (nome, telefone, telefone_hash, vai_comparecer) values ('X', 'lixo', 'abc', true)`,
      [],
    );
    expect(await repo.listarConfirmacoes()).toHaveLength(1);
  });
});

describe("adaptador em memória", () => {
  it("recusa gravar o que a leitura descartaria", async () => {
    const repo = criarRepositorioMemoria();
    const longo = "A".repeat(LIMITES.nomeAcompanhante + 1);
    await expect(repo.registrarConfirmacao(registro("98999676346", { acompanhantes: [longo] }))).rejects.toBeInstanceOf(
      RegistroInvalido,
    );
    expect(await repo.listarConfirmacoes()).toEqual([]);
  });

  it("seed da demonstração: 12 respostas inventadas, telefones (98) 90000-00XX", () => {
    const seed = seedDemonstracao(SAL, new Date("2026-10-17T12:00:00Z"), ["Jaqueline", "Diorlando"]);
    expect(seed).toHaveLength(12);
    for (const [i, c] of seed.entries()) {
      expect(c.telefone).toBe(`989000000${String(i + 1).padStart(2, "0")}`);
      expect(c.telefoneHash).toBe(hashTelefone(c.telefone, SAL));
      if (c.status === "recusou") expect(c.acompanhantes).toEqual([]);
    }
    expect(seed.some((c) => c.status === "recusou")).toBe(true);
    expect(new Set(seed.map((c) => c.nome)).size).toBe(12);
  });
});

describe("hashTelefone", () => {
  it("sha256 hexadecimal, determinístico, e muda com o sal", () => {
    const a = hashTelefone("98999676346", SAL);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(hashTelefone("98999676346", SAL)).toBe(a);
    expect(hashTelefone("98999676346", "outro-sal-qualquer")).not.toBe(a);
  });

  it("exige telefone normalizado e sal", () => {
    expect(() => hashTelefone("(98) 99967-6346", SAL)).toThrow(RangeError);
    expect(() => hashTelefone("98999676346", "")).toThrow(RangeError);
  });
});

describe("lerAmbiente", () => {
  const producao = {
    DATABASE_URL: "postgres://u:s@h/db",
    SENHA_NOIVOS: "senha-forte",
    SESSAO_SECRET: "s".repeat(32),
    RSVP_SALT: "r".repeat(16),
  };

  it("sem nenhuma variável: demonstração, com os valores públicos da demo", () => {
    expect(lerAmbiente({})).toEqual({ modo: "demonstracao", ...DEMONSTRACAO });
  });

  it("DEMO=true vence o banco", () => {
    expect(lerAmbiente({ ...producao, DEMO: "true" }).modo).toBe("demonstracao");
  });

  it("com o banco e os segredos: produção, com os valores das variáveis", () => {
    expect(lerAmbiente(producao)).toEqual({
      modo: "producao",
      databaseUrl: "postgres://u:s@h/db",
      senhaNoivos: "senha-forte",
      segredoSessao: "s".repeat(32),
      sal: "r".repeat(16),
    });
  });

  it.each(["SENHA_NOIVOS", "SESSAO_SECRET", "RSVP_SALT"] as const)(
    "com o banco, %s faltando ou curto é erro",
    (nome) => {
      expect(() => lerAmbiente({ ...producao, [nome]: undefined })).toThrow(AmbienteInvalido);
      expect(() => lerAmbiente({ ...producao, [nome]: "curto" })).toThrow(new RegExp(nome));
    },
  );

  it("produção da Vercel sem banco é erro (as respostas se perderiam), a não ser com DEMO", () => {
    expect(() => lerAmbiente({ VERCEL_ENV: "production" })).toThrow(AmbienteInvalido);
    expect(lerAmbiente({ VERCEL_ENV: "production", DEMO: "true" }).modo).toBe("demonstracao");
    expect(lerAmbiente({ VERCEL_ENV: "preview" }).modo).toBe("demonstracao");
  });

  it("o aviso com a senha da demonstração nunca aparece em produção", () => {
    expect(senhaVisivelNoLogin(lerAmbiente(producao))).toBeNull();
    expect(senhaVisivelNoLogin(lerAmbiente({ ...producao, VERCEL_ENV: "production" }))).toBeNull();
    expect(senhaVisivelNoLogin(lerAmbiente({}))).toBe("demo");
    expect(senhaVisivelNoLogin(lerAmbiente({ ...producao, DEMO: "true" }))).toBe("demo");
  });
});
