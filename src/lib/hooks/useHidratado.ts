"use client";

import { useSyncExternalStore } from "react";

const nadaAssinar = () => () => {};

/** `false` no HTML do servidor e na hidratação; `true` assim que o React assume a página. */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    nadaAssinar,
    () => true,
    () => false,
  );
}
