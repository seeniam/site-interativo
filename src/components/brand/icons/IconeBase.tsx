import type { ReactNode, SVGProps } from "react";

export interface IconeProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Lado em px. Padrão 24 — a grade em que os ícones foram desenhados. */
  tamanho?: number;
  /** Texto para leitores de tela. Sem rótulo, o ícone é decorativo (aria-hidden). */
  rotulo?: string;
}

/**
 * Base dos ícones próprios: grade 24px, traço 1.5px, terminais arredondados (briefing 3.6).
 * O traço não escala com o tamanho, para manter o mesmo peso dos filetes em qualquer uso.
 */
export function IconeBase({
  tamanho = 24,
  rotulo,
  className = "",
  children,
  ...resto
}: IconeProps & { children: ReactNode }) {
  return (
    <svg
      className={`icone-marca ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(rotulo ? { role: "img", "aria-label": rotulo } : { "aria-hidden": true, focusable: false })}
      {...resto}
    >
      {children}
    </svg>
  );
}
