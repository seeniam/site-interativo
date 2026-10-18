/**
 * Extrai os contornos reais de "J" e "D" (Cormorant Garamond Light) e do "&" (Pinyon Script)
 * e grava um módulo TypeScript com os paths SVG já compostos num único viewBox.
 *
 * Rodar só quando a composição do monograma mudar:
 *   pnpm tsx scripts/extrair-glifos.ts <pasta-com-as-fontes>
 *
 * A pasta deve conter os arquivos oficiais do repositório google/fonts:
 *   Cormorant.ttf  ← ofl/cormorantgaramond/CormorantGaramond[wght].ttf (instância padrão = 300)
 *   Pinyon.ttf     ← ofl/pinyonscript/PinyonScript-Regular.ttf
 */
import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const argumento = process.argv[2];
if (!argumento) {
  console.error("Uso: pnpm tsx scripts/extrair-glifos.ts <pasta-com-as-fontes>");
  process.exit(1);
}
const pasta: string = argumento;

function carregar(arquivo: string): opentype.Font {
  const buf = fs.readFileSync(path.join(pasta, arquivo));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/**
 * As letras vêm de casamento.noivos.monograma. O config importa a foto (um .jpeg), que o
 * Node não carrega, então o script lê o trecho do arquivo em vez de importá-lo.
 */
function letrasDoConfig(): { esquerda: string; direita: string } {
  const fonte = fs.readFileSync(path.join(process.cwd(), "src/config/casamento.ts"), "utf8");
  const achado = /monograma:\s*\{\s*esquerda:\s*"(.)",\s*direita:\s*"(.)"\s*\}/u.exec(fonte);
  if (!achado?.[1] || !achado[2]) {
    console.error("Não achei noivos.monograma { esquerda, direita } em src/config/casamento.ts");
    process.exit(1);
  }
  return { esquerda: achado[1], direita: achado[2] };
}

const LETRAS = letrasDoConfig();
const cormorant = carregar("Cormorant.ttf");
const pinyon = carregar("Pinyon.ttf");

/**
 * Composição, em unidades de fonte (1000 upm). Ajustado visualmente.
 * O "&" fica com ~65% da altura da capitular: menor e dourado entre as letras (briefing 3.3).
 */
const TAMANHO_LETRA = 1000;
const TAMANHO_ECOMERCIAL = 880;
const BASELINE = 0;
/** Sobe o "&" para centrá-lo oticamente na metade inferior das capitulares. */
const ECOMERCIAL_DESLOCAMENTO_Y = -60;
/** Aproximação lateral (negativa = sobrepõe) entre letra e "&". */
const RESPIRO_J_E = 40;
const RESPIRO_E_D = 50;
const MARGEM = 24;

interface Glifo {
  d: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function glifo(font: opentype.Font, char: string, x: number, y: number, size: number): Glifo {
  const p = font.getPath(char, x, y, size);
  const box = p.getBoundingBox();
  return { d: p.toPathData(2), x1: box.x1, y1: box.y1, x2: box.x2, y2: box.y2 };
}

function largura(font: opentype.Font, char: string, size: number): { esquerda: number; direita: number } {
  const box = font.getPath(char, 0, 0, size).getBoundingBox();
  return { esquerda: box.x1, direita: box.x2 };
}

// Posiciona cada glifo pela caixa de tinta (não pelo avanço), para o espaçamento ser ótico.
const lj = largura(cormorant, LETRAS.esquerda, TAMANHO_LETRA);
const le = largura(pinyon, "&", TAMANHO_ECOMERCIAL);
const ld = largura(cormorant, LETRAS.direita, TAMANHO_LETRA);

const xJ = -lj.esquerda;
const fimJ = xJ + lj.direita;
const xE = fimJ + RESPIRO_J_E - le.esquerda;
const fimE = xE + le.direita;
const xD = fimE + RESPIRO_E_D - ld.esquerda;

const j = glifo(cormorant, LETRAS.esquerda, xJ, BASELINE, TAMANHO_LETRA);
const e = glifo(pinyon, "&", xE, BASELINE + ECOMERCIAL_DESLOCAMENTO_Y, TAMANHO_ECOMERCIAL);
const d = glifo(cormorant, LETRAS.direita, xD, BASELINE, TAMANHO_LETRA);

const minX = Math.min(j.x1, e.x1, d.x1) - MARGEM;
const minY = Math.min(j.y1, e.y1, d.y1) - MARGEM;
const maxX = Math.max(j.x2, e.x2, d.x2) + MARGEM;
const maxY = Math.max(j.y2, e.y2, d.y2) + MARGEM;
const r = (n: number) => Math.round(n * 100) / 100;

const saida = `// Gerado por scripts/extrair-glifos.ts — não editar à mão.
// Letras: Cormorant Garamond Light (OFL). "&": Pinyon Script (OFL).

/** Letras usadas na geração — um teste confere que batem com casamento.noivos.monograma. */
export const MONOGRAMA_LETRAS = { esquerda: "${LETRAS.esquerda}", direita: "${LETRAS.direita}" } as const;

/** Altura de tinta de cada glifo no monograma (unidades do viewBox). */
export const MONOGRAMA_ALTURAS = {
  primeira: ${r(j.y2 - j.y1)},
  ecomercial: ${r(e.y2 - e.y1)},
  segunda: ${r(d.y2 - d.y1)},
} as const;

export const MONOGRAMA_CAIXA = {
  x: ${r(minX)},
  y: ${r(minY)},
  largura: ${r(maxX - minX)},
  altura: ${r(maxY - minY)},
} as const;

export const MONOGRAMA_VIEWBOX = "${r(minX)} ${r(minY)} ${r(maxX - minX)} ${r(maxY - minY)}";

export const MONOGRAMA_GLIFOS = {
  primeira: "${j.d}",
  ecomercial: "${e.d}",
  segunda: "${d.d}",
} as const;
`;

// O "&" sozinho, na origem, para usos fora do monograma (nomes no herói, assinatura).
const ecomercialSolto = glifo(pinyon, "&", 0, 0, 1000);
const caixaE = {
  x: r(ecomercialSolto.x1 - MARGEM),
  y: r(ecomercialSolto.y1 - MARGEM),
  largura: r(ecomercialSolto.x2 - ecomercialSolto.x1 + 2 * MARGEM),
  altura: r(ecomercialSolto.y2 - ecomercialSolto.y1 + 2 * MARGEM),
};
const saidaE = `
/** O "&" do Pinyon Script isolado, enquadrado pela própria tinta. */
export const ECOMERCIAL = {
  viewBox: "${caixaE.x} ${caixaE.y} ${caixaE.largura} ${caixaE.altura}",
  proporcao: ${r(caixaE.largura / caixaE.altura)},
  d: "${ecomercialSolto.d}",
} as const;
`;

/**
 * Os nomes do herói em contornos da Cormorant Light (briefing 3.3: 300, letter-spacing .02em):
 * aparecem na tipografia certa no primeiro quadro, sem esperar a fonte (DECISOES H10).
 * A caixa vertical usa as métricas da fonte, para os dois nomes dividirem a mesma linha de base.
 */
function nomesDoConfig(): { ela: string; ele: string } {
  const fonte = fs.readFileSync(path.join(process.cwd(), "src/config/casamento.ts"), "utf8");
  const ela = /\bela:\s*"([^"]+)"/u.exec(fonte)?.[1];
  const ele = /\bele:\s*"([^"]+)"/u.exec(fonte)?.[1];
  if (!ela || !ele) {
    console.error("Não achei noivos.ela / noivos.ele em src/config/casamento.ts");
    process.exit(1);
  }
  return { ela, ele };
}

const ESPACAMENTO_NOMES = 0.02;
const ASCENDENTE = cormorant.ascender;
const DESCENDENTE = -cormorant.descender;

function nomeEmTracos(texto: string) {
  const opcoes = { letterSpacing: ESPACAMENTO_NOMES };
  const caminho = cormorant.getPath(texto, 0, ASCENDENTE, 1000, opcoes);
  const largura = cormorant.getAdvanceWidth(texto, 1000, opcoes);
  const altura = ASCENDENTE + DESCENDENTE;
  return { texto, largura: r(largura), altura: r(altura), d: caminho.toPathData(2) };
}

const nomes = nomesDoConfig();
const saidaNomes = `
/** Nomes do herói em contornos da Cormorant Light — uma unidade de fonte = 1/1000 em. */
export const NOMES_EM_TRACOS = {
${(["ela", "ele"] as const)
  .map((quem) => {
    const n = nomeEmTracos(nomes[quem]);
    return `  ${quem}: {
    texto: "${n.texto}",
    viewBox: "0 0 ${n.largura} ${n.altura}",
    larguraEm: ${r(n.largura / 1000)},
    alturaEm: ${r(n.altura / 1000)},
    d: "${n.d}",
  },`;
  })
  .join("\n")}
} as const;
`;

/**
 * A assinatura do rodapé em contornos do Pinyon Script (DECISOES H12): com o "&" e a
 * assinatura em SVG, o site não baixa a fonte Pinyon. Dois trechos, para quebrar linha no celular.
 */
function assinaturaDoConfig(): { abertura: string; casal: string } {
  const textosFonte = fs.readFileSync(path.join(process.cwd(), "src/config/textos.ts"), "utf8");
  const config = fs.readFileSync(path.join(process.cwd(), "src/config/casamento.ts"), "utf8");
  const abertura = /assinatura:\s*\(casal: string\)\s*=>\s*`([^`$]*)\$\{casal\}`/u.exec(textosFonte)?.[1]?.trim();
  const casal = /\btitulo:\s*"([^"]+)"/u.exec(config)?.[1];
  if (!abertura || !casal) {
    console.error("Não achei textos.rodape.assinatura ou noivos.titulo");
    process.exit(1);
  }
  return { abertura, casal };
}

function trechoEmTracos(texto: string) {
  const caminho = pinyon.getPath(texto, 0, pinyon.ascender, 1000);
  const caixa = caminho.getBoundingBox();
  const largura = Math.max(pinyon.getAdvanceWidth(texto, 1000), caixa.x2) + MARGEM;
  const altura = pinyon.ascender - pinyon.descender;
  return { texto, largura: r(largura), altura: r(altura), d: caminho.toPathData(2) };
}

const assinatura = assinaturaDoConfig();
const saidaAssinatura = `
/** Assinatura do rodapé em contornos do Pinyon Script — uma unidade de fonte = 1/1000 em. */
export const ASSINATURA_EM_TRACOS = {
${(["abertura", "casal"] as const)
  .map((parte) => {
    const t = trechoEmTracos(assinatura[parte]);
    return `  ${parte}: {
    texto: ${JSON.stringify(t.texto)},
    viewBox: "0 0 ${t.largura} ${t.altura}",
    larguraEm: ${r(t.largura / 1000)},
    alturaEm: ${r(t.altura / 1000)},
    d: "${t.d}",
  },`;
  })
  .join("\n")}
} as const;
`;

const destino = path.join(process.cwd(), "src/components/brand/monograma-glifos.ts");
fs.writeFileSync(destino, saida + saidaE + saidaNomes + saidaAssinatura);
console.log(
  `Gravado ${path.relative(process.cwd(), destino)} — viewBox ${r(minX)} ${r(minY)} ${r(maxX - minX)} ${r(maxY - minY)}`,
);
