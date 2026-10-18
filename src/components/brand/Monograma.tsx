import { casamento } from "@/config/casamento";
import { MONOGRAMA_CAIXA, MONOGRAMA_VIEWBOX } from "./monograma-glifos";
import { ID_SIMBOLO_MONOGRAMA } from "./MonogramaSprite";

interface MonogramaProps {
  className?: string;
  /** "tinta" sobre papel; "branco" sobre a foto do herói. O "&" é sempre ouro. */
  tom?: "tinta" | "branco";
  /** Decorativo quando o nome do casal já está escrito ao lado. */
  decorativo?: boolean;
}

/**
 * Monograma estático (sem JavaScript), desenhado a partir do <symbol> do `MonogramaSprite`
 * (no layout raiz). A versão que se desenha é `MonogramaAnimado`.
 */
export function Monograma({ className, tom = "tinta", decorativo = false }: MonogramaProps) {
  return (
    <svg
      viewBox={MONOGRAMA_VIEWBOX}
      className={className}
      style={tom === "branco" ? { color: "#FFFFFF" } : undefined}
      {...(decorativo
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": casamento.noivos.titulo })}
    >
      {/* O <use> recebe a caixa do símbolo: sem isso ele cai em (0,0) desse viewBox, deslocado. */}
      <use
        href={`#${ID_SIMBOLO_MONOGRAMA}`}
        x={MONOGRAMA_CAIXA.x}
        y={MONOGRAMA_CAIXA.y}
        width={MONOGRAMA_CAIXA.largura}
        height={MONOGRAMA_CAIXA.altura}
      />
    </svg>
  );
}
