import sharp from "sharp";
import { expect, test } from "./fixtures";

/**
 * Fase 7 (briefing 10): QA final. Roda uma vez (no projeto desktop) — cada teste escolhe as
 * próprias larguras.
 */
test.skip(({ viewport }) => viewport?.width !== 1440, "roda uma vez só");

const ROTAS = [
  "/?abertura=0",
  "/presentear",
  "/confirmar-presente/ouro",
  "/confirmar-presenca",
  "/agradecimento?nome=Ana",
  "/convidados",
  "/uma-pagina-que-nao-existe",
];

test("sem rolagem horizontal em 320, 390, 768, 1024 e 1440 (briefing 7.7)", async ({ page }) => {
  test.slow();
  const estouros: string[] = [];
  for (const largura of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width: largura, height: 800 });
    for (const rota of ROTAS) {
      await page.goto(rota);
      await page.waitForLoadState("networkidle");
      const excesso = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (excesso > 0) estouros.push(`${rota} @${largura}px: +${excesso}px`);
    }
  }
  expect(estouros).toEqual([]);
});

test("robots.txt: convite liberado; lista dos noivos, API e design-system fora", async ({ request }) => {
  const texto = await (await request.get("/robots.txt")).text();
  expect(texto).toMatch(/Allow: \/\s/);
  for (const caminho of ["/convidados", "/api/", "/design-system"]) expect(texto).toContain(`Disallow: ${caminho}`);
  expect(texto).toMatch(/Sitemap: https?:\/\/.+\/sitemap\.xml/);
});

test("sitemap.xml só com as páginas públicas", async ({ request }) => {
  const texto = await (await request.get("/sitemap.xml")).text();
  const urls = [...texto.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1] ?? "").pathname);
  expect(urls).toEqual(["/", "/presentear", "/confirmar-presenca"]);
});

test("manifest com nome, cor de papel e ícones que existem", async ({ request }) => {
  const manifest = (await (await request.get("/manifest.webmanifest")).json()) as {
    name: string;
    theme_color: string;
    icons: { src: string; sizes: string }[];
  };
  expect(manifest.name).toBe("Jaqueline & Diorlando");
  expect(manifest.theme_color.toUpperCase()).toBe("#FCFAF7");
  for (const icone of manifest.icons) {
    const resposta = await request.get(icone.src);
    expect(resposta.status(), icone.src).toBe(200);
    const { width, height } = await sharp(await resposta.body()).metadata();
    expect(`${width}x${height}`).toBe(icone.sizes);
  }
});

test("cabeça da página: favicon do monograma, theme-color e cartão de compartilhamento", async ({ page, request }) => {
  await page.goto("/?abertura=0");
  await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", /#fcfaf7/i);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "pt_BR");

  const og = (await page.locator('meta[property="og:image"]').getAttribute("content")) ?? "";
  expect(og).toMatch(/^https?:\/\//);
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute("content", /Jaqueline & Diorlando/);
  // O cartão é servido pelo próprio site (o domínio do og:image é o de produção).
  const imagem = await request.get(new URL(og).pathname);
  expect(imagem.headers()["content-type"]).toContain("image/jpeg");
  const corpo = await imagem.body();
  // O WhatsApp descarta prévia pesada: o cartão fica bem abaixo de 300 KB.
  expect(corpo.byteLength).toBeLessThan(300 * 1024);
  const { width, height } = await sharp(corpo).metadata();
  expect([width, height]).toEqual([1200, 630]);
});

test("PROIBIDOS (seção 9): nenhum <select> no formulário de presença", async ({ page }) => {
  await page.goto("/confirmar-presenca");
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
  await expect(page.locator("select")).toHaveCount(0);
});

test("endereço com percent-encoding quebrado: 404, nunca 500 (revisão de código)", async ({ request }) => {
  expect((await request.get("/confirmar-presente/%E0%A4%A")).status()).toBe(404);
  const cookieQuebrado = { headers: { cookie: "sessao_noivos=%zz" } };
  expect((await request.get("/api/convidados", cookieQuebrado)).status()).toBe(401);
  expect((await request.get("/convidados", cookieQuebrado)).status()).toBe(200);
});

test("contagem regressiva em 320px: nem rótulos nem números se encostam", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/?abertura=0");
  for (const seletor of [".contagem__bloco .versalete", ".contagem__numero"]) {
    const rotulos = page.locator(seletor);
    await expect(rotulos).toHaveCount(4);
    const caixas = await rotulos.evaluateAll((els) =>
      els.map((el) => {
        const faixa = document.createRange();
        faixa.selectNodeContents(el);
        const r = faixa.getBoundingClientRect();
        return { esquerda: r.left, direita: r.right };
      }),
    );
    for (let i = 1; i < caixas.length; i++) {
      expect(
        (caixas[i]?.esquerda ?? 0) - (caixas[i - 1]?.direita ?? 0),
        `${seletor}: entre o ${i}º e o ${i + 1}º`,
      ).toBeGreaterThanOrEqual(seletor === ".contagem__numero" ? 10 : 4);
    }
  }
});
