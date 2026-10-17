/**
 * Guarda da identidade: os tokens de cor em globals.css batem com o briefing (3.2),
 * a documentação do /design-system e o gradiente do SVG não divergem deles, e todo par
 * texto/fundo usado na interface passa no contraste AA (briefing 7.1).
 */
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COR_PAPEL } from "@/lib/tokens";
import { GRUPOS_DE_COR } from "./design-system/_componentes/paleta";

const css = fs.readFileSync(path.join(import.meta.dirname, "globals.css"), "utf8");
const raiz = css.slice(css.indexOf(":root"), css.indexOf("@theme"));

/** Valor cru de um token em :root (hex ou rgba). */
function valorCru(nome: string): string {
  const achado = new RegExp(`--${nome}:\\s*([^;]+);`).exec(raiz);
  if (!achado?.[1]) throw new Error(`Token --${nome} não encontrado em :root`);
  return achado[1].trim();
}

/** Token de cor sólida, normalizado em maiúsculas. */
function token(nome: string): string {
  const valor = valorCru(nome);
  if (!/^#[0-9a-fA-F]{6}$/.test(valor)) throw new Error(`--${nome} não é hex sólido: ${valor}`);
  return valor.toUpperCase();
}

/** Normaliza "rgba(23,20,15,.10)" e "rgba(23, 20, 15, 0.1)" para comparar. */
function rgba(valor: string): string {
  const numeros = valor.match(/[\d.]+/g)?.map(Number) ?? [];
  return `rgba(${numeros.join(",")})`;
}

/** Blocos "seletor { declarações }" do CSS (os mais internos, sem aninhamento). */
function blocos(fonte: string): { seletor: string; corpo: string }[] {
  return [...fonte.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    seletor: (m[1] ?? "").trim(),
    corpo: m[2] ?? "",
  }));
}

function luminancia(hex: string): number {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (claro + 0.05) / (escuro + 0.05);
}

const BRIEFING: Record<string, string> = {
  branco: "#FFFFFF",
  papel: "#FCFAF7",
  linho: "#F4EFE7",
  ouro: "#C9A227",
  "ouro-claro": "#E8D08A",
  "ouro-escuro": "#8C6B2F",
  champanhe: "#F7EEDC",
  tinta: "#17140F",
  fumaca: "#6E675C",
  sucesso: "#4F7A4A",
  recusa: "#9A5B4C",
};

describe("tokens de cor", () => {
  it.each(Object.entries(BRIEFING))("--%s é %s, como no briefing", (nome, hex) => {
    expect(token(nome)).toBe(hex);
  });

  it("--borda é rgba(23,20,15,.10), como no briefing", () => {
    expect(rgba(valorCru("borda"))).toBe(rgba("rgba(23,20,15,.10)"));
  });

  it("a paleta documentada no /design-system é a mesma do CSS", () => {
    for (const cor of GRUPOS_DE_COR.flatMap((g) => g.cores)) {
      const real = valorCru(cor.token);
      if (real.startsWith("rgba")) expect(rgba(real), cor.token).toBe(rgba(cor.hex));
      else expect(token(cor.token), cor.token).toBe(cor.hex);
    }
  });

  it("a cor de tema do navegador (theme-color) é o --papel", () => {
    expect(COR_PAPEL.toUpperCase()).toBe(token("papel"));
  });

  it("o gradiente-ouro do SVG tem as mesmas paradas do CSS", () => {
    const doCss = [...valorCru("gradiente-ouro").matchAll(/(#[0-9a-fA-F]{6})\s+([\d.]+)%/g)].map((m) => [
      (m[1] ?? "").toUpperCase(),
      Number(m[2]) / 100,
    ]);
    const svg = fs.readFileSync(path.join(import.meta.dirname, "../components/brand/GradienteOuroSvg.tsx"), "utf8");
    const doSvg = [...svg.matchAll(/offset="([\d.]+)" stopColor="(#[0-9a-fA-F]{6})"/g)].map((m) => [
      (m[2] ?? "").toUpperCase(),
      Number(m[1]),
    ]);
    expect(doCss).toHaveLength(5);
    expect(doSvg).toEqual(doCss);
  });

  it("não há modo escuro: color-scheme é light", () => {
    expect(css).toMatch(/color-scheme:\s*light/);
    expect(css).not.toMatch(/prefers-color-scheme:\s*dark/);
  });
});

/** Todo par [texto, fundo] que a interface usa hoje. Texto pequeno → AA = 4.5. */
const PARES: readonly [texto: string, fundo: string, onde: string][] = [
  ["tinta", "papel", "texto corrido"],
  ["tinta", "branco", "cards"],
  ["tinta", "linho", "seções alternadas"],
  ["fumaca", "papel", "texto secundário"],
  ["fumaca", "branco", "texto secundário em card"],
  ["fumaca", "linho", "texto do presente já escolhido"],
  ["fumaca", "champanhe", "selo 'a definir'"],
  ["ouro-escuro", "papel", "botão contorno"],
  ["ouro-escuro", "branco", "botão contorno em card e no hover"],
  ["tinta", "champanhe", "selo 'Presenteado com carinho', contorno pressionado"],
  ["branco", "tinta", "botão primário"],
  ["sucesso", "branco", "selo Confirmado"],
  ["recusa", "branco", "selo Não vai"],
];

const COMBINACAO_PROIBIDA = (corpo: string) =>
  /background:\s*var\(--champanhe\)/.test(corpo) && /(^|[\s;])color:\s*var\(--ouro-escuro\)/.test(corpo);

describe("contraste AA", () => {
  it.each(PARES)("%s sobre %s (%s) ≥ 4.5", (texto, fundo) => {
    expect(contraste(token(texto), token(fundo))).toBeGreaterThanOrEqual(4.5);
  });

  it("--ouro puro não serve para texto (por isso é só para filetes e ícones)", () => {
    expect(contraste(token("ouro"), token("papel"))).toBeLessThan(4.5);
  });

  it("ouro-escuro sobre champanhe não passa — e nenhuma regra do CSS usa essa combinação", () => {
    expect(contraste(token("ouro-escuro"), token("champanhe"))).toBeLessThan(4.5);
    const proibidos = blocos(css).filter(({ corpo }) => COMBINACAO_PROIBIDA(corpo));
    expect(proibidos.map((b) => b.seletor)).toEqual([]);
  });

  it("a varredura acima detecta a combinação quando ela existe (o guarda não é vazio)", () => {
    const amostra = `.x:hover { border: 0; background: var(--champanhe); color: var(--ouro-escuro); }`;
    expect(blocos(amostra).filter(({ corpo }) => COMBINACAO_PROIBIDA(corpo))).toHaveLength(1);
    expect(blocos(css).length).toBeGreaterThan(30);
  });
});
