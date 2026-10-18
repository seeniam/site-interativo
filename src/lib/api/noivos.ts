/**
 * `POST /api/entrar`, `POST /api/sair` e `GET /api/convidados` (briefing 5).
 * Sem cookie de sessão válido, `/api/convidados` responde 401 e nenhum dado sai.
 */
import { z } from "zod";
import { respostasValendo } from "@/lib/convidados";
import type { RepositorioCasamento } from "@/lib/db/repositorio";
import { barrarExcesso, indisponivel, json, lerCorpo } from "./comum";
import type { Limitador } from "./limite";
import {
  COOKIE_SESSAO,
  chaveDaSessao,
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
  const barrado = barrarExcesso(deps.limitador, request);
  if (barrado) return barrado;
  const lido = await lerCorpo(request);
  if (!lido.ok) return lido.resposta;

  const dados = esquemaEntrar.safeParse(lido.corpo);
  if (!dados.success || !senhaConfere(dados.data.senha, deps.senhaNoivos)) {
    return json({ ok: false, erro: "senha-incorreta" }, 401);
  }
  const token = criarTokenSessao(chaveDaSessao(deps.segredoSessao, deps.senhaNoivos), deps.agora());
  return json({ ok: true }, 200, { "Set-Cookie": cookieDeSessao(token) });
}

export function sair(): Response {
  return json({ ok: true }, 200, { "Set-Cookie": cookieDeSaida() });
}

export interface DependenciasConvidados {
  repositorio: RepositorioCasamento;
  segredoSessao: string;
  senhaNoivos: string;
  agora: () => number;
}

export async function listarConvidados(request: Request, deps: DependenciasConvidados): Promise<Response> {
  const chave = chaveDaSessao(deps.segredoSessao, deps.senhaNoivos);
  if (!sessaoValida(lerCookie(request, COOKIE_SESSAO), chave, deps.agora())) {
    return json({ ok: false, erro: "nao-autorizado" }, 401);
  }
  try {
    const respostas = respostasValendo(await deps.repositorio.listarConfirmacoes());
    return json({ respostas, geradoEm: new Date(deps.agora()).toISOString() });
  } catch (erro) {
    return indisponivel("convidados", erro);
  }
}
