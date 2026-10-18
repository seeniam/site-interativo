import type { Metadata } from "next";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { FormularioRsvp } from "@/components/rsvp/FormularioRsvp";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { partesDataPorExtenso } from "@/lib/format";
import { linkWhatsApp } from "@/lib/whatsapp";

const { rsvp } = textos;

export const metadata: Metadata = { title: rsvp.titulo };

/** Confirmação de presença em três passos (briefing 6.4). A página é estática; o envio vai para /api/rsvp. */
export default function ConfirmarPresenca() {
  const { data, diaDaSemana, hora } = partesDataPorExtenso(casamento.data);

  return (
    <div className="conteiner respiro-secao">
      <header className="mx-auto mb-10 flex max-w-xl flex-col items-center gap-5 text-center sm:mb-12">
        <h1 className="font-display text-49 font-light text-tinta sm:text-61">{rsvp.titulo}</h1>
        <FileteDourado />
        <p className="text-16 text-balance text-fumaca">
          {data}, {diaDaSemana}, às {hora}, no {casamento.local.nome}.
        </p>
      </header>
      <FormularioRsvp
        noivos={[casamento.noivos.ela, casamento.noivos.ele]}
        linkWhatsApp={linkWhatsApp(casamento.whatsapp.numero, rsvp.mensagemLimite)}
      />
    </div>
  );
}
