/**
 * Sessão dos noivos (briefing 5): cookie httpOnly, secure, sameSite=lax, assinado com
 * `SESSAO_SECRET`, válido 30 dias. O token é `v1.<expira em ms>.<HMAC-SHA256>` — não carrega
 * dado nenhum além da validade. A proteção real é o 401 do servidor.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESSAO = "sessao_noivos";
export const DURACAO_SESSAO_MS = 30 * 24 * 60 * 60 * 1000;

const VERSAO = "v1";

function assinatura(conteudo: string, segredo: string): string {
  return createHmac("sha256", segredo).update(conteudo).digest("base64url");
}

function iguaisEmTempoConstante(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function criarTokenSessao(segredo: string, agora: number): string {
  if (!segredo) throw new RangeError("SESSAO_SECRET vazio");
  const conteudo = `${VERSAO}.${agora + DURACAO_SESSAO_MS}`;
  return `${conteudo}.${assinatura(conteudo, segredo)}`;
}

export function sessaoValida(token: string | undefined, segredo: string, agora: number): boolean {
  if (!token || !segredo) return false;
  const partes = token.split(".");
  if (partes.length !== 3) return false;
  const [versao, expira, recebida] = partes as [string, string, string];
  if (versao !== VERSAO || !/^\d{1,16}$/.test(expira)) return false;
  if (!iguaisEmTempoConstante(recebida, assinatura(`${versao}.${expira}`, segredo))) return false;
  return Number(expira) > agora;
}

/** A sessão vale agora? (O relógio fica aqui, fora da renderização dos componentes.) */
export function sessaoValidaAgora(token: string | undefined, segredo: string): boolean {
  return sessaoValida(token, segredo, Date.now());
}

/**
 * Compara a senha digitada com `SENHA_NOIVOS` sem vazar, pelo tempo de resposta, quantos
 * caracteres acertou: as duas passam por HMAC antes (mesmo tamanho) e a comparação é constante.
 */
export function senhaConfere(digitada: string, correta: string): boolean {
  if (!correta) return false;
  const chave = "comparacao-de-senha";
  return iguaisEmTempoConstante(
    createHmac("sha256", chave).update(digitada).digest("base64url"),
    createHmac("sha256", chave).update(correta).digest("base64url"),
  );
}

/** Lê um cookie do cabeçalho `Cookie` sem depender do Next. */
export function lerCookie(request: Request, nome: string): string | undefined {
  const cabecalho = request.headers.get("cookie") ?? "";
  for (const parte of cabecalho.split(";")) {
    const [chave, ...valor] = parte.trim().split("=");
    if (chave === nome) return decodeURIComponent(valor.join("="));
  }
  return undefined;
}

export function cookieDeSessao(token: string): string {
  const maxAge = Math.floor(DURACAO_SESSAO_MS / 1000);
  return `${COOKIE_SESSAO}=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function cookieDeSaida(): string {
  return `${COOKIE_SESSAO}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}
