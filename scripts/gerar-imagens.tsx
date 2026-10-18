/**
 * Gera as imagens de compartilhamento e os ícones (briefing 8), uma vez, a partir da foto e dos
 * contornos do monograma — os arquivos gerados vão para o repositório.
 *
 *   pnpm gerar:imagens
 *
 * - `src/app/opengraph-image.jpg` (1200×630): o cartão do WhatsApp, desenhado com `next/og` e
 *   convertido para JPEG — em PNG a foto passaria de 1 MB, e o WhatsApp descarta prévia pesada.
 * - `src/app/icon.svg`, `src/app/apple-icon.png` e `public/icones/*.png`: o monograma sobre papel.
 *
 * Rode de novo se mudar a foto, os nomes (depois de `scripts/extrair-glifos.ts`) ou a data.
 */
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import {
  ECOMERCIAL,
  MONOGRAMA_CAIXA,
  MONOGRAMA_GLIFOS,
  MONOGRAMA_VIEWBOX,
  NOMES_EM_TRACOS,
} from "../src/components/brand/monograma-glifos";
import { partesDataPorExtenso } from "../src/lib/format";

const RAIZ = process.cwd();

/**
 * Os três dados do casal que o cartão usa, lidos do config como texto (como em extrair-glifos.ts):
 * o `casamento.ts` importa a foto, e importar imagem só funciona dentro do Next.
 */
function lerDoConfig() {
  const fonte = fs.readFileSync(path.join(RAIZ, "src/config/casamento.ts"), "utf8");
  const achar = (re: RegExp, nome: string) => {
    const valor = re.exec(fonte)?.[1];
    if (!valor) throw new Error(`Não achei ${nome} em src/config/casamento.ts`);
    return valor;
  };
  return {
    titulo: achar(/noivos:\s*\{[^}]*?titulo:\s*"([^"]+)"/su, "noivos.titulo"),
    data: achar(/^\s*data:\s*"([^"]+)"/mu, "data"),
    local: achar(/local:\s*\{\s*nome:\s*"([^"]+)"/u, "local.nome"),
  };
}
const casamento = lerDoConfig();
const COR = { papel: "#FCFAF7", tinta: "#17140F", ouro: "#C9A227", ouroEscuro: "#8C6B2F", fumaca: "#6E675C" };

function escrever(relativo: string, conteudo: Buffer | string) {
  const destino = path.join(RAIZ, relativo);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, conteudo);
  const kb = (Buffer.byteLength(conteudo) / 1024).toFixed(1);
  console.log(`✓ ${relativo} (${kb} KB)`);
}

// ── Ícones: o monograma centrado num quadrado de papel ─────────────────────────
function svgDoIcone(): string {
  const { x, y, largura, altura } = MONOGRAMA_CAIXA;
  const lado = largura * 1.22;
  const origemX = x - (lado - largura) / 2;
  const origemY = y + altura / 2 - lado / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${origemX} ${origemY} ${lado} ${lado}">
  <rect x="${origemX}" y="${origemY}" width="${lado}" height="${lado}" rx="${lado * 0.18}" fill="${COR.papel}"/>
  <path d="${MONOGRAMA_GLIFOS.primeira}" fill="${COR.tinta}"/>
  <path d="${MONOGRAMA_GLIFOS.ecomercial}" fill="${COR.ouroEscuro}"/>
  <path d="${MONOGRAMA_GLIFOS.segunda}" fill="${COR.tinta}"/>
</svg>
`;
}

// ── Cartão de compartilhamento ────────────────────────────────────────────────
function Nome({ d, viewBox, altura }: { d: string; viewBox: string; altura: number }) {
  const [, , w, h] = viewBox.split(" ").map(Number) as [number, number, number, number];
  return (
    <svg width={(altura * w) / h} height={altura} viewBox={viewBox}>
      <path d={d} fill={COR.tinta} />
    </svg>
  );
}

async function cartao(): Promise<Buffer> {
  const foto = fs.readFileSync(path.join(RAIZ, "public/images/casal.jpeg")).toString("base64");
  const [, , mw, mh] = MONOGRAMA_VIEWBOX.split(" ").map(Number) as [number, number, number, number];
  const [, , ew, eh] = ECOMERCIAL.viewBox.split(" ").map(Number) as [number, number, number, number];
  const { data, diaDaSemana, hora } = partesDataPorExtenso(casamento.data);
  const alturaNome = 64;

  const resposta = new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: COR.papel }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 760,
          height: "100%",
          gap: 30,
        }}
      >
        <svg width={(110 * mw) / mh} height={110} viewBox={MONOGRAMA_VIEWBOX}>
          <path d={MONOGRAMA_GLIFOS.primeira} fill={COR.tinta} />
          <path d={MONOGRAMA_GLIFOS.ecomercial} fill={COR.ouro} />
          <path d={MONOGRAMA_GLIFOS.segunda} fill={COR.tinta} />
        </svg>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18 }}>
          <Nome d={NOMES_EM_TRACOS.ela.d} viewBox={NOMES_EM_TRACOS.ela.viewBox} altura={alturaNome} />
          <svg width={(46 * ew) / eh} height={46} viewBox={ECOMERCIAL.viewBox} style={{ marginBottom: 14 }}>
            <path d={ECOMERCIAL.d} fill={COR.ouro} />
          </svg>
          <Nome d={NOMES_EM_TRACOS.ele.d} viewBox={NOMES_EM_TRACOS.ele.viewBox} altura={alturaNome} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 44, height: 1, background: COR.ouro }} />
          <div style={{ width: 6, height: 6, background: COR.ouro, transform: "rotate(45deg)" }} />
          <div style={{ width: 44, height: 1, background: COR.ouro }} />
        </div>
        <div style={{ display: "flex", fontSize: 30, color: COR.tinta, letterSpacing: 1 }}>{data}</div>
        <div style={{ display: "flex", fontSize: 22, color: COR.fumaca, marginTop: -18 }}>
          {`${diaDaSemana}, ${hora}, ${casamento.local}`}
        </div>
      </div>
      {/* A foto em retrato, inteira na altura, com o filete dourado na divisa. */}
      <div style={{ display: "flex", width: 1, height: "100%", background: COR.ouro }} />
      {/* O next/og (Satori) desenha <img> cru: next/image não existe fora do Next. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/jpeg;base64,${foto}`}
        width={439}
        height={630}
        style={{ objectFit: "cover", objectPosition: "50% 20%" }}
        alt=""
      />
    </div>,
    { width: 1200, height: 630 },
  );
  const png = Buffer.from(await resposta.arrayBuffer());
  return sharp(png).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}

async function principal() {
  const icone = svgDoIcone();
  escrever("src/app/icon.svg", icone);
  const rasterizar = (lado: number) => sharp(Buffer.from(icone)).resize(lado, lado).png().toBuffer();
  escrever("src/app/apple-icon.png", await rasterizar(180));
  escrever("public/icones/icone-192.png", await rasterizar(192));
  escrever("public/icones/icone-512.png", await rasterizar(512));

  escrever("src/app/opengraph-image.jpg", await cartao());
  escrever(
    "src/app/opengraph-image.alt.txt",
    `${casamento.titulo} — ${partesDataPorExtenso(casamento.data).data}, ${casamento.local}.`,
  );
}

void principal();
