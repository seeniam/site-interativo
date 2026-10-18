/**
 * Peças comuns das Route Handlers — funções puras sobre `Request`/`Response`, testáveis sem
 * subir o Next. As rotas em `app/api` só ligam estas funções ao repositório e ao ambiente.
 */
import type { Limitador } from "./limite";

/** Corpo máximo aceito: um RSVP completo cabe com folga em 8 KB. */
export const CORPO_MAXIMO = 8 * 1024;

export function json(corpo: unknown, status = 200, cabecalhos: Record<string, string> = {}): Response {
  return Response.json(corpo, {
    status,
    // Nada daqui deve ficar em cache de navegador ou CDN.
    headers: { "Cache-Control": "no-store", ...cabecalhos },
  });
}

/**
 * Lê o corpo como JSON, com tipo e tamanho conferidos antes de interpretar.
 * Pedido fora do formato já sai com a resposta pronta (415, 413 ou 400).
 */
export async function lerCorpo(
  request: Request,
): Promise<{ ok: true; corpo: unknown } | { ok: false; resposta: Response }> {
  const recusa = (status: 400 | 413 | 415) => ({
    ok: false as const,
    resposta: json({ ok: false, erro: "pedido-invalido" }, status),
  });
  const tipo = request.headers.get("content-type") ?? "";
  if (!tipo.toLowerCase().startsWith("application/json")) return recusa(415);
  if (Number(request.headers.get("content-length") ?? "0") > CORPO_MAXIMO) return recusa(413);
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > CORPO_MAXIMO) return recusa(413);
  try {
    return { ok: true, corpo: JSON.parse(texto) as unknown };
  } catch {
    return recusa(400);
  }
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

/** Conta a tentativa deste IP; passou do limite, devolve o 429 com `Retry-After`. */
export function barrarExcesso(limitador: Limitador, request: Request): Response | null {
  const vez = limitador.tentar(ipDoPedido(request));
  if (vez.permitido) return null;
  return json({ ok: false, erro: "muitas-tentativas" }, 429, { "Retry-After": String(vez.tentarEmSegundos) });
}

/** Banco fora do ar: 503 sem detalhe. Só o tipo do erro vai ao log — nunca o pedido (tem nome e telefone). */
export function indisponivel(onde: string, erro: unknown): Response {
  console.error(`[${onde}] falha ao acessar o banco:`, erro instanceof Error ? erro.name : typeof erro);
  return json({ ok: false, erro: "indisponivel" }, 503);
}
