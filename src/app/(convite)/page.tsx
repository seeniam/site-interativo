import { AberturaConvite } from "@/components/layout/AberturaConvite";
import { casamento } from "@/config/casamento";

/**
 * Fase 2: o layout do convite, ainda sem as seções (Fase 3).
 * A abertura (CSS) já roda aqui na primeira visita da sessão.
 */
export default function Convite() {
  return (
    <>
      <AberturaConvite />
      <div className="conteiner flex min-h-[60dvh] items-center justify-center">
        <h1 className="font-display text-49 font-light text-tinta lg:text-76">{casamento.noivos.titulo}</h1>
      </div>
    </>
  );
}
