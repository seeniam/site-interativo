import { useId } from "react";
import { casamento } from "@/config/casamento";
import { GradienteOuroSvg } from "./GradienteOuroSvg";
import { MONOGRAMA_GLIFOS, MONOGRAMA_VIEWBOX } from "./monograma-glifos";

interface MonogramaProps {
  className?: string;
  /** "tinta" sobre papel; "branco" sobre a foto do herói. O "&" é sempre ouro. */
  tom?: "tinta" | "branco";
  /** Decorativo quando o nome do casal já está escrito ao lado. */
  decorativo?: boolean;
}

/** Monograma estático (sem JavaScript). A versão que se desenha é `MonogramaAnimado`. */
export function Monograma({ className, tom = "tinta", decorativo = false }: MonogramaProps) {
  const id = useId();
  const gradiente = `ouro-${id}`;

  return (
    <svg
      viewBox={MONOGRAMA_VIEWBOX}
      className={className}
      fill={tom === "branco" ? "#FFFFFF" : "currentColor"}
      {...(decorativo
        ? { "aria-hidden": true, focusable: false }
        : { role: "img", "aria-label": casamento.noivos.titulo })}
    >
      <defs>
        <GradienteOuroSvg id={gradiente} />
      </defs>
      <path d={MONOGRAMA_GLIFOS.primeira} />
      <path d={MONOGRAMA_GLIFOS.ecomercial} fill={`url(#${gradiente})`} />
      <path d={MONOGRAMA_GLIFOS.segunda} />
    </svg>
  );
}
