/**
 * Testes obrigatórios das rotas (briefing 5), contra o `db/schema.sql` real no pg-mem:
 * anônimo grava RSVP válido; payload inválido é rejeitado; `/api/convidados` sem sessão = 401;
 * `/api/rsvp/verificar` devolve só o booleano e a data.
 */
import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { bancoDeTeste } from "@/lib/db/banco-de-teste";
import { hashTelefone } from "@/lib/db/hash";
import { criarRepositorioPostgres } from "@/lib/db/postgres";
import type { RepositorioCasamento } from "@/lib/db/repositorio";
import type { EntradaRsvp } from "@/lib/schemas/rsvp";
import { CORPO_MAXIMO } from "./comum";
import { criarLimitador, type Limitador } from "./limite";
import { entrar, listarConvidados, sair } from "./noivos";
import { listarPresentesReservados, reservarPresente } from "./presentes";
import { registrarRsvp, verificarRsvp } from "./rsvp";
import { COOKIE_SESSAO, DURACAO_SESSAO_MS, chaveDaSessao, criarTokenSessao } from "./sessao";

const SAL = "sal-de-teste-com-16+";
const SENHA = "senha-dos-noivos";
const SEGREDO = "segredo-de-sessao-de-teste-com-32-caracteres";
const AGORA = Date.UTC(2026, 9, 18, 15);

const semLimite = (): Limitador => criarLimitador({ maximo: 1_000, janelaMs: 60_000 });

function pedido(corpo: unknown, opcoes: { ip?: string; cookie?: string; tipo?: string } = {}): Request {
  const headers: Record<string, string> = {
    "content-type": opcoes.tipo ?? "application/json",
    "x-forwarded-for": opcoes.ip ?? "203.0.113.7",
  };
  if (opcoes.cookie) headers.cookie = opcoes.cookie;
  return new Request("http://localhost/api", {
    method: "POST",
    headers,
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

function entrada(extra: Partial<EntradaRsvp> = {}): EntradaRsvp {
  return {
    nome: "Maria da Conceição",
    telefone: "(98) 99967-6346",
    status: "confirmado",
    convidadoPor: "Jaqueline",
    recado: "Felicidades!",
    site: "",
    ...extra,
  };
}

let banco: ReturnType<typeof bancoDeTeste>;
let repositorio: RepositorioCasamento;
const deps = (limitador = semLimite()) => ({ repositorio, sal: SAL, limitador });

beforeEach(() => {
  banco = bancoDeTeste();
  repositorio = criarRepositorioPostgres(banco.executar);
});

describe("POST /api/rsvp", () => {
  it("visitante anônimo grava um RSVP válido e recebe só { ok: true }", async () => {
    const resposta = await registrarRsvp(pedido(entrada()), deps());
    expect(resposta.status).toBe(200);
    expect(await resposta.json()).toEqual({ ok: true });
    const [linha] = await repositorio.listarConfirmacoes();
    expect(linha).toMatchObject({
      nome: "Maria da Conceição",
      telefone: "98999676346",
      telefoneHash: hashTelefone("98999676346", SAL),
      status: "confirmado",
      convidadoPor: "Jaqueline",
      atualizaDe: null,
    });
  });

  it("responder de novo grava outra linha com atualiza_de — nunca sobrescreve", async () => {
    await registrarRsvp(pedido(entrada()), deps());
    await registrarRsvp(pedido(entrada({ status: "recusou", recado: "Não vou poder" })), deps());
    const linhas = await repositorio.listarConfirmacoes();
    expect(linhas).toHaveLength(2);
    const hash = hashTelefone("98999676346", SAL);
    expect(linhas.map((l) => l.atualizaDe).sort()).toEqual([hash, null].sort());
  });

  it("payload inválido é rejeitado com 400, mensagens por campo e nada gravado", async () => {
    const resposta = await registrarRsvp(pedido(entrada({ nome: "Jo", telefone: "123" })), deps());
    expect(resposta.status).toBe(400);
    const corpo = (await resposta.json()) as { ok: boolean; campos: Record<string, string> };
    expect(corpo.ok).toBe(false);
    expect(Object.keys(corpo.campos).sort()).toEqual(["nome", "telefone"]);
    expect(JSON.stringify(corpo)).not.toContain("123");
    expect(await repositorio.listarConfirmacoes()).toEqual([]);
  });

  it.each([
    ["sem corpo de objeto", "[]"],
    ["status inventado", JSON.stringify(entrada({ status: "talvez" as never }))],
    ["campo faltando", JSON.stringify({ nome: "Maria da Conceição", telefone: "98999676346" })],
  ])("rejeita %s", async (_caso, corpo) => {
    expect((await registrarRsvp(pedido(corpo), deps())).status).toBe(400);
    expect(await repositorio.listarConfirmacoes()).toEqual([]);
  });

  it("quem não vai pode deixar lixo no campo escondido: grava sem 'quem convidou'", async () => {
    const corpo = entrada({ status: "recusou", convidadoPor: "x".repeat(500) });
    expect((await registrarRsvp(pedido(corpo), deps())).status).toBe(200);
    expect((await repositorio.listarConfirmacoes())[0]).toMatchObject({ convidadoPor: "" });
  });

  it("convite individual: acompanhantes enviados por fora não são gravados", async () => {
    const corpo = { ...entrada(), acompanhantes: [{ nome: "Pessoa Extra" }] };
    expect((await registrarRsvp(pedido(corpo), deps())).status).toBe(200);
    const linhas = await banco.executar("select * from confirmacoes", []);
    expect(Object.keys(linhas[0] ?? {})).not.toContain("acompanhantes");
    expect(JSON.stringify(linhas)).not.toContain("Pessoa Extra");
  });

  it("honeypot preenchido: parece sucesso, mas não grava", async () => {
    const resposta = await registrarRsvp(pedido(entrada({ site: "http://spam" })), deps());
    expect(await resposta.json()).toEqual({ ok: true });
    expect(await repositorio.listarConfirmacoes()).toEqual([]);
  });

  it("corpo que não é JSON (415), JSON quebrado (400) e grande demais (413)", async () => {
    expect((await registrarRsvp(pedido("nome=Maria", { tipo: "text/plain" }), deps())).status).toBe(415);
    expect((await registrarRsvp(pedido("{nome:"), deps())).status).toBe(400);
    const grande = JSON.stringify(entrada({ recado: "a".repeat(CORPO_MAXIMO) }));
    expect((await registrarRsvp(pedido(grande), deps())).status).toBe(413);
  });

  it("limite por IP: o 4º envio no mesmo minuto leva 429 com Retry-After; outro IP passa", async () => {
    const limitador = criarLimitador({ maximo: 3, janelaMs: 60_000 });
    for (let i = 0; i < 3; i++) expect((await registrarRsvp(pedido(entrada()), deps(limitador))).status).toBe(200);
    const barrado = await registrarRsvp(pedido(entrada()), deps(limitador));
    expect(barrado.status).toBe(429);
    expect(Number(barrado.headers.get("retry-after"))).toBeGreaterThan(0);
    expect((await registrarRsvp(pedido(entrada(), { ip: "198.51.100.2" }), deps(limitador))).status).toBe(200);
  });

  it("banco fora do ar: 503 sem vazar detalhe", async () => {
    const quebrado: RepositorioCasamento = {
      ...repositorio,
      ultimaRespostaDoHash: () => Promise.reject(new Error("conexão recusada para user=segredo")),
    };
    const original = console.error;
    console.error = () => {};
    try {
      const resposta = await registrarRsvp(pedido(entrada()), { ...deps(), repositorio: quebrado });
      expect(resposta.status).toBe(503);
      expect(JSON.stringify(await resposta.json())).not.toContain("segredo");
    } finally {
      console.error = original;
    }
  });
});

describe("POST /api/rsvp/verificar", () => {
  it("telefone sem resposta: exatamente { jaConfirmou: false }", async () => {
    const resposta = await verificarRsvp(pedido({ telefone: "(98) 99967-6346" }), deps());
    expect(await resposta.json()).toEqual({ jaConfirmou: false });
  });

  it("telefone que já respondeu: só o booleano e a data — nem telefone, nem nome, nem hash", async () => {
    await registrarRsvp(pedido(entrada()), deps());
    const resposta = await verificarRsvp(pedido({ telefone: "98999676346" }), deps());
    const corpo = (await resposta.json()) as Record<string, unknown>;
    expect(Object.keys(corpo).sort()).toEqual(["em", "jaConfirmou"]);
    expect(corpo.jaConfirmou).toBe(true);
    expect(new Date(String(corpo.em)).toISOString()).toBe(corpo.em);
    const texto = JSON.stringify(corpo);
    for (const proibido of ["98999676346", "Maria", hashTelefone("98999676346", SAL), SAL]) {
      expect(texto).not.toContain(proibido);
    }
  });

  it("telefone inválido: 400", async () => {
    expect((await verificarRsvp(pedido({ telefone: "12" }), deps())).status).toBe(400);
    expect((await verificarRsvp(pedido({}), deps())).status).toBe(400);
  });

  it("tem limite por IP (não vira sonda de telefones)", async () => {
    const limitador = criarLimitador({ maximo: 2, janelaMs: 60_000 });
    await verificarRsvp(pedido({ telefone: "98999676346" }), deps(limitador));
    await verificarRsvp(pedido({ telefone: "98999676347" }), deps(limitador));
    expect((await verificarRsvp(pedido({ telefone: "98999676348" }), deps(limitador))).status).toBe(429);
  });
});

describe("sessão dos noivos e GET /api/convidados", () => {
  const depsEntrar = (limitador = semLimite()) => ({
    senhaNoivos: SENHA,
    segredoSessao: SEGREDO,
    limitador,
    agora: () => AGORA,
  });
  const depsConvidados = (agora = AGORA, senhaNoivos = SENHA) => ({
    repositorio,
    segredoSessao: SEGREDO,
    senhaNoivos,
    agora: () => agora,
  });
  const CHAVE = chaveDaSessao(SEGREDO, SENHA);
  const get = (cookie?: string) =>
    new Request("http://localhost/api/convidados", { headers: cookie ? { cookie } : {} });

  it("sem cookie: 401 e nenhum dado", async () => {
    await registrarRsvp(pedido(entrada()), deps());
    const resposta = await listarConvidados(get(), depsConvidados());
    expect(resposta.status).toBe(401);
    const texto = await resposta.text();
    expect(texto).not.toContain("Maria");
    expect(texto).not.toContain("98999676346");
  });

  it.each([
    ["forjado", `${COOKIE_SESSAO}=v1.9999999999999.assinatura-falsa`],
    [
      "assinado com outro segredo",
      `${COOKIE_SESSAO}=${criarTokenSessao("outro-segredo-qualquer-com-32-caract", AGORA)}`,
    ],
    ["malformado", `${COOKIE_SESSAO}=qualquer-coisa`],
    ["com percent-encoding quebrado", `${COOKIE_SESSAO}=%zz`],
    ["assinado só com o segredo (sem a senha)", `${COOKIE_SESSAO}=${criarTokenSessao(SEGREDO, AGORA)}`],
  ])("cookie %s: 401", async (_caso, cookie) => {
    expect((await listarConvidados(get(cookie), depsConvidados())).status).toBe(401);
  });

  it("cookie vencido (depois de 30 dias): 401", async () => {
    const cookie = `${COOKIE_SESSAO}=${criarTokenSessao(CHAVE, AGORA)}`;
    expect((await listarConvidados(get(cookie), depsConvidados(AGORA + DURACAO_SESSAO_MS - 1))).status).toBe(200);
    expect((await listarConvidados(get(cookie), depsConvidados(AGORA + DURACAO_SESSAO_MS + 1))).status).toBe(401);
  });

  it("trocar a senha dos noivos derruba as sessões antigas", async () => {
    const cookie = `${COOKIE_SESSAO}=${criarTokenSessao(CHAVE, AGORA)}`;
    expect((await listarConvidados(get(cookie), depsConvidados())).status).toBe(200);
    expect((await listarConvidados(get(cookie), depsConvidados(AGORA, "senha-nova-dos-noivos"))).status).toBe(401);
  });

  it("senha errada: 401 sem cookie", async () => {
    const resposta = await entrar(pedido({ senha: "chute" }), depsEntrar());
    expect(resposta.status).toBe(401);
    expect(resposta.headers.get("set-cookie")).toBeNull();
  });

  it("senha certa: cookie httpOnly, secure, sameSite=lax, 30 dias — e a lista sai com a resposta que vale", async () => {
    await registrarRsvp(pedido(entrada()), deps());
    await registrarRsvp(pedido(entrada({ status: "recusou", recado: "Mudou o plano" })), deps());

    const resposta = await entrar(pedido({ senha: SENHA }), depsEntrar());
    expect(resposta.status).toBe(200);
    const setCookie = resposta.headers.get("set-cookie") ?? "";
    for (const atributo of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/", `Max-Age=${DURACAO_SESSAO_MS / 1000}`]) {
      expect(setCookie).toContain(atributo);
    }

    const cookie = setCookie.split(";")[0] ?? "";
    const lista = await listarConvidados(get(cookie), depsConvidados());
    expect(lista.status).toBe(200);
    const { respostas } = (await lista.json()) as { respostas: Record<string, unknown>[] };
    expect(respostas).toHaveLength(1);
    expect(respostas[0]).toMatchObject({ status: "recusou", recado: "Mudou o plano", atualizada: true });
    expect(respostas[0]).not.toHaveProperty("telefoneHash");
  });

  it("chutes de senha em série: o 6º no minuto leva 429", async () => {
    const limitador = criarLimitador({ maximo: 5, janelaMs: 60_000 });
    for (let i = 0; i < 5; i++) await entrar(pedido({ senha: `chute-${i}` }), depsEntrar(limitador));
    expect((await entrar(pedido({ senha: SENHA }), depsEntrar(limitador))).status).toBe(429);
  });

  it("sair apaga o cookie", () => {
    expect(sair().headers.get("set-cookie")).toContain("Max-Age=0");
  });
});

describe("presentes", () => {
  const presentes = [
    { id: "ouro", tipo: "cota" },
    { id: "jogo-de-panelas", tipo: "nomeado" },
  ] as const;
  const depsReserva = () => ({ repositorio, presentes, limitador: semLimite() });

  it("GET /api/presentes devolve só a lista de ids reservados", async () => {
    expect(await (await listarPresentesReservados(repositorio)).json()).toEqual({ reservados: [] });
  });

  it("cota nunca se esgota (V2): 400 e nada marcado", async () => {
    expect((await reservarPresente(pedido({}), "ouro", depsReserva())).status).toBe(400);
    expect(await repositorio.listarReservados()).toEqual([]);
  });

  it("presente inexistente: 404", async () => {
    expect((await reservarPresente(pedido({}), "diamante", depsReserva())).status).toBe(404);
  });

  it("presente nomeado: marca uma vez; a segunda leva 409", async () => {
    expect((await reservarPresente(pedido({}), "jogo-de-panelas", depsReserva())).status).toBe(200);
    expect((await reservarPresente(pedido({}), "jogo-de-panelas", depsReserva())).status).toBe(409);
    expect(await repositorio.listarReservados()).toEqual(["jogo-de-panelas"]);
  });
});

describe("guardas estáticas das rotas", () => {
  const raiz = path.resolve(import.meta.dirname, "../../..");
  const arquivos = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const caminho = path.join(dir, e.name);
      return e.isDirectory() ? arquivos(caminho) : /\.tsx?$/.test(e.name) ? [caminho] : [];
    });
  const relativo = (arquivo: string) => path.relative(raiz, arquivo).replaceAll("\\", "/");

  it("só a rota dos noivos lê a lista de confirmações", () => {
    const leem = arquivos(path.join(raiz, "src/app"))
      .filter((a) => /listarConfirmacoes|listarConvidados/.test(fs.readFileSync(a, "utf8")))
      .map(relativo);
    expect(leem).toEqual(["src/app/api/convidados/route.ts"]);
  });

  it("toda rota de API existente tem teste aqui", () => {
    const rotas = arquivos(path.join(raiz, "src/app/api")).map(relativo).sort();
    expect(rotas).toEqual([
      "src/app/api/convidados/route.ts",
      "src/app/api/entrar/route.ts",
      "src/app/api/presentes/[id]/reservar/route.ts",
      "src/app/api/presentes/route.ts",
      "src/app/api/rsvp/route.ts",
      "src/app/api/rsvp/verificar/route.ts",
      "src/app/api/sair/route.ts",
    ]);
  });
});
