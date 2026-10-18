import AxeBuilder from "@axe-core/playwright";
import type { APIRequestContext, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

/**
 * Fechamento da Fase 5 (briefing 10): caminho feliz, "não vou", telefone repetido, falha de rede
 * e teclado do início ao fim. O servidor de teste roda em modo demonstração (memória com seed).
 */

/** Navegação depois do envio: a primeira renderização de /agradecimento num servidor frio é lenta nesta máquina. */
const DEPOIS_DO_ENVIO = { timeout: 20_000 };

/** Um celular válido e único por teste: os testes rodam em paralelo contra o mesmo servidor. */
function telefoneNovo(): { digitado: string; digitos: string } {
  const final = String(Math.floor(Math.random() * 1e8)).padStart(8, "0");
  return { digitado: `98 9${final}`, digitos: `989${final}` };
}

/** IP próprio por teste: o limite de 3 envios por minuto vale por IP, e aqui todos viriam de 127.0.0.1. */
test.beforeEach(async ({ page }, info) => {
  const n = (info.workerIndex * 97 + info.repeatEachIndex + Math.floor(Math.random() * 200)) % 250;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.${info.workerIndex % 250}.${n + 1}` });
});

/** Abre o formulário e espera a hidratação (antes dela o botão fica desabilitado de propósito). */
async function abrirFormulario(page: Page) {
  await page.goto("/confirmar-presenca");
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
}

async function preencherPasso1(page: Page, nome: string, telefone: string) {
  await page.getByLabel("Nome completo").fill(nome);
  await page.getByLabel("Telefone com DDD").fill(telefone);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Você vem?" })).toBeFocused();
}

/** Entra como noivos (senha da demonstração) e lê a lista pela rota protegida. */
async function respostasDosNoivos(request: APIRequestContext) {
  // IP próprio também aqui: o login tem limite de 5 por minuto por IP.
  const ip = { "x-forwarded-for": `203.0.113.${Math.floor(Math.random() * 250) + 1}` };
  const login = await request.post("/api/entrar", { data: { senha: "demo" }, headers: ip });
  expect(login.status()).toBe(200);
  const cookie = (login.headers()["set-cookie"] ?? "").split(";")[0] ?? "";
  const lista = await request.get("/api/convidados", { headers: { ...ip, cookie } });
  expect(lista.status()).toBe(200);
  return ((await lista.json()) as { respostas: { telefone: string; status: string; atualizada: boolean }[] }).respostas;
}

test.describe("/confirmar-presenca", () => {
  test("caminho feliz: vem com um acompanhante → agradecimento com confete e agenda", async ({ page, request }) => {
    const telefone = telefoneNovo();
    await abrirFormulario(page);
    await expect(page.locator("h1")).toHaveText("Confirmar presença");
    await expect(page.getByText("Passo 1 de 3")).toBeVisible();

    await preencherPasso1(page, "ana maria exemplo", telefone.digitado);
    await expect(page.getByLabel("Telefone com DDD")).toHaveCount(0);
    await page.getByText("Sim, estarei lá").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Os detalhes" })).toBeFocused();

    await page.getByRole("button", { name: "Adicionar um acompanhante" }).click();
    await expect(page.locator("output")).toHaveText("Você e mais 1 pessoa");
    await page.getByLabel("Nome de quem vem (1)").fill("Bruno Exemplo");
    await page.getByRole("button", { name: "Jaqueline" }).click();
    await expect(page.getByLabel("Quem convidou você?")).toHaveValue("Jaqueline");
    await page.getByLabel("Recado para o casal (opcional)").fill("Felicidades!");
    await expect(page.getByText("12 de 240 caracteres")).toBeVisible();

    const envio = page.waitForRequest("**/api/rsvp");
    await page.getByRole("button", { name: "Enviar resposta" }).click();
    const corpo = (await envio).postDataJSON() as Record<string, unknown>;
    expect(corpo).toMatchObject({
      nome: "ana maria exemplo",
      telefone: telefone.digitos,
      status: "confirmado",
      acompanhantes: [{ nome: "Bruno Exemplo" }],
      convidadoPor: "Jaqueline",
    });

    // Na URL, só o primeiro nome.
    await expect(page).toHaveURL(/\/agradecimento\?nome=Ana$/, DEPOIS_DO_ENVIO);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Obrigado, Ana!");
    await expect(page.locator(".confete")).toHaveCount(1);
    await expect(page.getByText("Adicionar à agenda")).toBeVisible();
    await expect(page.getByRole("link", { name: "Presentear os noivos" })).toHaveAttribute("href", "/presentear");
    await expect(page.getByRole("link", { name: "Voltar ao convite" })).toHaveAttribute("href", "/");

    const gravada = (await respostasDosNoivos(request)).find((r) => r.telefone === telefone.digitos);
    expect(gravada).toMatchObject({ status: "confirmado", atualizada: false });
  });

  test("“não vou”: pula direto para o recado; agradecimento caloroso, sem confete e sem agenda", async ({ page }) => {
    await abrirFormulario(page);
    await preencherPasso1(page, "Bruno Fictício", telefoneNovo().digitado);
    await page.getByText("Não poderei ir").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Um recado para os noivos" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Adicionar um acompanhante" })).toHaveCount(0);
    await expect(page.getByLabel("Quem convidou você?")).toHaveCount(0);
    await page.getByLabel("Recado para o casal (opcional)").fill("Estarei com vocês em pensamento.");
    await page.getByRole("button", { name: "Enviar resposta" }).click();

    await expect(page).toHaveURL(/\/agradecimento\?nome=Bruno&resposta=nao$/, DEPOIS_DO_ENVIO);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Obrigado por avisar, Bruno");
    await expect(page.getByText("Vamos sentir sua falta.")).toBeVisible();
    await expect(page.locator(".confete")).toHaveCount(0);
    await expect(page.getByText("Adicionar à agenda")).toHaveCount(0);
  });

  test("telefone repetido: avisa a data e grava a atualização como resposta nova", async ({ page, request }) => {
    await abrirFormulario(page);
    await page.getByLabel("Nome completo").fill("Ana Exemplo da Silva");
    // Telefone do seed da demonstração (já respondeu).
    await page.getByLabel("Telefone com DDD").fill("98900000001");
    await expect(page.getByLabel("Telefone com DDD")).toHaveValue("(98) 90000-0001");
    await page.getByLabel("Nome completo").focus();
    await expect(page.getByText(/^Você já confirmou em \d{2}\/\d{2}\. Quer atualizar sua resposta\?$/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Manter como está" })).toHaveAttribute("href", "/");

    await page.getByRole("button", { name: "Atualizar minha resposta" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Você vem?" })).toBeFocused();
    await page.getByText("Não poderei ir").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Enviar resposta" }).click();
    await expect(page).toHaveURL(/\/agradecimento\?nome=Ana&resposta=nao$/, DEPOIS_DO_ENVIO);

    const atual = (await respostasDosNoivos(request)).find((r) => r.telefone === "98900000001");
    expect(atual).toMatchObject({ atualizada: true });
  });

  test("falha de rede: mantém o que foi preenchido e oferece “Tentar de novo”", async ({ page }) => {
    await abrirFormulario(page);
    await preencherPasso1(page, "Carla Teste", telefoneNovo().digitado);
    await page.getByText("Não poderei ir").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByLabel("Recado para o casal (opcional)").fill("Um beijo!");

    await page.route("**/api/rsvp", (rota) => rota.abort("internetdisconnected"));
    await page.getByRole("button", { name: "Enviar resposta" }).click();
    await expect(page.locator(".alerta-rsvp[role=alert]")).toContainText("Não conseguimos enviar agora.");
    await expect(page.getByLabel("Recado para o casal (opcional)")).toHaveValue("Um beijo!");
    await expect(page).toHaveURL(/\/confirmar-presenca$/);

    await page.unroute("**/api/rsvp");
    await page.getByRole("button", { name: "Tentar de novo" }).click();
    await expect(page).toHaveURL(/\/agradecimento\?nome=Carla&resposta=nao$/, DEPOIS_DO_ENVIO);
  });

  test("teclado do início ao fim, sem mouse", async ({ page }) => {
    await abrirFormulario(page);
    const focado = () =>
      page.evaluate(
        () => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.textContent ?? "",
      );

    /** Tab até o elemento esperado ficar em foco (no máximo 40 vezes). */
    async function tabAte(alvo: ReturnType<Page["getByRole"]>) {
      for (let i = 0; i < 40; i++) {
        if (await alvo.evaluate((el) => el === document.activeElement)) return;
        await page.keyboard.press("Tab");
      }
      throw new Error(`não chegou ao alvo pelo Tab (último foco: ${await focado()})`);
    }

    await tabAte(page.getByLabel("Nome completo"));
    await page.keyboard.type("Dora Teclado");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Telefone com DDD")).toBeFocused();
    await page.keyboard.type(telefoneNovo().digitado);
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2, name: "Você vem?" })).toBeFocused();

    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await expect(page.getByRole("radio", { name: /Sim, estarei lá/ })).toBeChecked();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2, name: "Os detalhes" })).toBeFocused();

    await tabAte(page.getByRole("button", { name: "Adicionar um acompanhante" }));
    await page.keyboard.press("Enter");
    await tabAte(page.getByLabel("Nome de quem vem (1)"));
    await page.keyboard.type("Elias Teclado");
    await tabAte(page.getByRole("button", { name: "Diorlando" }));
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Quem convidou você?")).toHaveValue("Diorlando");
    await tabAte(page.getByRole("button", { name: "Enviar resposta" }));
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/agradecimento\?nome=Dora$/, DEPOIS_DO_ENVIO);
  });

  test("tocar em “Jaqueline” logo depois de um campo vazio: o erro aparece e o toque não se perde", async ({
    page,
  }) => {
    await abrirFormulario(page);
    await preencherPasso1(page, "Gil Toque", telefoneNovo().digitado);
    await page.getByText("Sim, estarei lá").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Adicionar um acompanhante" }).click();
    await page.getByLabel("Nome de quem vem (1)").focus();
    await page.getByRole("button", { name: "Jaqueline" }).click();
    await expect(page.getByLabel("Quem convidou você?")).toHaveValue("Jaqueline");
    await expect(page.getByRole("button", { name: "Jaqueline" })).toHaveAttribute("aria-pressed", "true");
  });

  test("validação ao sair do campo, com mensagem humana ligada ao campo", async ({ page }) => {
    await abrirFormulario(page);
    const nome = page.getByLabel("Nome completo");
    const telefone = page.getByLabel("Telefone com DDD");
    await nome.focus();
    await telefone.focus();
    await expect(page.getByText("Escreva seu nome completo, por favor.")).toBeVisible();
    await expect(nome).toHaveAttribute("aria-invalid", "true");
    await expect(nome).toHaveAccessibleDescription("Escreva seu nome completo, por favor.");

    await telefone.fill("123");
    await nome.focus();
    await expect(page.getByText("Confira o telefone: DDD + número, como (98) 99967-6346.")).toBeVisible();

    // Continuar com erro não avança e leva o foco ao primeiro campo inválido.
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(nome).toBeFocused();
    await expect(page.getByText("Passo 1 de 3")).toBeVisible();
  });

  test("limite da sessão: depois de 3 envios na aba, nada sai e o WhatsApp é oferecido", async ({ page }) => {
    await abrirFormulario(page);
    await page.evaluate(() => sessionStorage.setItem("convite:rsvp-envios", "3"));
    await preencherPasso1(page, "Eva Limite", telefoneNovo().digitado);
    await page.getByText("Não poderei ir").click();
    await page.getByRole("button", { name: "Continuar" }).click();

    let enviou = false;
    page.on("request", (pedido) => {
      if (pedido.url().endsWith("/api/rsvp")) enviou = true;
    });
    await page.getByRole("button", { name: "Enviar resposta" }).click();
    await expect(page.locator(".alerta-rsvp[role=alert]")).toContainText("Você já enviou algumas respostas por aqui.");
    await expect(page.getByRole("link", { name: "Falar com os noivos no WhatsApp" })).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/5598999676346\?text=/,
    );
    expect(enviou).toBe(false);
  });

  test("no HTML do servidor (antes da hidratação) não há como enviar: dado pessoal nunca vai para a URL", async ({
    request,
  }) => {
    const html = await (await request.get("/confirmar-presenca")).text();
    const formulario = html.match(/<form[^>]*>/)?.[0] ?? "";
    expect(formulario).toContain('method="post"');
    const botao = html.match(/<button[^>]*type="submit"[^>]*>/)?.[0] ?? "";
    expect(botao).toContain("disabled");
  });

  test("o honeypot existe, mas fica fora da tela e fora do Tab", async ({ page }) => {
    await abrirFormulario(page);
    const isca = page.locator('input[name="site"]');
    await expect(isca).toHaveAttribute("tabindex", "-1");
    const caixa = await isca.boundingBox();
    expect((caixa?.x ?? 0) + (caixa?.width ?? 0)).toBeLessThan(0);
  });

  test("passa no axe nos três passos", async ({ page }) => {
    test.slow(); // três análises do axe numa máquina lenta
    const axe = () => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    await abrirFormulario(page);
    expect((await axe()).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    await preencherPasso1(page, "Fábio Axe", telefoneNovo().digitado);
    expect((await axe()).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    await page.getByText("Sim, estarei lá").click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Adicionar um acompanhante" }).click();
    expect((await axe()).violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("/agradecimento", () => {
  test("nome estranho na URL não vira conteúdo: só um primeiro nome limpo", async ({ page }) => {
    await page.goto("/agradecimento?nome=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E");
    await expect(page.getByRole("heading", { level: 1 })).not.toContainText("<");
    await expect(page.locator("main img[src='x']")).toHaveCount(0);
  });

  test("sem nome: “Obrigado!”", async ({ page }) => {
    await page.goto("/agradecimento");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Obrigado!");
  });

  test("com movimento reduzido não há confete", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/agradecimento?nome=Ana");
    await expect(page.locator(".confete")).toBeHidden();
  });

  test("passa no axe", async ({ page }) => {
    test.slow(); // o axe analisa também as peças do confete em animação
    await page.goto("/agradecimento?nome=Ana");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Obrigado, Ana!");
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
