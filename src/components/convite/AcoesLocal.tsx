"use client";

import { CalendarPlus, Copy, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { textos } from "@/config/textos";
import { gerarIcs, linkGoogleAgenda, type EventoAgenda } from "@/lib/ics";

const { local } = textos.convite;
const icone = { "aria-hidden": true, size: 18, strokeWidth: 1.5 } as const;

interface AcoesLocalProps {
  nome: string;
  endereco: string;
  mapsUrl: string;
}

/** Ver no mapa, copiar endereço e mapa embutido sob demanda — por local (briefing 6.1, item 5). */
export function AcoesLocal({ nome, endereco, mapsUrl }: AcoesLocalProps) {
  const [mapaAberto, setMapaAberto] = useState(false);
  const mapa = useRef<HTMLIFrameElement>(null);

  // O botão some ao abrir o mapa: o foco vai para o mapa, não se perde no documento.
  useEffect(() => {
    if (mapaAberto) mapa.current?.focus();
  }, [mapaAberto]);

  async function copiarEndereco() {
    try {
      await navigator.clipboard.writeText(endereco);
      toast.success(local.enderecoCopiado);
    } catch {
      toast.error(local.copiaFalhou);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-3">
        <BotaoLink
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          variante="contorno"
          icone={<MapPin {...icone} />}
        >
          {local.verNoMapa}
          <span className="sr-only"> {local.abreEmNovaAba}</span>
        </BotaoLink>
        <Botao variante="contorno" onClick={copiarEndereco} icone={<Copy {...icone} />}>
          {local.copiarEndereco}
        </Botao>
      </div>
      {mapaAberto ? (
        <iframe
          ref={mapa}
          title={local.tituloMapa(nome)}
          src={`https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="aspect-[4/3] w-full rounded-card border-0 ring-1 ring-borda sm:aspect-[16/9]"
        />
      ) : (
        <Botao variante="texto" onClick={() => setMapaAberto(true)} className="self-start">
          {local.mostrarMapa}
        </Botao>
      )}
    </div>
  );
}

interface AgendaCasamentoProps {
  /** O evento montado no servidor (datas em ISO, para atravessar a fronteira servidor/cliente). */
  evento: Omit<EventoAgenda, "inicio" | "fim"> & { inicio: string; fim: string };
}

/** "Adicionar à agenda" uma vez só: .ics gerado no cliente + Google Agenda (briefing 6.1, item 5). */
export function AgendaCasamento({ evento }: AgendaCasamentoProps) {
  const eventoComDatas: EventoAgenda = { ...evento, inicio: new Date(evento.inicio), fim: new Date(evento.fim) };

  function baixarIcs() {
    // O endereço do site só existe no navegador: entra aqui, no clique, nunca no render (hidratação).
    const comLink = { ...eventoComDatas, url: window.location.origin };
    const arquivo = new Blob([gerarIcs(comLink, new Date())], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = "casamento-jaqueline-e-diorlando.ics";
    // No documento e com a revogação atrasada: o Safari/iOS cancela o download se a URL some no mesmo tick.
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="flex items-center gap-2 text-14 font-normal text-tinta">
        <CalendarPlus {...icone} className="text-ouro-escuro" />
        {local.adicionarAgenda}
      </p>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-1">
        <Botao variante="texto" onClick={baixarIcs}>
          {local.baixarIcs}
        </Botao>
        <a
          href={linkGoogleAgenda(eventoComDatas)}
          target="_blank"
          rel="noopener noreferrer"
          className="botao botao--texto"
        >
          {local.googleAgenda}
          <span className="sr-only"> {local.abreEmNovaAba}</span>
        </a>
      </div>
    </div>
  );
}
