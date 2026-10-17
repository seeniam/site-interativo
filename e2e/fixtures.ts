import { expect, test as base } from "@playwright/test";

/**
 * Todo teste falha se a página lançar erro (ex.: hidratação, React #418) ou logar erro no console.
 * Sem isso, um mismatch de hidratação passa despercebido: o DOM final parece certo.
 */
export const test = base.extend<{ errosDaPagina: string[] }>({
  errosDaPagina: [
    async ({ page }, usar) => {
      const erros: string[] = [];
      page.on("pageerror", (erro) => erros.push(`pageerror: ${erro.message}`));
      page.on("console", (msg) => {
        if (msg.type() === "error") erros.push(`console: ${msg.text()}`);
      });
      await usar(erros);
      expect(erros, "erros de página ou console").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
