import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Fechamento da Fase 6 (briefing 10): a lista dos noivos. O servidor de teste roda em modo
 * demonstração (12 respostas fictícias, senha "demo"); outros testes também gravam respostas,
 * então as contagens aqui são relativas, nunca números fixos.
 */

const axe = (page: Page) => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();

/** IP próprio por teste: o login tem limite de 5 por minuto por IP. */
test.beforeEach(async ({ page }, info) => {
  await page.setExtraHTTPHeaders({
    "x-forwarded-for": `192.0.${info.workerIndex % 250}.${Math.floor(Math.random() * 250) + 1}`,
  });
});

async function entrar(page: Page) {
  await page.goto("/convidados");
  await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
  await page.getByLabel("Senha").fill("demo");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Lista de convidados" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /respostas?$/ })).toBeVisible();
}

/** Nomes visíveis na lista (cartões no celular, tabela no desktop). */
const nomesVisiveis = (page: Page) =>
  page
    .locator("article h2:visible, article h3:visible, tbody th[scope=row] > span:first-child:visible")
    .allTextContents();

test.describe("/convidados sem sessão", () => {
  test.use({ respostasEsperadas: ["/api/entrar"] });

  test("mostra só a porta: monograma, senha e o aviso de demonstração; nenhum dado", async ({ page, request }) => {
    await page.goto("/convidados");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lista de convidados");
    await expect(page.getByLabel("Senha")).toHaveAttribute("type", "password");
    await expect(page.locator("[data-aviso-demonstracao]")).toContainText("“demo”");
    await expect(page.getByText("Ana Exemplo da Silva")).toHaveCount(0);
    await expect(page.locator("[data-contador]")).toHaveCount(0);
    // A proteção real: a rota responde 401 sem cookie.
    expect((await request.get("/api/convidados")).status()).toBe(401);
  });

  test("senha errada: mensagem clara e continua na porta", async ({ page }) => {
    await page.goto("/convidados");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
    await page.getByLabel("Senha").fill("chute");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.locator(".campo__erro[role=alert]")).toHaveText("Senha incorreta. Confira e tente de novo.");
    await expect(page.getByLabel("Senha")).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("[data-contador]")).toHaveCount(0);
  });

  test("a página está fora dos buscadores", async ({ page }) => {
    await page.goto("/convidados");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("passa no axe", async ({ page }) => {
    await page.goto("/convidados");
    expect((await axe(page)).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("/convidados com a sessão dos noivos", () => {
  test("contadores, lista e telefones mascarados até “Mostrar telefones”", async ({ page }) => {
    await entrar(page);
    const [confirmados, naoVao, total] = (await page.locator("[data-contador]").allTextContents()).map(Number);
    expect(confirmados).toBeGreaterThan(0);
    expect(naoVao).toBeGreaterThan(0);
    expect(total).toBeGreaterThanOrEqual(12);
    expect(await nomesVisiveis(page)).toContain("Ana Exemplo da Silva");

    const telefones = page.locator("[data-telefone]:visible");
    await expect(telefones.first()).toContainText("*");
    await page.getByRole("button", { name: "Mostrar telefones" }).click();
    await expect(page.getByRole("button", { name: "Ocultar telefones" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("(98) 90000-0001").locator("visible=true")).toHaveCount(1);
    await expect(telefones.first()).not.toContainText("*");
  });

  test("busca sem botão: por nome, sem acento, e pelo nome de quem vem junto", async ({ page }) => {
    await entrar(page);
    const busca = page.getByLabel("Buscar por nome");
    await busca.fill("dora demonstracao");
    await expect.poll(() => nomesVisiveis(page)).toEqual(["Dora Demonstração"]);
    await busca.fill("fabio");
    await expect.poll(() => nomesVisiveis(page)).toEqual(["Dora Demonstração"]);
    await expect(page.getByRole("status").filter({ hasText: "1 resposta" })).toBeVisible();
    await busca.fill("ninguém com esse nome");
    await expect(page.getByText("Nenhuma resposta com esse filtro.")).toBeVisible();
  });

  test("chips de status e agrupamento por quem convidou, com subtotal", async ({ page }) => {
    await entrar(page);
    await page.getByRole("button", { name: "Não vão" }).click();
    await expect(page.getByRole("button", { name: "Não vão" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => nomesVisiveis(page)).toContain("Gustavo Modelo Lima");
    // O filtro deixa só quem não vai (outros testes também gravam respostas: nada de nomes fixos aqui).
    await expect(page.getByText("Confirmado", { exact: true }).locator("visible=true")).toHaveCount(0);
    await expect(page.getByText("Não vai", { exact: true }).locator("visible=true").first()).toBeVisible();

    await page.getByRole("button", { name: "Todos" }).click();
    await page.getByRole("button", { name: "Por quem convidou" }).click();
    for (const grupo of ["Diorlando", "Jaqueline"]) {
      await expect(page.getByRole("heading", { level: 2, name: grupo })).toBeVisible();
    }
    await expect(page.getByText(/pessoas? confirmadas?, \d+ respostas?/).first()).toBeVisible();
  });

  test("exportar CSV: UTF-8 com BOM, ponto e vírgula e as respostas filtradas", async ({ page }) => {
    await entrar(page);
    await page.getByLabel("Buscar por nome").fill("Ana Exemplo");
    await expect.poll(() => nomesVisiveis(page)).toEqual(["Ana Exemplo da Silva"]);
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Exportar CSV" }).click();
    const arquivo = await download;
    expect(arquivo.suggestedFilename()).toMatch(/^convidados-\d{4}-\d{2}-\d{2}\.csv$/);
    const conteudo = fs.readFileSync((await arquivo.path()) ?? "", "utf8");
    expect(conteudo.charCodeAt(0)).toBe(0xfeff);
    const linhas = conteudo.slice(1).trim().split("\r\n");
    expect(linhas[0]).toBe(
      "Nome;Status;Acompanhantes;Nomes dos acompanhantes;Quem convidou;Telefone;Recado;Respondeu em",
    );
    expect(linhas).toHaveLength(2);
    expect(linhas[1]).toMatch(/^Ana Exemplo da Silva;(Confirmado|Não vai);/);
  });

  test("desktop: tabela com ordenação por nome e por data", async ({ page }, info) => {
    test.skip(!info.project.name.startsWith("desktop"), "a tabela é do desktop (≥1024px)");
    await entrar(page);
    const tabela = page.locator(".tabela-convidados table:visible");
    await expect(tabela).toBeVisible();
    await page.getByRole("button", { name: "Nome" }).click();
    await expect(page.getByRole("columnheader", { name: "Nome" })).toHaveAttribute("aria-sort", "ascending");
    const nomes = await nomesVisiveis(page);
    expect(nomes).toEqual([...nomes].sort((a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base" })));
    expect(nomes.length).toBeLessThanOrEqual(25);
    await page.getByRole("button", { name: "Respondeu em" }).click();
    await expect(page.getByRole("columnheader", { name: "Respondeu em" })).toHaveAttribute("aria-sort", "descending");
  });

  test("confirmar presença numa aba → aparece sozinho na lista aberta em outra", async ({ page, context }) => {
    test.slow(); // espera a atualização automática (15s)
    await entrar(page);
    const nome = `Rafa Tempo Real ${Math.floor(Math.random() * 1e6)}`
      .replace(/\d/g, (d) => "abcdefghij"[Number(d)] ?? "")
      .trim();

    const outra = await context.newPage();
    await outra.setExtraHTTPHeaders({ "x-forwarded-for": `198.18.0.${Math.floor(Math.random() * 250) + 1}` });
    await outra.goto("/confirmar-presenca");
    await expect(outra.getByRole("button", { name: "Continuar" })).toBeEnabled();
    await outra.getByLabel("Nome completo").fill(nome);
    await outra.getByLabel("Telefone com DDD").fill(`98 9${String(Math.floor(Math.random() * 1e8)).padStart(8, "0")}`);
    await outra.getByRole("button", { name: "Continuar" }).click();
    await outra.getByText("Não poderei ir").click();
    await outra.getByRole("button", { name: "Continuar" }).click();
    await outra.getByRole("button", { name: "Enviar resposta" }).click();
    await expect(outra).toHaveURL(/\/agradecimento/, { timeout: 20_000 });

    // Sem tocar em nada na primeira aba: a revalidação automática traz a resposta nova.
    await page.bringToFront();
    await expect.poll(() => nomesVisiveis(page), { timeout: 25_000 }).toContain(nome);
  });

  test("sair volta para a porta", async ({ page }) => {
    await entrar(page);
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.locator("[data-contador]")).toHaveCount(0);
  });

  test("passa no axe", async ({ page }) => {
    test.slow();
    await entrar(page);
    expect((await axe(page)).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("/convidados: estados", () => {
  test.use({ respostasEsperadas: ["/api/convidados"] });

  test("vazio: ícone de aliança e convite para compartilhar", async ({ page }) => {
    await page.route("**/api/convidados", (rota) =>
      rota.fulfill({ json: { respostas: [], geradoEm: new Date().toISOString() } }),
    );
    await page.goto("/convidados");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
    await page.getByLabel("Senha").fill("demo");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Ninguém confirmou ainda.")).toBeVisible();
    await expect(page.locator("[data-contador]")).toHaveText(["0", "0", "0"]);
  });

  test("erro: “Tentar de novo” recupera a lista", async ({ page }) => {
    await page.route("**/api/convidados", (rota) => rota.fulfill({ status: 500, json: { ok: false } }));
    await page.goto("/convidados");
    await expect(page.getByRole("button", { name: "Entrar" })).toBeEnabled();
    await page.getByLabel("Senha").fill("demo");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.locator(".alerta-rsvp[role=alert]")).toContainText("Não deu para carregar a lista.");
    await page.unroute("**/api/convidados");
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect.poll(() => nomesVisiveis(page)).toContain("Ana Exemplo da Silva");
  });
});
