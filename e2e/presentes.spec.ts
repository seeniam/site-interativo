import AxeBuilder from "@axe-core/playwright";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { crcConfere, lerCamposPix } from "../src/lib/pix";
import { expect, test } from "./fixtures";

test.describe("/presentear", () => {
  test("três cotas como três planos, cada uma com seu ícone, a Ouro em destaque", async ({ page }) => {
    await page.goto("/presentear");
    await expect(page.locator("h1")).toHaveText("Presentear");
    // Sem parágrafo de apoio abaixo do título (retirado a pedido do cliente, DECISOES B4).
    await expect(page.locator("main")).not.toContainText(/faça o PIX na hora|começar a nossa casa/);
    const planos = page.locator(".planos-cotas > li");
    await expect(planos).toHaveCount(3);
    await expect(planos.nth(2)).toHaveAttribute("data-destaque", "");
    const icones = await planos.evaluateAll((itens) =>
      itens.map((li) => li.querySelector("svg.icone-marca")?.innerHTML),
    );
    expect(new Set(icones).size).toBe(3);
    for (const [i, id] of ["bronze", "prata", "ouro"].entries()) {
      await expect(planos.nth(i).getByRole("link", { name: /Presentear/ })).toHaveAttribute(
        "href",
        `/confirmar-presente/${id}`,
      );
    }
  });

  test("filtro por faixa de valor (chips)", async ({ page }) => {
    await page.goto("/presentear");
    const planos = page.locator(".planos-cotas > li");
    await page.getByRole("button", { name: /Até/ }).click();
    await expect(page.getByRole("button", { name: /Até/ })).toHaveAttribute("aria-pressed", "true");
    await expect(planos).toHaveCount(2);
    await page.getByRole("button", { name: /Acima/ }).click();
    await expect(planos).toHaveCount(1);
    await expect(planos.first()).toContainText("Cota Ouro");
    await page.getByRole("button", { name: "Todos" }).click();
    await expect(planos).toHaveCount(3);
  });

  test("“Prefere outro valor?” abre o WhatsApp dos noivos", async ({ page }) => {
    await page.goto("/presentear");
    const link = page.getByRole("link", { name: /Fale com a gente/ });
    const url = new URL((await link.getAttribute("href")) ?? "");
    expect(url.origin + url.pathname).toBe("https://wa.me/5598999676346");
    expect(url.searchParams.get("text")).toContain("outro valor");
  });

  test("passa no axe", async ({ page }) => {
    await page.goto("/presentear");
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});

test.describe("escolher presente → copiar código → abrir WhatsApp", () => {
  test("o fluxo completo da Cota Ouro", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "área de transferência do Chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/presentear");
    await page
      .locator(".planos-cotas > li")
      .nth(2)
      .getByRole("link", { name: /Presentear/ })
      .click();
    await expect(page).toHaveURL(/\/confirmar-presente\/ouro$/);
    // getByRole: com cacheComponents o Next mantém a rota anterior montada e oculta (<Activity>).
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cota Ouro");

    const codigo = (await page.locator("[data-codigo-pix]").textContent()) ?? "";
    await page.getByRole("button", { name: "Copiar código PIX" }).click();
    await expect(page.getByText("Código copiado").first()).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(codigo);

    const whatsapp = new URL((await page.locator("[data-comprovante]").getAttribute("href")) ?? "");
    expect(whatsapp.origin + whatsapp.pathname).toBe("https://wa.me/5598999676346");
    const texto = whatsapp.searchParams.get("text") ?? "";
    // O Intl separa "R$" do número com espaço inseparável; o resto da frase usa espaço comum.
    expect(texto).toContain("Presente: Cota Ouro (R$\u00A0250)");
    expect(texto.endsWith("Meu nome: ")).toBe(true);
  });
});

test.describe("tela do PIX: o código e o QR batem com lib/pix.ts", () => {
  for (const [id, valor] of [
    ["bronze", "150.00"],
    ["prata", "200.00"],
    ["ouro", "250.00"],
  ] as const) {
    test(`${id}: payload válido, com valor, chave em +55 e recebedora confirmada`, async ({ page }) => {
      await page.goto(`/confirmar-presente/${id}`);
      const codigo = (await page.locator("[data-codigo-pix]").textContent()) ?? "";
      expect(crcConfere(codigo)).toBe(true);
      const campos = lerCamposPix(codigo);
      expect(campos.get("54")).toBe(valor);
      expect(campos.get("59")).toBe("JAQUELINE BARROS ALVARES");
      expect(campos.get("60")).toBe("SAO LUIS");
      expect(lerCamposPix(campos.get("26") ?? "").get("01")).toBe("+5598999676346");
      expect(lerCamposPix(campos.get("62") ?? "").get("05")).toBe(id.toUpperCase());
    });
  }

  test("o QR desenhado na tela, lido de volta com jsqr, é o mesmo código copia-e-cola", async ({ page }) => {
    await page.goto("/confirmar-presente/ouro");
    const qr = page.locator(".qr-pix__codigo svg");
    await expect(qr).toBeVisible();
    const png = PNG.sync.read(await qr.screenshot());
    const lido = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
    expect(lido).toBe((await page.locator("[data-codigo-pix]").textContent()) ?? "");
  });

  test("passo a passo em três linhas e caminho de volta", async ({ page }) => {
    await page.goto("/confirmar-presente/prata");
    await expect(page.locator(".passos-pix:visible li")).toHaveCount(3);
    await expect(page.getByRole("link", { name: "Escolher outro presente" })).toHaveAttribute("href", "/presentear");
  });

  test("id inválido → 404 com a identidade do site", async ({ page }) => {
    const resposta = await page.goto("/confirmar-presente/diamante");
    expect(resposta?.status()).toBe(404);
    await expect(page.locator("h1")).toHaveText("Esta página não existe no nosso convite");
  });

  test("passa no axe", async ({ page }) => {
    await page.goto("/confirmar-presente/ouro");
    await expect(page.locator(".qr-pix__codigo svg")).toBeVisible();
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
});
