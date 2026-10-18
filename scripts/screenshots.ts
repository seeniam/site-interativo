/**
 * Screenshots de QA nas três larguras do briefing (seção 5), salvas em docs/qa/fase-N/.
 *
 *   pnpm build && pnpm qa:screenshots --fase 0 --rotas /design-system
 *
 * Sem BASE_URL, sobe `next start` numa porta livre e derruba ao final.
 * Além das imagens, reprova (exit 1) se alguma rota tiver scroll horizontal, elemento
 * saindo da tela (o body usa overflow-x: clip, que esconde o scroll) ou erro de página.
 */
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { chromium, type Page } from "@playwright/test";

const LARGURAS = [
  { nome: "390", width: 390, height: 844 },
  { nome: "768", width: 768, height: 1024 },
  { nome: "1440", width: 1440, height: 900 },
] as const;

/** Tempo para a abertura e o monograma terminarem (~1.6s) com folga. */
const ESPERA_ANIMACOES_MS = 2600;

function argumento(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const fase = argumento("fase") ?? "0";
// Aceita "design-system" ou "/design-system" (o Git Bash reescreve argumentos que começam com "/").
const rotas = (argumento("rotas") ?? "/design-system").split(",").map((r) => `/${r.trim().replace(/^\/+/, "")}`);
const destino = path.join(process.cwd(), "docs", "qa", `fase-${fase}`);

function slug(rota: string): string {
  return rota === "/" ? "inicio" : rota.replace(/^\//, "").replace(/[^\w-]+/g, "_");
}

async function esperarServidor(url: string, tentativas = 60): Promise<void> {
  for (let i = 0; i < tentativas; i++) {
    try {
      const resposta = await fetch(url);
      if (resposta.ok || resposta.status === 307 || resposta.status === 404) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Servidor não respondeu em ${url}`);
}

/** Pede ao sistema uma porta livre — nunca fotografa um servidor antigo que já esteja de pé. */
function portaLivre(): Promise<number> {
  return new Promise((resolve, reject) => {
    const sonda = net.createServer();
    sonda.once("error", reject);
    sonda.listen(0, () => {
      const endereco = sonda.address();
      const porta = typeof endereco === "object" && endereco ? endereco.port : 0;
      sonda.close(() => resolve(porta));
    });
  });
}

/** Depois que nós mesmos derrubamos o servidor, a saída dele não é erro. */
let encerrando = false;

function subirServidor(porta: number): ChildProcess {
  const next = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const filho = spawn(process.execPath, [next, "start", "-p", String(porta)], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  filho.once("exit", (codigo) => {
    if (!encerrando && codigo !== null && codigo !== 0) {
      console.error(`✗ next start saiu com código ${codigo}. Rodou "pnpm build" antes?`);
      process.exit(1);
    }
  });
  return filho;
}

function derrubar(processo: ChildProcess): void {
  encerrando = true;
  if (processo.pid === undefined) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(processo.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    processo.kill("SIGTERM");
  }
}

/** Rola até o fim para disparar lazy-load e reveals "once", depois volta ao topo. */
async function percorrer(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const passo = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += passo) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
}

async function main(): Promise<void> {
  const porta = process.env.BASE_URL ? 0 : await portaLivre();
  const base = process.env.BASE_URL ?? `http://localhost:${porta}`;
  const servidor = process.env.BASE_URL ? undefined : subirServidor(porta);
  let falhou = false;

  try {
    await esperarServidor(base);
    fs.mkdirSync(destino, { recursive: true });
    const navegador = await chromium.launch();

    for (const largura of LARGURAS) {
      const contexto = await navegador.newContext({
        viewport: { width: largura.width, height: largura.height },
        deviceScaleFactor: 2,
        locale: "pt-BR",
      });
      const page = await contexto.newPage();
      const errosDePagina: string[] = [];
      page.on("pageerror", (erro) => errosDePagina.push(erro.message));

      for (const rota of rotas) {
        await page.goto(`${base}${rota}`, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(ESPERA_ANIMACOES_MS);
        await percorrer(page);
        await page.waitForTimeout(400);

        const transbordo = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        if (transbordo > 0) {
          falhou = true;
          console.error(`✗ ${rota} @${largura.nome}px: scroll horizontal de ${transbordo}px`);
        }

        const vazando = await page.evaluate(() => {
          const limite = document.documentElement.clientWidth + 0.5;
          return [...document.querySelectorAll("body *")]
            .filter((el): el is HTMLElement => el instanceof HTMLElement)
            .filter((el) => {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0 || (r.right <= limite && r.left >= -0.5)) return false;
              // Cortado por um ancestral que cabe na tela (ex.: imagem em zoom dentro de uma moldura) não vaza.
              for (let pai = el.parentElement; pai; pai = pai.parentElement) {
                const estilo = getComputedStyle(pai);
                if (["hidden", "clip"].includes(estilo.overflowX) || estilo.clipPath !== "none") {
                  const rp = pai.getBoundingClientRect();
                  if (rp.right <= limite && rp.left >= -0.5) return false;
                }
              }
              return true;
            }).length;
        });
        if (vazando > 0) {
          falhou = true;
          console.error(`✗ ${rota} @${largura.nome}px: ${vazando} elemento(s) saindo da tela`);
        }

        if (errosDePagina.length > 0) {
          falhou = true;
          console.error(`✗ ${rota} @${largura.nome}px: erros de página`, errosDePagina);
          errosDePagina.length = 0;
        }

        const arquivo = path.join(destino, `${slug(rota)}-${largura.nome}.png`);
        await page.screenshot({ path: arquivo, fullPage: true });
        console.log(`✓ ${path.relative(process.cwd(), arquivo)}`);
      }
      await contexto.close();
    }
    await navegador.close();
  } finally {
    if (servidor) derrubar(servidor);
  }

  if (falhou) process.exit(1);
}

main().catch((erro: unknown) => {
  console.error(erro);
  process.exit(1);
});
