/**
 * `GET /api/presentes` e `POST /api/presentes/[id]/reservar` (briefing 5).
 * Cotas nunca se esgotam (DECISOES V2): reservar uma cota responde 400.
 */
import type { RepositorioCasamento } from "@/lib/db/repositorio";
import type { Presente } from "@/types/casamento";
import { ipDoPedido, json } from "./comum";
import type { Limitador } from "./limite";

/** Público: só os ids já dados. */
export async function listarPresentesReservados(repositorio: RepositorioCasamento): Promise<Response> {
  try {
    return json({ reservados: await repositorio.listarReservados() });
  } catch (erro) {
    console.error("[presentes] falha ao acessar o banco:", erro instanceof Error ? erro.name : typeof erro);
    return json({ ok: false, erro: "indisponivel" }, 503);
  }
}

export interface DependenciasReserva {
  repositorio: RepositorioCasamento;
  presentes: readonly Pick<Presente, "id" | "tipo">[];
  limitador: Limitador;
}

export async function reservarPresente(request: Request, id: string, deps: DependenciasReserva): Promise<Response> {
  const vez = deps.limitador.tentar(ipDoPedido(request));
  if (!vez.permitido) {
    return json({ ok: false, erro: "muitas-tentativas" }, 429, { "Retry-After": String(vez.tentarEmSegundos) });
  }

  const presente = deps.presentes.find((p) => p.id === id);
  if (!presente) return json({ ok: false, erro: "presente-inexistente" }, 404);
  if (presente.tipo === "cota") return json({ ok: false, erro: "cota-nao-se-esgota" }, 400);

  try {
    const marcado = await deps.repositorio.reservarPresente(presente.id);
    return marcado ? json({ ok: true }) : json({ ok: false, erro: "ja-presenteado" }, 409);
  } catch (erro) {
    console.error("[presentes] falha ao acessar o banco:", erro instanceof Error ? erro.name : typeof erro);
    return json({ ok: false, erro: "indisponivel" }, 503);
  }
}
