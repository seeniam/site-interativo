import fs from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "./fixtures";

const ehCelular = (largura: number | undefined) => (largura ?? 0) < 768;

test.describe("o convite", () => {
  test("herói: nomes, versículo, data por extenso e as duas CTAs", async ({ page }) => {
    await page.goto("/");
    const heroi = page.locator("#heroi");
    await expect(heroi.locator("h1")).toContainText("Jaqueline");
    await expect(heroi.locator("h1")).toContainText("Diorlando");
    await expect(heroi).toContainText("Colossenses 3:14");
    await expect(heroi).toContainText("21 de dezembro de 2026");
    await expect(heroi).toContainText("segunda-feira");
    await expect(heroi).toContainText("16h30");
    await expect(heroi.getByRole("link", { name: "Confirmar presença" })).toHaveAttribute(
      "href",
      "/confirmar-presenca",
    );
    await expect(heroi.getByRole("link", { name: "Presentear" })).toHaveAttribute("href", "/presentear");
  });

  test("a foto do herói é a prioridade de carregamento (LCP)", async ({ page }) => {
    await page.goto("/");
    const foto = page.locator("#heroi img");
    await expect(foto).toHaveAttribute("fetchpriority", "high");
    await expect(foto).toHaveAttribute("loading", "eager");
  });

  test("economia da foto única: exatamente dois enquadramentos no convite (H1)", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const fotos = page.locator('main img[src*="casal"]');
    await expect(fotos).toHaveCount(2);
    await expect(page.locator("#heroi img")).toHaveCount(1);
    await expect(page.locator("figure.recorte img")).toHaveCount(1);
  });

  test("nossa história não é renderizada enquanto os marcos estão a definir", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#historia")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Nossa história" })).toHaveCount(0);
  });

  test("seções na ordem do briefing, cada uma rotulada", async ({ page }) => {
    await page.goto("/");
    const ids = await page.$$eval("main section[id]", (secoes) => secoes.map((s) => s.id));
    expect(ids).toEqual(["heroi", "contagem", "quando-e-onde", "trajes", "presentes", "duvidas"]);
    for (const secao of await page.locator("main section").all()) {
      const rotulo = await secao.getAttribute("aria-labelledby");
      expect(rotulo).toBeTruthy();
      await expect(page.locator(`#${rotulo}`)).toHaveCount(1);
    }
  });

  test("sem scroll horizontal nem elemento vazando em 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const vazando = await page.evaluate(() => {
      const limite = document.documentElement.clientWidth + 0.5;
      return [...document.querySelectorAll("body *")]
        .filter((el): el is HTMLElement => el instanceof HTMLElement)
        .filter((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0 || (r.right <= limite && r.left >= -0.5)) return false;
          // Recortado por um ancestral que cabe na tela (ex.: a foto em scale durante a abertura)? Não vaza.
          for (let pai = el.parentElement; pai; pai = pai.parentElement) {
            const estilo = getComputedStyle(pai);
            if (["hidden", "clip"].includes(estilo.overflowX) || estilo.clipPath !== "none") {
              const rp = pai.getBoundingClientRect();
              if (rp.right <= limite && rp.left >= -0.5) return false;
            }
          }
          return true;
        })
        .map((el) => el.className.toString().slice(0, 60));
    });
    expect(vazando).toEqual([]);
  });

  test("passa no axe (WCAG 2.2 AA)", async ({ page }) => {
    await page.goto("/");
    const resultado = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual(
      [],
    );
  });
});

test.describe("contagem regressiva — os três estados (H4)", () => {
  test("antes: dias, horas, minutos e segundos, e o leitor de tela ouve os dias", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-12-19T17:26:56-03:00"));
    await page.goto("/");
    const contagem = page.locator("#contagem");
    await expect(contagem.locator(".contagem__bloco")).toHaveCount(4);
    await expect(contagem.locator(".contagem__numero").first()).toHaveText("01");
    await expect(contagem.locator(".contagem__numero").nth(1)).toHaveText("23");
    await expect(contagem).toContainText("Faltam 1 dia para o casamento.");
  });

  test("os segundos andam", async ({ page }) => {
    // setFixedTime fixa só o Date; os timers seguem reais, então a contagem relê a hora a cada segundo.
    await page.clock.setFixedTime(new Date("2026-12-19T17:26:56-03:00"));
    await page.goto("/");
    const segundos = page.locator("#contagem .contagem__numero").nth(3);
    await expect(segundos).toHaveText("04");
    await page.clock.setFixedTime(new Date("2026-12-19T17:26:58-03:00"));
    await expect(segundos).toHaveText("02");
  });

  test("no dia: “Hoje é o dia”", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-12-21T10:00:00-03:00"));
    await page.goto("/");
    await expect(page.locator("#contagem")).toContainText("Hoje é o dia");
    await expect(page.locator("#contagem")).toContainText("A gente se encontra às 16h30.");
  });

  test("depois: “Casados desde 21.12.2026”", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2027-01-10T10:00:00-03:00"));
    await page.goto("/");
    await expect(page.locator("#contagem")).toContainText("Casados desde 21.12.2026");
  });
});

test.describe("quando e onde", () => {
  test("card único do Espaço Max com endereço e mapa externo", async ({ page }) => {
    await page.goto("/");
    const secao = page.locator("#quando-e-onde");
    await expect(secao.locator("li")).toHaveCount(1);
    await expect(secao.getByRole("heading", { name: "Espaço Max" })).toBeVisible();
    await expect(secao).toContainText("Av. Dois, 13");
    const mapa = secao.getByRole("link", { name: /Ver no mapa/ });
    await expect(mapa).toHaveAttribute("href", "https://maps.app.goo.gl/B53pcb3Xwk8eaSpu6");
    await expect(mapa).toHaveAttribute("target", "_blank");
    await expect(mapa).toHaveAttribute("rel", /noopener/);
  });

  test("copiar endereço com um toque", async ({ page, context, browserName }) => {
    test.skip(browserName !== "chromium", "permissão de área de transferência do Chromium");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByRole("button", { name: "Copiar endereço" }).click();
    await expect(page.getByText("Endereço copiado")).toBeVisible();
    const copiado = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiado).toBe("Av. Dois, 13 — Casa 5, Quadra, Itapiracó, São Luís — MA, 65054-866");
  });

  test("adicionar à agenda: o .ics baixa com a data e o local certos", async ({ page }) => {
    await page.goto("/");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Baixar para o celular (.ics)" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("casamento-jaqueline-e-diorlando.ics");
    const conteudo = fs.readFileSync((await download.path()) ?? "", "utf8").replace(/\r\n /g, "");
    expect(conteudo).toContain("BEGIN:VCALENDAR");
    expect(conteudo).toContain("DTSTART:20261221T193000Z");
    expect(conteudo).toContain("SUMMARY:Casamento de Jaqueline & Diorlando");
    expect(conteudo).toContain("Espaço Max");
  });

  test("Google Agenda com datas em UTC", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Google Agenda/ });
    const url = new URL((await link.getAttribute("href")) ?? "");
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261221T193000Z/20261222T013000Z");
  });

  test("o mapa embutido só carrega depois do clique", async ({ page }) => {
    // Hermético: o Google não é chamado de verdade no teste.
    await page.route("https://www.google.com/maps**", (rota) =>
      rota.fulfill({ status: 200, contentType: "text/html", body: "<p>mapa</p>" }),
    );
    await page.goto("/");
    await expect(page.locator("#quando-e-onde iframe")).toHaveCount(0);
    await page.getByRole("button", { name: "Mostrar mapa aqui" }).click();
    await expect(page.locator("#quando-e-onde iframe")).toHaveAttribute("title", "Mapa: Espaço Max");
  });
});

test.describe("trajes, presentes, dúvidas e RSVP", () => {
  test("trajes: título, orientação a definir e as cores com nome", async ({ page }) => {
    await page.goto("/");
    const trajes = page.locator("#trajes");
    await expect(trajes).toContainText("Traje social");
    await expect(trajes.locator("[data-pendente]")).toContainText("Orientação de traje");
    await expect(trajes).toContainText("Dourado");
    await expect(trajes).toContainText("Branco");
  });

  test("presentes: as três cotas levam ao PIX de cada uma, e há a lista completa", async ({ page }) => {
    await page.goto("/");
    const presentes = page.locator("#presentes");
    for (const [id, nome, valor] of [
      ["bronze", "Cota Bronze", "150"],
      ["prata", "Cota Prata", "200"],
      ["ouro", "Cota Ouro", "250"],
    ] as const) {
      const link = presentes.getByRole("link", { name: new RegExp(nome) });
      await expect(link).toHaveAttribute("href", `/confirmar-presente/${id}`);
      await expect(link).toContainText(valor);
    }
    await expect(presentes.getByRole("link", { name: "Ver lista completa" })).toHaveAttribute("href", "/presentear");
  });

  test("dúvidas: abrem pelo teclado e avisam que é dia útil", async ({ page }) => {
    await page.goto("/");
    const pergunta = page.locator("#duvidas summary").first();
    await pergunta.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#duvidas details").first()).toHaveAttribute("open", "");
    await expect(page.locator("#duvidas")).toContainText("dia útil");
    await page.keyboard.press("Enter");
    await expect(page.locator("#duvidas details").first()).not.toHaveAttribute("open", /.*/);
  });

  test("faixa do RSVP: prazo a definir e botão grande para confirmar", async ({ page }) => {
    await page.goto("/");
    const faixa = page.locator(".faixa-rsvp");
    // Sem prazo, a frase não vira "Confirme até Prazo para…": aparece só o placeholder.
    await expect(faixa).not.toContainText("Confirme até");
    await expect(faixa.locator("[data-pendente]")).toContainText("Prazo para confirmar presença");
    await expect(faixa.getByRole("link", { name: "Confirmar presença" })).toHaveAttribute(
      "href",
      "/confirmar-presenca",
    );
  });
});

test.describe("movimento e navegação no celular", () => {
  test("a barra inferior some sobre o herói e aparece depois dele", async ({ page }) => {
    test.skip(!ehCelular(page.viewportSize()?.width), "só no celular");
    await page.goto("/");
    const barra = page.locator(".barra-inferior");
    await expect(barra).not.toHaveAttribute("data-visivel", /.*/);
    await page.locator("#quando-e-onde").scrollIntoViewIfNeeded();
    await expect(barra).toHaveAttribute("data-visivel", "");
  });

  test("o recorte de detalhe abre do centro ao entrar na tela, uma vez", async ({ page }) => {
    await page.goto("/");
    const recorte = page.locator("figure.recorte");
    await expect(recorte).not.toHaveAttribute("data-aberto", /.*/);
    await recorte.scrollIntoViewIfNeeded();
    await expect(recorte).toHaveAttribute("data-aberto", "");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(recorte).toHaveAttribute("data-aberto", "");
  });
});

test.describe("detalhes da revisão da Fase 3", () => {
  test("a barra inferior já nasce escondida no HTML do servidor da home (não pisca sobre o herói)", async ({
    page,
  }) => {
    const html = await (await page.request.get("/")).text();
    const barra = /<nav[^>]*class="barra-inferior[^"]*"[^>]*>/.exec(html)?.[0] ?? "";
    expect(barra).not.toBe("");
    expect(barra).not.toContain("data-visivel");
  });

  test.describe("com movimento reduzido", () => {
    test.use({ reducedMotion: "reduce" });

    test("os dígitos só esmaecem (não giram)", async ({ page }) => {
      await page.clock.setFixedTime(new Date("2026-12-19T17:26:56-03:00"));
      await page.goto("/");
      const digito = page.locator("#contagem .contagem__digito--vira").first();
      await expect(digito).toBeVisible();
      expect(await digito.evaluate((el) => getComputedStyle(el).animationName)).toBe("digito-funde");
    });
  });
});
