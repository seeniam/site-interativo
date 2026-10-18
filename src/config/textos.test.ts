import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { textos } from "./textos";

describe("vocabulário obrigatório (briefing 4)", () => {
  it("'a definir' e 'a confirmar' são os textos dos selos, e diferentes", () => {
    expect(textos.pendente.selo).toBe("a definir");
    expect(textos.aConfirmar.selo).toBe("a confirmar");
  });

  it("nenhum componente escreve o termo à mão (vem sempre de textos.ts)", () => {
    const raiz = path.resolve(import.meta.dirname, "..");
    const arquivos = fs
      .readdirSync(raiz, { recursive: true, withFileTypes: true })
      // O /design-system é documentação interna e pode nomear os estados (DECISOES G8).
      .filter((e) => e.isFile() && /\.tsx$/.test(e.name) && !e.parentPath.includes("design-system"))
      .map((e) => path.join(e.parentPath, e.name));
    for (const arquivo of arquivos) {
      // Comentários podem citar o termo; o que não pode é texto visível escrito à mão.
      const fonte = fs
        .readFileSync(arquivo, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(fonte, path.relative(raiz, arquivo)).not.toMatch(/["'>]\s*a (definir|confirmar)\s*["'<]/i);
    }
  });
});
