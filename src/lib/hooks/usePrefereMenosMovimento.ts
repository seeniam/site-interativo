"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

function assinar(avisar: () => void): () => void {
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

/**
 * `prefers-reduced-motion` sem quebrar a hidratação.
 *
 * O `useReducedMotion` do motion lê `matchMedia` já no primeiro render do cliente, enquanto o
 * servidor não sabe a preferência — as árvores divergem e o React descarta o HTML (erro #418).
 * Aqui o servidor e a hidratação concordam em `false`; a preferência real entra logo depois.
 */
export function usePrefereMenosMovimento(): boolean {
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(CONSULTA).matches,
    () => false,
  );
}
