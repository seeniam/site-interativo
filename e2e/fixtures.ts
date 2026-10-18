import { expect, test as base } from "@playwright/test";

/**
 * Rotas que os links já apontam mas que só existem em fases futuras (DECISOES L4).
 * O prefetch delas responde 404 — tolerado só para estas. Remover cada uma quando a fase chegar.
 */
const ROTAS_FUTURAS = ["/convidados", "/favicon.ico"];

const ehRotaFutura = (url: string) => {
  const caminho = new URL(url).pathname;
  return ROTAS_FUTURAS.some((rota) => (rota.endsWith("/*") ? caminho.startsWith(rota.slice(0, -1)) : caminho === rota));
};

/**
 * Todo teste falha se a página lançar erro (ex.: hidratação, React #418), logar erro no console,
 * ou se algum recurso responder 404 fora das rotas futuras e da navegação principal
 * (teste que visita um 404 de propósito não conta).
 */
export const test = base.extend<{ errosDaPagina: string[] }>({
  errosDaPagina: [
    async ({ page }, usar) => {
      const erros: string[] = [];
      page.on("pageerror", (erro) => erros.push(`pageerror: ${erro.message}`));
      page.on("console", (msg) => {
        // 404 de recurso é conferido abaixo, pela URL — a mensagem do console não traz a URL.
        if (msg.type() === "error" && !msg.text().startsWith("Failed to load resource")) {
          erros.push(`console: ${msg.text()}`);
        }
      });
      page.on("response", (resposta) => {
        const pedido = resposta.request();
        const navegacaoPrincipal = pedido.isNavigationRequest() && pedido.frame() === page.mainFrame();
        if (resposta.status() >= 400 && !navegacaoPrincipal && !ehRotaFutura(resposta.url())) {
          erros.push(`${resposta.status()}: ${resposta.url()}`);
        }
      });
      await usar(erros);
      expect(erros, "erros de página, console ou recurso").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
