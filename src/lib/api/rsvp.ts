/**
 * `POST /api/rsvp` e `POST /api/rsvp/verificar` (briefing 5 e 6.4).
 * A validação é o mesmo esquema zod do formulário, repetida aqui no servidor.
 */
import { z } from "zod";
import type { RepositorioCasamento } from "@/lib/db/repositorio";
import { hashTelefone } from "@/lib/db/hash";
import { criarEsquemaRsvp, esquemaTelefone, paraNovaConfirmacao, pareceRobo } from "@/lib/schemas/rsvp";
import { RegistroInvalido } from "@/lib/schemas/dominio";
import { CorpoInvalido, ipDoPedido, json, lerJson, respostaDeCorpoInvalido } from "./comum";
import type { Limitador } from "./limite";

export interface DependenciasRsvp {
  repositorio: RepositorioCasamento;
  sal: string;
  maxAcompanhantes: number;
  limitador: Limitador;
}

/** Erros por campo (`acompanhantes.0.nome` → mensagem). Só as nossas mensagens — nada do que chegou volta. */
export type ErrosPorCampo = Record<string, string>;

function errosPorCampo(erro: z.ZodError): ErrosPorCampo {
  const erros: ErrosPorCampo = {};
  for (const problema of erro.issues) {
    const campo = problema.path.map(String).join(".") || "formulario";
    erros[campo] ??= problema.message;
  }
  return erros;
}

function muitasTentativas(tentarEmSegundos: number): Response {
  return json({ ok: false, erro: "muitas-tentativas" }, 429, { "Retry-After": String(tentarEmSegundos) });
}

function indisponivel(onde: string, erro: unknown): Response {
  // Só o tipo do erro vai para o log: nunca o corpo do pedido (tem nome e telefone).
  console.error(`[${onde}] falha ao acessar o banco:`, erro instanceof Error ? erro.name : typeof erro);
  return json({ ok: false, erro: "indisponivel" }, 503);
}

export async function registrarRsvp(request: Request, deps: DependenciasRsvp): Promise<Response> {
  const vez = deps.limitador.tentar(ipDoPedido(request));
  if (!vez.permitido) return muitasTentativas(vez.tentarEmSegundos);

  let corpo: unknown;
  try {
    corpo = await lerJson(request);
  } catch (erro) {
    if (erro instanceof CorpoInvalido) return respostaDeCorpoInvalido(erro);
    throw erro;
  }

  const lido = criarEsquemaRsvp(deps.maxAcompanhantes).safeParse(corpo);
  if (!lido.success) return json({ ok: false, erro: "dados-invalidos", campos: errosPorCampo(lido.error) }, 400);

  // Robô no honeypot: responde como sucesso e não grava (não ensina o robô a desviar).
  if (pareceRobo(lido.data)) return json({ ok: true });

  const confirmacao = paraNovaConfirmacao(lido.data);
  const telefoneHash = hashTelefone(confirmacao.telefone, deps.sal);
  try {
    const anterior = await deps.repositorio.ultimaRespostaDoHash(telefoneHash);
    // Atualizar nunca sobrescreve: é uma linha nova que aponta para a resposta que substitui
    // (identificada pelo hash do telefone — vale sempre a mais recente).
    await deps.repositorio.registrarConfirmacao({
      ...confirmacao,
      telefoneHash,
      atualizaDe: anterior ? telefoneHash : null,
    });
  } catch (erro) {
    if (erro instanceof RegistroInvalido) return json({ ok: false, erro: "dados-invalidos", campos: {} }, 400);
    return indisponivel("rsvp", erro);
  }
  return json({ ok: true });
}

const esquemaVerificacao = z.object({ telefone: esquemaTelefone });

/** Devolve só `{ jaConfirmou, em? }` — o telefone não volta, nome nenhum volta. */
export async function verificarRsvp(
  request: Request,
  deps: Pick<DependenciasRsvp, "repositorio" | "sal" | "limitador">,
): Promise<Response> {
  const vez = deps.limitador.tentar(ipDoPedido(request));
  if (!vez.permitido) return muitasTentativas(vez.tentarEmSegundos);

  let corpo: unknown;
  try {
    corpo = await lerJson(request);
  } catch (erro) {
    if (erro instanceof CorpoInvalido) return respostaDeCorpoInvalido(erro);
    throw erro;
  }

  const lido = esquemaVerificacao.safeParse(corpo);
  if (!lido.success) return json({ ok: false, erro: "dados-invalidos" }, 400);

  try {
    const em = await deps.repositorio.ultimaRespostaDoHash(hashTelefone(lido.data.telefone, deps.sal));
    return json(em ? { jaConfirmou: true, em: em.toISOString() } : { jaConfirmou: false });
  } catch (erro) {
    return indisponivel("rsvp/verificar", erro);
  }
}
