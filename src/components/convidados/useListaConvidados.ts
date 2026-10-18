"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { RespostaConvidado } from "@/lib/convidados";

export type EstadoLista =
  { tipo: "carregando" } | { tipo: "erro" } | { tipo: "pronto"; respostas: RespostaConvidado[]; atualizadoEm: string };

/** De quanto em quanto tempo a lista se atualiza sozinha (briefing 6.6). */
export const INTERVALO_ATUALIZACAO_MS = 15_000;

/**
 * A lista dos noivos, de `GET /api/convidados`. Atualiza sozinha a cada 15s enquanto a aba está
 * visível (e na hora em que ela volta a ficar visível) — sem conexão aberta. Sessão vencida (401)
 * devolve para a tela de login.
 */
export function useListaConvidados() {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoLista>({ tipo: "carregando" });

  const carregar = useCallback(async () => {
    try {
      const resposta = await fetch("/api/convidados", { cache: "no-store" });
      if (resposta.status === 401) {
        router.refresh();
        return;
      }
      if (!resposta.ok) throw new Error(`status ${resposta.status}`);
      const corpo = (await resposta.json()) as { respostas: RespostaConvidado[]; geradoEm: string };
      setEstado({ tipo: "pronto", respostas: corpo.respostas, atualizadoEm: corpo.geradoEm });
    } catch {
      // Falha numa atualização automática não apaga a lista que já está na tela.
      setEstado((atual) => (atual.tipo === "pronto" ? atual : { tipo: "erro" }));
    }
  }, [router]);

  useEffect(() => {
    const seVisivel = () => {
      if (document.visibilityState === "visible") void carregar();
    };
    // A primeira carga também sai num callback, como as seguintes.
    const primeira = setTimeout(() => void carregar(), 0);
    const relogio = setInterval(seVisivel, INTERVALO_ATUALIZACAO_MS);
    document.addEventListener("visibilitychange", seVisivel);
    return () => {
      clearTimeout(primeira);
      clearInterval(relogio);
      document.removeEventListener("visibilitychange", seVisivel);
    };
  }, [carregar]);

  const tentarDeNovo = useCallback(() => {
    setEstado({ tipo: "carregando" });
    void carregar();
  }, [carregar]);

  return { estado, carregar, tentarDeNovo };
}
