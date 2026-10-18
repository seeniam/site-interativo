import type { ReactNode } from "react";
import { textos } from "@/config/textos";

interface ValorAConfirmarProps {
  /** O valor real que o casal enviou — aparece normalmente. */
  children: ReactNode;
  className?: string;
}

/**
 * Um dado que chegou, mas tem dúvida aberta com o casal — "a confirmar" (briefing 4).
 * Diferente de `TextoPendente` ("a definir"): aqui o valor existe e é mostrado.
 */
export function ValorAConfirmar({ children, className = "" }: ValorAConfirmarProps) {
  return (
    <span className={className} data-a-confirmar="">
      {children}
      <span className="selo-estado selo-estado--a-confirmar">{textos.aConfirmar.selo}</span>
    </span>
  );
}
