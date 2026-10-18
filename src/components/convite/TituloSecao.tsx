import type { ReactNode } from "react";
import { FileteDourado } from "@/components/brand/FileteDourado";

interface TituloSecaoProps {
  id: string;
  children: ReactNode;
  /** Uma linha de apoio, opcional — nunca texto de marketing. */
  apoio?: ReactNode;
  /**
   * Variação de entrada, para as seções não repetirem o mesmo desenho:
   * - "padrao": Cormorant grande, centralizado, com o filete (a assinatura gráfica).
   * - "discreto": só um versalete — quando o conteúdo é o protagonista (a contagem).
   * - "lateral": título alinhado à esquerda, ao lado do conteúdo no desktop (dúvidas).
   */
  variante?: "padrao" | "discreto" | "lateral";
}

export function TituloSecao({ id, children, apoio, variante = "padrao" }: TituloSecaoProps) {
  if (variante === "discreto") {
    return (
      <h2 id={id} className="mb-8 text-center versalete sm:mb-10">
        {children}
      </h2>
    );
  }

  if (variante === "lateral") {
    return (
      <header className="mb-8 flex flex-col gap-4 lg:mb-0">
        <h2 id={id} className="font-display text-39 font-light text-balance text-tinta sm:text-49">
          {children}
        </h2>
        <span className="hidden lg:block">
          <FileteDourado />
        </span>
        {apoio && <p className="medida text-16 text-fumaca">{apoio}</p>}
      </header>
    );
  }

  return (
    <header className="mb-10 flex flex-col items-center gap-5 text-center sm:mb-14">
      <h2 id={id} className="font-display text-39 font-light text-balance text-tinta sm:text-49">
        {children}
      </h2>
      <FileteDourado />
      {apoio && <p className="medida text-16 text-balance text-fumaca">{apoio}</p>}
    </header>
  );
}
