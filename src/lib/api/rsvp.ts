/**
 * `POST /api/rsvp` e `POST /api/rsvp/verificar` (briefing 5 e 6.4).
 * A validação é o mesmo esquema zod do formulário, repetida aqui no servidor.
 */
import { z } from "zod";
import { hashTelefone } from "@/lib/db/hash";
import type { RepositorioCasamento } from "@/lib/db/repositorio";
import { RegistroInvalido } from "@/lib/schemas/dominio";
import { esquemaRsvp, esquemaTelefone, paraNovaConfirmacao, pareceRobo } from "@/lib/schemas/rsvp";
import { barrarExcesso, indisponivel, json, lerCorpo } from "./comum";
import type { Limitador } from "./limite";

export interface DependenciasRsvp {
  repositorio: RepositorioCasamento;
  sal: string;
  limitador: Limitador;
}

/** Erros por campo (`convidadoPor` → mensagem). Só as nossas mensagens — nada do que chegou volta. */
export type ErrosPorCampo = Record<string, string>;

function errosPorCampo(erro: z.ZodError): ErrosPorCampo {
  const erros: ErrosPorCampo = {};
  for (const problema of erro.issues) {
    const campo = problema.path.map(String).join(".") || "formulario";
    erros[campo] ??= problema.message;
  }
  return erros;
}

export async function registrarRsvp(request: Request, deps: DependenciasRsvp): Promise<Response> {
  const barrado = barrarExcesso(deps.limitador, request);
  if (barrado) return barrado;
  const lido = await lerCorpo(request);
  if (!lido.ok) return lido.resposta;

  const dados = esquemaRsvp.safeParse(lido.corpo);
  if (!dados.success) return json({ ok: false, erro: "dados-invalidos", campos: errosPorCampo(dados.error) }, 400);

  // Robô no honeypot: responde como sucesso e não grava (não ensina o robô a desviar).
  if (pareceRobo(dados.data)) return json({ ok: true });

  const confirmacao = paraNovaConfirmacao(dados.data);
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
  const barrado = barrarExcesso(deps.limitador, request);
  if (barrado) return barrado;
  const lido = await lerCorpo(request);
  if (!lido.ok) return lido.resposta;

  const dados = esquemaVerificacao.safeParse(lido.corpo);
  if (!dados.success) return json({ ok: false, erro: "dados-invalidos" }, 400);

  try {
    const em = await deps.repositorio.ultimaRespostaDoHash(hashTelefone(dados.data.telefone, deps.sal));
    return json(em ? { jaConfirmou: true, em: em.toISOString() } : { jaConfirmou: false });
  } catch (erro) {
    return indisponivel("rsvp/verificar", erro);
  }
}
