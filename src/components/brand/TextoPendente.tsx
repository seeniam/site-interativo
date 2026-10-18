import { textos } from "@/config/textos";
import type { Pendente } from "@/lib/pendente";

interface TextoPendenteProps {
  item: Pendente;
  className?: string;
}

/**
 * Placeholder honesto para um dado que o cliente ainda não enviou — "a definir" (briefing 4).
 * Parece placeholder de propósito — nunca se passa por informação real (briefing 9).
 */
export function TextoPendente({ item, className = "" }: TextoPendenteProps) {
  return (
    <span className={`texto-pendente ${className}`} data-pendente="">
      <span className="sr-only">{textos.pendente.leitorDeTela} </span>
      {item.descricao}
      <span aria-hidden className="selo-estado selo-estado--a-definir">
        {textos.pendente.selo}
      </span>
    </span>
  );
}
