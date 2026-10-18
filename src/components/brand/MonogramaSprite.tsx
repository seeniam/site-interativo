import { GradienteOuroSvg } from "./GradienteOuroSvg";
import { MONOGRAMA_GLIFOS, MONOGRAMA_VIEWBOX } from "./monograma-glifos";

/** Id do <symbol> que todo `Monograma` estático referencia com <use>. */
export const ID_SIMBOLO_MONOGRAMA = "simbolo-monograma";

/**
 * Os contornos do monograma definidos uma vez por página, no layout raiz. Sem isso, cada
 * monograma (cabeçalho, herói, rodapé…) repetia ~9 KB de paths no HTML e no payload do RSC.
 * Fica fora da tela com tamanho zero — não `display:none`, que quebra o gradiente referenciado.
 */
export function MonogramaSprite() {
  return (
    <svg aria-hidden focusable={false} width="0" height="0" className="absolute h-0 w-0 overflow-hidden">
      <defs>
        <GradienteOuroSvg id="monograma-ouro" />
        <symbol id={ID_SIMBOLO_MONOGRAMA} viewBox={MONOGRAMA_VIEWBOX}>
          <path d={MONOGRAMA_GLIFOS.primeira} fill="currentColor" />
          <path d={MONOGRAMA_GLIFOS.ecomercial} fill="url(#monograma-ouro)" />
          <path d={MONOGRAMA_GLIFOS.segunda} fill="currentColor" />
        </symbol>
      </defs>
    </svg>
  );
}
