/**
 * Higiene do código (briefing, papel de Staff Engineer):
 * nenhum TODO/FIXME esquecido e nenhum emoji na interface (o `any` é barrado pelo ESLint).
 * Marcadores em MAIÚSCULAS — "todo" em português é palavra comum.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = path.resolve(import.meta.dirname, "..");

function arquivos(pasta: string): string[] {
  return fs
    .readdirSync(path.join(RAIZ, pasta), { withFileTypes: true, recursive: true })
    .flatMap((e) =>
      e.isFile() && /\.(tsx?|css)$/.test(e.name) && !e.name.endsWith(".test.ts")
        ? [path.join(e.parentPath, e.name)]
        : [],
    );
}

const fontes = [...arquivos("src"), ...arquivos("scripts")];

describe("higiene", () => {
  it("encontra os arquivos-fonte", () => {
    expect(fontes.length).toBeGreaterThan(10);
  });

  it.each(fontes.map((f) => [path.relative(RAIZ, f), f]))("%s não tem TODO/FIXME", (_rel, arquivo) => {
    expect(fs.readFileSync(arquivo, "utf8")).not.toMatch(/\b(TODO|FIXME|XXX|HACK)\b/);
  });

  // Única exceção: a mensagem que o convidado envia pelo WhatsApp — texto do casal, fora da interface (DECISOES G7).
  it.each(fontes.map((f) => [path.relative(RAIZ, f), f]))("%s não tem emoji", (_rel, arquivo) => {
    const naInterface = fs
      .readFileSync(arquivo, "utf8")
      .split("\n")
      .filter((linha) => !/^\s*mensagemComprovante:/.test(linha))
      .join("\n");
    expect(naInterface).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
