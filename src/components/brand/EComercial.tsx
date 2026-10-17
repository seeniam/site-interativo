import { useId } from "react";
import { GradienteOuroSvg } from "./GradienteOuroSvg";
import { ECOMERCIAL } from "./monograma-glifos";

/**
 * O "&" em Pinyon Script, em ouro, como SVG (o mesmo traço do monograma).
 * O glifo da fonte é pequeno (desenho de altura-x) e o gradiente em `background-clip:text`
 * pegaria só a faixa clara; como SVG, o gradiente percorre o próprio "&".
 * Decorativo: quem usa escreve "e" para leitores de tela.
 */
export function EComercial({ className }: { className?: string }) {
  const id = `ouro-${useId()}`;
  return (
    <svg viewBox={ECOMERCIAL.viewBox} className={className} aria-hidden focusable={false}>
      <defs>
        <GradienteOuroSvg id={id} />
      </defs>
      <path d={ECOMERCIAL.d} fill={`url(#${id})`} />
    </svg>
  );
}
