import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

test.describe("/design-system", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/design-system");
  });

  test("tem um único h1, seções rotuladas e títulos sem pular nível", async ({ page }) => {
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("Sistema visual");
    for (const secao of await page.locator("main section").all()) {
      const rotulo = await secao.getAttribute("aria-labelledby");
      expect(rotulo).toBeTruthy();
      await expect(page.locator(`#${rotulo}`)).toBeVisible();
    }
    const niveis = await page.$$eval("h1, h2, h3, h4, h5, h6", (els) => els.map((el) => Number(el.tagName[1])));
    const saltos = niveis.filter((nivel, i) => i > 0 && nivel > (niveis[i - 1] ?? 1) + 1);
    expect(saltos).toEqual([]);
  });

  test("passa no axe (WCAG 2.2 AA)", async ({ page }) => {
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("não é indexada por buscadores", async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("declara pt-BR e tema claro", async ({ page }) => {
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    const esquema = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    expect(esquema).toBe("light");
  });

  test("sem scroll horizontal, inclusive em 320px", async ({ page }) => {
    for (const largura of [320, page.viewportSize()?.width ?? 390]) {
      await page.setViewportSize({ width: largura, height: 800 });
      const transbordo = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(transbordo, `largura ${largura}`).toBeLessThanOrEqual(0);
    }
  });

  // O body usa overflow-x: clip, que esconde o scroll mas corta o conteúdo.
  // Este teste pega o que o anterior não vê: qualquer elemento visível saindo da tela.
  test("nenhum elemento ultrapassa a largura da tela, inclusive em 320px", async ({ page }) => {
    for (const largura of [320, page.viewportSize()?.width ?? 390]) {
      await page.setViewportSize({ width: largura, height: 800 });
      const vazando = await page.evaluate(() => {
        const limite = document.documentElement.clientWidth + 0.5;
        return [...document.querySelectorAll("body *")]
          .filter((el): el is HTMLElement => el instanceof HTMLElement)
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.right > limite || r.left < -0.5);
          })
          .map((el) => `${el.tagName.toLowerCase()}.${el.className}`.slice(0, 80));
      });
      expect(vazando, `largura ${largura}`).toEqual([]);
    }
  });

  test("alvos de toque têm pelo menos 44×44px", async ({ page }) => {
    const pequenos = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("a[href], button")]
        .filter((el) => el.offsetParent !== null)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { texto: el.textContent?.trim() ?? "", largura: Math.round(r.width), altura: Math.round(r.height) };
        })
        .filter((alvo) => alvo.largura < 44 || alvo.altura < 44),
    );
    expect(pequenos).toEqual([]);
  });

  test("toda imagem tem alt (vazio só quando decorativa)", async ({ page }) => {
    expect(await page.locator("img:not([alt])").count()).toBe(0);
  });

  test("o monograma tem nome acessível do casal", async ({ page }) => {
    await expect(page.getByRole("img", { name: "Jaqueline & Diorlando" }).first()).toBeVisible();
  });

  test("todo elemento focável mostra o anel em --ouro-escuro, 2px com 2px de folga", async ({ page }) => {
    const totalFocaveis = await page.evaluate(
      () =>
        [...document.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].filter(
          (el) => el.offsetParent !== null,
        ).length,
    );
    expect(totalFocaveis).toBeGreaterThan(10);

    const semAnel: string[] = [];
    for (let i = 0; i < totalFocaveis; i++) {
      await page.keyboard.press("Tab");
      const foco = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const estilo = getComputedStyle(el);
        return {
          rotulo: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40),
          ok:
            estilo.outlineStyle === "solid" &&
            estilo.outlineWidth === "2px" &&
            estilo.outlineOffset === "2px" &&
            estilo.outlineColor === "rgb(140, 107, 47)",
        };
      });
      if (foco && !foco.ok) semAnel.push(foco.rotulo);
    }
    expect(semAnel).toEqual([]);
  });

  test("“Desenhar de novo” reinicia o monograma", async ({ page }) => {
    const preenchimento = () =>
      page
        .locator("#monograma svg[role=img] > path")
        .first()
        .evaluate((el) => Number(getComputedStyle(el).fillOpacity));

    await expect.poll(preenchimento, { timeout: 5_000 }).toBe(1);
    await page.getByRole("button", { name: "Desenhar de novo" }).click();
    expect(await preenchimento()).toBeLessThan(0.5);
    await expect.poll(preenchimento, { timeout: 5_000 }).toBe(1);
  });

  test("dado pendente aparece como placeholder, nunca como 'undefined'", async ({ page }) => {
    await expect(page.locator("[data-pendente]").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText("undefined");
    await expect(page.locator("body")).not.toContainText("[object Object]");
  });

  test("botão desabilitado não recebe clique", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Já presenteado" })).toBeDisabled();
  });

  test("botão carregando não envia formulário nem por clique nem por Enter", async ({ page }) => {
    // Um form de teste com o mesmo botão "Carregando" renderizado pelo componente real.
    await page.evaluate(() => {
      const original = document.querySelector<HTMLButtonElement>('button[aria-busy="true"]');
      if (!original) throw new Error("Nenhum botão carregando na página");
      const form = document.createElement("form");
      form.id = "form-teste";
      form.dataset.envios = "0";
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        form.dataset.envios = String(Number(form.dataset.envios) + 1);
      });
      const botao = original.cloneNode(true) as HTMLButtonElement;
      botao.id = "botao-teste";
      const [a, b] = [document.createElement("input"), document.createElement("input")];
      a.id = "campo-teste";
      form.append(a, b, botao);
      document.body.append(form);
    });
    // force: o Playwright não clica em aria-disabled; aqui simulamos o clique insistente do usuário.
    await page.locator("#botao-teste").click({ force: true });
    await page.locator("#campo-teste").press("Enter");
    await expect(page.locator("#form-teste")).toHaveAttribute("data-envios", "0");
  });
});

test.describe("movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  test("o monograma aparece sem traçado animado e sem erro de hidratação", async ({ page }) => {
    await page.goto("/design-system");
    const palco = page.locator("#monograma svg[role=img]").first();
    await expect(palco).toBeVisible();
    await expect(palco.locator("clipPath")).toHaveCount(0);
  });
});
