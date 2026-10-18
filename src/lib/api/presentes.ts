/**
 * `GET /api/presentes` e `POST /api/presentes/[id]/reservar` (briefing 5).
 * Cotas nunca se esgotam (DECISOES V2): reservar uma cota responde 400.
 */
import type { RepositorioCasamento } from "@/lib/db/repositorio";
import type { Presente } from "@/types/casamento";
import { barrarExcesso, indisponivel, json } from "./comum";
import type { Limitador } from "./limite";

/** Público: só os ids já dados. */
export async function listarPresentesReservados(repositorio: RepositorioCasamento): Promise<Response> {
  try {
    return json({ reservados: await repositorio.listarReservados() });
  } catch (erro) {
    return indisponivel("presentes", erro);
  }
}

export interface DependenciasReserva {
  repositorio: RepositorioCasamento;
  presentes: readonly Pick<Presente, "id" | "tipo">[];
  limitador: Limitador;
}

export async function reservarPresente(request: Request, id: string, deps: DependenciasReserva): Promise<Response> {
  const barrado = barrarExcesso(deps.limitador, request);
  if (barrado) return barrado;

  const presente = deps.presentes.find((p) => p.id === id);
  if (!presente) return json({ ok: false, erro: "presente-inexistente" }, 404);
  if (presente.tipo === "cota") return json({ ok: false, erro: "cota-nao-se-esgota" }, 400);

  try {
    const marcado = await deps.repositorio.reservarPresente(presente.id);
    return marcado ? json({ ok: true }) : json({ ok: false, erro: "ja-presenteado" }, 409);
  } catch (erro) {
    return indisponivel("presentes", erro);
  }
}
