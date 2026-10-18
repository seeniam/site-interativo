import { Heroi } from "@/components/convite/Heroi";
import { QuandoEOnde } from "@/components/convite/QuandoEOnde";
import { RecorteDetalhe } from "@/components/convite/RecorteDetalhe";
import {
  FaixaRsvp,
  SecaoContagem,
  SecaoDuvidas,
  SecaoHistoria,
  SecaoPresentes,
  SecaoTrajes,
} from "@/components/convite/SecoesConvite";
import { AberturaConvite } from "@/components/layout/AberturaConvite";

/** O convite (briefing 6.1): as seções na ordem do briefing. */
export default function Convite() {
  return (
    <>
      <AberturaConvite />
      <Heroi />
      <SecaoContagem />
      <SecaoHistoria />
      <div className="conteiner">
        <RecorteDetalhe />
      </div>
      <QuandoEOnde />
      <SecaoTrajes />
      <SecaoPresentes />
      <SecaoDuvidas />
      <FaixaRsvp />
    </>
  );
}
