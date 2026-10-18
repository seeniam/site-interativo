/**
 * Peças comuns das Route Handlers — funções puras sobre `Request`/`Response`, testáveis sem
 * subir o Next. As rotas em `app/api` só ligam estas funções ao repositório e ao ambiente.
 */

/** Corpo máximo aceito: um RSVP completo cabe com folga em 8 KB. */
export const CORPO_MAXIMO = 8 * 1024;

export class CorpoInvalido extends Error {
  override name = "CorpoInvalido";
  constructor(readonly status: 400 | 413 | 415) {
    super(`corpo inválido (${status})`);
  }
}

export function json(corpo: unknown, status = 200, cabecalhos: Record<string, string> = {}): Response {
  return Response.json(corpo, {
    status,
    // Nada daqui deve ficar em cache de navegador ou CDN.
    headers: { "Cache-Control": "no-store", ...cabecalhos },
  });
}

/** Lê o corpo como JSON, com tipo e tamanho conferidos antes de interpretar. */
export async function lerJson(request: Request): Promise<unknown> {
  const tipo = request.headers.get("content-type") ?? "";
  if (!tipo.toLowerCase().startsWith("application/json")) throw new CorpoInvalido(415);
  const declarado = Number(request.headers.get("content-length") ?? "0");
  if (declarado > CORPO_MAXIMO) throw new CorpoInvalido(413);
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > CORPO_MAXIMO) throw new CorpoInvalido(413);
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    throw new CorpoInvalido(400);
  }
}

export function respostaDeCorpoInvalido(erro: CorpoInvalido): Response {
  return json({ ok: false, erro: "pedido-invalido" }, erro.status);
}

/**
 * O IP de quem pediu, para o limite por IP. Na Vercel o `x-forwarded-for` é preenchido pela
 * própria plataforma (o primeiro item é o cliente). Fora dela o cabeçalho é do cliente — serve
 * só para o limite simples que o briefing pede, nunca para autorizar nada.
 */
export function ipDoPedido(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || request.headers.get("x-real-ip")?.trim() || "desconhecido";
}
