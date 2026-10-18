/**
 * `POST /api/entrar`, `POST /api/sair` e `GET /api/convidados` (briefing 5).
 * Sem cookie de sessão válido, `/api/convidados` responde 401 e nenhum dado sai.
 */
import { z } from "zod";
import type { RepositorioCasamento } from "@/lib/db/repositorio";
import { respostasValendo } from "@/lib/convidados";
import { CorpoInvalido, ipDoPedido, json, lerJson, respostaDeCorpoInvalido } from "./comum";
import type { Limitador } from "./limite";
import {
  COOKIE_SESSAO,
  cookieDeSaida,
  cookieDeSessao,
  criarTokenSessao,
  lerCookie,
  senhaConfere,
  sessaoValida,
} from "./sessao";

export interface DependenciasEntrar {
  senhaNoivos: string;
  segredoSessao: string;
  limitador: Limitador;
  agora: () => number;
}

const esquemaEntrar = z.object({ senha: z.string().min(1).max(200) });

export async function entrar(request: Request, deps: DependenciasEntrar): Promise<Response> {
  // Limite apertado: a senha é a única porta, então chutes em série são barrados.
  const vez = deps.limitador.tentar(ipDoPedido(request));
  if (!vez.permitido) {
    return json({ ok: false, erro: "muitas-tentativas" }, 429, { "Retry-After": String(vez.tentarEmSegundos) });
  }

  let corpo: unknown;
  try {
    corpo = await lerJson(request);
  } catch (erro) {
    if (erro instanceof CorpoInvalido) return respostaDeCorpoInvalido(erro);
    throw erro;
  }

  const lido = esquemaEntrar.safeParse(corpo);
  if (!lido.success || !senhaConfere(lido.data.senha, deps.senhaNoivos)) {
    return json({ ok: false, erro: "senha-incorreta" }, 401);
  }
  return json({ ok: true }, 200, { "Set-Cookie": cookieDeSessao(criarTokenSessao(deps.segredoSessao, deps.agora())) });
}

export function sair(): Response {
  return json({ ok: true }, 200, { "Set-Cookie": cookieDeSaida() });
}

export function pedidoDosNoivos(request: Request, segredoSessao: string, agora: number): boolean {
  return sessaoValida(lerCookie(request, COOKIE_SESSAO), segredoSessao, agora);
}

export interface DependenciasConvidados {
  repositorio: RepositorioCasamento;
  segredoSessao: string;
  agora: () => number;
}

export async function listarConvidados(request: Request, deps: DependenciasConvidados): Promise<Response> {
  if (!pedidoDosNoivos(request, deps.segredoSessao, deps.agora())) {
    return json({ ok: false, erro: "nao-autorizado" }, 401);
  }
  try {
    const respostas = respostasValendo(await deps.repositorio.listarConfirmacoes());
    return json({ respostas, geradoEm: new Date(deps.agora()).toISOString() });
  } catch (erro) {
    console.error("[convidados] falha ao acessar o banco:", erro instanceof Error ? erro.name : typeof erro);
    return json({ ok: false, erro: "indisponivel" }, 503);
  }
}
