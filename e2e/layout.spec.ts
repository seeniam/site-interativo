import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const ITENS = [
  { rotulo: "Convite", href: "/" },
  { rotulo: "Presentear", href: "/presentear" },
  { rotulo: "Confirmar", href: "/confirmar-presenca" },
];

const ehCelular = (largura: number | undefined) => (largura ?? 0) < 768;

test.describe("navegação", () => {
  test("celular: barra inferior com as três ações; sem cabeçalho", async ({ page }) => {
    test.skip(!ehCelular(page.viewportSize()?.width), "só no celular");
    await page.goto("/");
    const barra = page.locator(".barra-inferior");
    await expect(barra).toBeVisible();
    await expect(barra).toHaveAttribute("data-visivel", "");
    for (const item of ITENS) {
      await expect(barra.getByRole("link", { name: item.rotulo })).toHaveAttribute("href", item.href);
    }
    await expect(barra.getByRole("link", { name: "Convite" })).toHaveAttribute("aria-current", "page");
    await expect(page.locator(".cabecalho")).toBeHidden();
  });

  test("celular: a barra fica dentro da tela e com alvos de toque grandes", async ({ page }) => {
    test.skip(!ehCelular(page.viewportSize()?.width), "só no celular");
    await page.goto("/");
    for (const link of await page.locator(".barra-inferior a").all()) {
      const caixa = await link.boundingBox();
      expect(caixa?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect(caixa?.width ?? 0).toBeGreaterThanOrEqual(44);
    }
    const barra = await page.locator(".barra-inferior").boundingBox();
    expect((barra?.y ?? 0) + (barra?.height ?? 0)).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
  });

  test("desktop: cabeçalho com os links e o botão de confirmar; sem barra inferior", async ({ page }) => {
    test.skip(ehCelular(page.viewportSize()?.width), "só a partir de 768px");
    await page.goto("/");
    const cabecalho = page.locator(".cabecalho");
    await expect(cabecalho).toBeVisible();
    await expect(cabecalho.getByRole("link", { name: "Presentear" })).toHaveAttribute("href", "/presentear");
    await expect(cabecalho.getByRole("link", { name: "Confirmar presença" })).toHaveAttribute(
      "href",
      "/confirmar-presenca",
    );
    await expect(cabecalho.getByRole("link", { name: /Voltar ao início/ })).toHaveAttribute("href", "/");
    await expect(page.locator(".barra-inferior")).toBeHidden();
  });

  test("desktop: o cabeçalho encolhe ao rolar e volta no topo", async ({ page }) => {
    test.skip(ehCelular(page.viewportSize()?.width), "só a partir de 768px");
    await page.goto("/");
    const cabecalho = page.locator(".cabecalho");
    await expect(cabecalho).not.toHaveAttribute("data-encolhido", /.*/);
    const alturaInicial = (await cabecalho.boundingBox())?.height ?? 0;
    await page.evaluate(() => window.scrollTo(0, 400));
    await expect(cabecalho).toHaveAttribute("data-encolhido", "");
    await expect.poll(async () => (await cabecalho.boundingBox())?.height ?? 0).toBeLessThan(alturaInicial);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(cabecalho).not.toHaveAttribute("data-encolhido", /.*/);
  });

  test("“Convite” leva à home a partir de outra rota", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");
    await page.getByRole("link", { name: "Voltar ao convite" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("rodapé", () => {
  test("monograma, assinatura, link discreto para /convidados e crédito da foto", async ({ page }) => {
    await page.goto("/");
    const rodape = page.locator("footer");
    await expect(rodape).toContainText("com amor, Jaqueline & Diorlando");
    await expect(rodape.getByRole("link", { name: "Lista de convidados" })).toHaveAttribute("href", "/convidados");
    await expect(rodape).toContainText("Foto: arquivo do casal");
  });
});

test.describe("acessibilidade do layout", () => {
  test("Tab primeiro mostra “Pular para o conteúdo”, que leva ao conteúdo", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const pular = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(pular).toBeFocused();
    await expect(pular).toBeInViewport();
    await page.keyboard.press("Enter");
    await expect(page.locator("#conteudo")).toBeFocused();
  });

  test("home: um h1, main e nav rotulados, e passa no axe", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main#conteudo")).toHaveCount(1);
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("404", () => {
  test("responde 404 com a identidade e caminho de volta", async ({ page }) => {
    const resposta = await page.goto("/nao-existe-no-convite");
    expect(resposta?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("Esta página não existe no nosso convite");
    await expect(page.locator("svg[aria-hidden]").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar ao convite" })).toHaveAttribute("href", "/");
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
  });
});

test.describe("abertura do convite", () => {
  test("na primeira visita da sessão, desenha e some sozinha", async ({ page }) => {
    // Registra se o atributo apareceu, mesmo que o carregamento demore mais que a animação.
    await page.addInitScript(() => {
      new MutationObserver(() => {
        if (document.documentElement.hasAttribute("data-abertura")) {
          (window as unknown as { aberturaApareceu: boolean }).aberturaApareceu = true;
        }
      }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-abertura"] });
    });
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { aberturaApareceu?: boolean }).aberturaApareceu))
      .toBe(true);
    await expect(page.locator(".abertura")).toBeHidden({ timeout: 4000 });
    await expect(page.locator("html")).not.toHaveAttribute("data-abertura", /.*/, { timeout: 4000 });
  });

  test("não se repete na mesma sessão", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".abertura")).toBeHidden({ timeout: 4000 });
    await page.reload();
    await expect(page.locator("html")).not.toHaveAttribute("data-abertura", /.*/);
    await expect(page.locator(".abertura")).toBeHidden();
  });

  test("só na home: outra rota não abre", async ({ page }) => {
    await page.goto("/nao-existe");
    await expect(page.locator("html")).not.toHaveAttribute("data-abertura", /.*/);
  });

  test.describe("com movimento reduzido", () => {
    test.use({ reducedMotion: "reduce" });

    test("não há abertura", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("html")).not.toHaveAttribute("data-abertura", /.*/);
      await expect(page.locator(".abertura")).toBeHidden();
    });
  });
});
