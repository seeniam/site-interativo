import { textos } from "@/config/textos";

/** Carregando: o formato da lista em blocos com o brilho dourado (briefing 6.6). */
export function EsqueletoLista() {
  return (
    <div className="conteiner flex flex-col gap-8 pt-6" aria-busy="true">
      <span className="sr-only" role="status">
        {textos.convidados.carregando}
      </span>
      <div aria-hidden className="esqueleto h-12 w-64" />
      <div aria-hidden className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="esqueleto h-32" />
        ))}
      </div>
      <div aria-hidden className="flex flex-col gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="esqueleto h-20" />
        ))}
      </div>
    </div>
  );
}
