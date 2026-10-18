/**
 * Guarda estática das regras do Firestore. O teste de verdade (emulador) exige Java +
 * Firebase CLI e está registrado como pendência técnica (T1); até lá, isto impede regressões óbvias.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { telefoneValido } from "@/lib/format";
import { LIMITES } from "@/lib/schemas/limites";

const regras = fs.readFileSync(path.resolve(import.meta.dirname, "../firestore.rules"), "utf8");

function blocoDa(colecao: string): string {
  const inicio = regras.indexOf(`match /${colecao}/{id}`);
  expect(inicio, `bloco de ${colecao}`).toBeGreaterThan(-1);
  return regras.slice(inicio, regras.indexOf("allow update, delete: if false;", inicio) + 40);
}

describe("firestore.rules", () => {
  it.each(["confirmacoes", "presentes_reservados"])("%s: só inclusão (update e delete bloqueados)", (colecao) => {
    const bloco = blocoDa(colecao);
    expect(bloco).toContain("allow create: if");
    expect(bloco).toContain("allow update, delete: if false;");
    expect(bloco).toContain("request.resource.data.criadoEm == request.time");
  });

  it("qualquer outra coleção fica fechada", () => {
    expect(regras).toMatch(/match \/\{documento=\*\*\} \{\s*allow read, write: if false;/);
  });

  it("limites batem com src/lib/schemas/limites.ts", () => {
    const confirmacoes = blocoDa("confirmacoes");
    expect(confirmacoes).toContain(`textoEntre(request.resource.data.nome, 3, ${LIMITES.nome})`);
    expect(confirmacoes).toContain(`textoEntre(request.resource.data.convidadoPor, 0, ${LIMITES.convidadoPor})`);
    expect(confirmacoes).toContain(`textoEntre(request.resource.data.recado, 0, ${LIMITES.recado})`);
    expect(regras).toContain(`lista.size() <= ${LIMITES.acompanhantes}`);
    expect(regras).toContain(`textoEntre(lista[i], 1, ${LIMITES.nomeAcompanhante})`);
    expect(blocoDa("presentes_reservados")).toContain(`presenteId, 1, ${LIMITES.presenteId})`);
  });

  it("todo índice possível da lista de acompanhantes tem o nome conferido", () => {
    for (let i = 0; i < LIMITES.acompanhantes; i++) {
      expect(regras, `índice ${i}`).toContain(`acompanhanteValido(lista, ${i})`);
    }
  });

  it("o formato de telefone das regras é o mesmo do app", () => {
    const formato = /telefone\.matches\('([^']+)'\)/.exec(regras)?.[1];
    expect(formato).toBeDefined();
    const regex = new RegExp(formato ?? "$^");
    for (const tel of ["98999676346", "1132321234", "0000000000", "98899676346", "9862321234", "2032321234"]) {
      expect(regex.test(tel), tel).toBe(telefoneValido(tel));
    }
  });

  it("nenhuma chave de serviço versionada", () => {
    const exemplo = fs.readFileSync(path.resolve(import.meta.dirname, "../.env.example"), "utf8");
    expect(exemplo).not.toMatch(/private_key|client_email|FIREBASE_ADMIN/i);
    // .env.local existe na máquina de quem configura o Firebase — só não pode ir para o git.
    const gitignore = fs.readFileSync(path.resolve(import.meta.dirname, "../.gitignore"), "utf8");
    expect(gitignore).toMatch(/^\.env\*$/m);
  });
});
