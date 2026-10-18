import { expect, test } from "./fixtures";

/**
 * Orçamento de performance (briefing 8) — determinístico, ao contrário da nota do Lighthouse,
 * que nesta máquina varia de rodada para rodada (DECISOES H13). Reprova regressões de peso.
 */
const ORCAMENTO = {
  /** JavaScript transferido (comprimido) na carga da home — só o da própria home. */
  jsKB: 190,
  /**
   * Home + o JS das rotas vizinhas que o roteador pré-carrega depois da carga, em baixa
   * prioridade (/presentear e /confirmar-presenca) — o que faz o botão "Confirmar" abrir na hora.
   */
  jsComVizinhasKB: 260,
  /** Arquivos de fonte baixados na carga. */
  fontes: 4,
  fontesKB: 140,
  /** Nenhuma imagem acima de 300 KB depois da otimização (briefing 8). */
  imagemKB: 300,
};

/** Pré-carregamento de rota do roteador do Next (payload RSC de rota vizinha). */
const ehPrefetchDeRota = (url: string, cabecalhos: Record<string, string>) =>
  url.includes("_rsc=") || cabecalhos["next-router-prefetch"] !== undefined;

const somaJs = (recursos: Recurso[]) =>
  Math.round(recursos.filter((r) => r.nome.endsWith(".js")).reduce((t, r) => t + r.kb, 0));

interface Recurso {
  nome: string;
  tipo: string;
  kb: number;
}

test.describe("orçamento de performance da home", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "transferSize do Chromium");

  test("JavaScript, fontes e imagens dentro do orçamento, e sem salto de layout", async ({ page }) => {
    // O pré-carregamento das rotas vizinhas é medido no teste seguinte; aqui, só a home.
    await page.route("**/*", (rota) =>
      ehPrefetchDeRota(rota.request().url(), rota.request().headers()) ? rota.abort() : rota.continue(),
    );
    await page.addInitScript(() => {
      (window as unknown as { saltos: number }).saltos = 0;
      new PerformanceObserver((lista) => {
        for (const e of lista.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
          if (!e.hadRecentInput) (window as unknown as { saltos: number }).saltos += e.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/?abertura=0", { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    const recursos: Recurso[] = await page.evaluate(() =>
      (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).map((r) => ({
        nome: r.name,
        tipo: r.initiatorType,
        kb: r.transferSize / 1024,
      })),
    );
    const js = recursos.filter((r) => r.nome.endsWith(".js"));
    const fontes = recursos.filter((r) => r.nome.endsWith(".woff2"));
    const imagens = recursos.filter((r) => r.nome.includes("/_next/image"));
    const soma = (lista: Recurso[]) => Math.round(lista.reduce((t, r) => t + r.kb, 0));

    expect(soma(js), "JS transferido (KB)").toBeLessThanOrEqual(ORCAMENTO.jsKB);
    expect(fontes.length, "arquivos de fonte").toBeLessThanOrEqual(ORCAMENTO.fontes);
    expect(soma(fontes), "fontes (KB)").toBeLessThanOrEqual(ORCAMENTO.fontesKB);
    for (const imagem of imagens) {
      expect(imagem.kb, imagem.nome).toBeLessThanOrEqual(ORCAMENTO.imagemKB);
    }
    const saltos = await page.evaluate(() => (window as unknown as { saltos: number }).saltos);
    expect(saltos, "CLS").toBeLessThan(0.01);
  });

  test("com o pré-carregamento das rotas vizinhas, o total ainda cabe no teto", async ({ page }) => {
    await page.goto("/?abertura=0", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const recursos: Recurso[] = await page.evaluate(() =>
      (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).map((r) => ({
        nome: r.name,
        tipo: r.initiatorType,
        kb: r.transferSize / 1024,
      })),
    );
    expect(somaJs(recursos), "JS com as rotas vizinhas (KB)").toBeLessThanOrEqual(ORCAMENTO.jsComVizinhasKB);
  });

  test("a fonte de assinatura (Pinyon) não é baixada: o “&” e a assinatura são contornos", async ({ page }) => {
    await page.goto("/?abertura=0", { waitUntil: "networkidle" });
    const css = await page.evaluate(() =>
      [...document.styleSheets].flatMap((folha) => {
        try {
          return [...folha.cssRules].map((regra) => regra.cssText);
        } catch {
          return [];
        }
      }),
    );
    expect(css.join("\n")).not.toMatch(/Pinyon/i);
  });
});
