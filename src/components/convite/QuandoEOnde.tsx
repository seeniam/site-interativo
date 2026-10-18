import { IconeIgreja, IconeTaca } from "@/components/brand/icons";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { eventoDoCasamento } from "@/lib/ics";
import { partesDataPorExtenso } from "@/lib/format";
import type { Endereco, Local } from "@/types/casamento";
import { AcoesLocal, AgendaCasamento } from "./AcoesLocal";
import { TituloSecao } from "./TituloSecao";

const { local: textosLocal } = textos.convite;

interface CardLocal extends Endereco {
  rotulo: string;
  horario: string;
  Icone: typeof IconeTaca;
}

/** Um card só (Espaço Max) ou dois, se a cerimônia for em outro lugar (briefing 6.1, item 5). */
// Recebe o tipo amplo (Local): com cerimoniaNoMesmoLocal false, o config precisa trazer a cerimônia.
function locais(config: Local, horarioTexto: string): CardLocal[] {
  if (config.cerimoniaNoMesmoLocal) {
    return [{ ...config, rotulo: textosLocal.cerimoniaERecepcao, horario: horarioTexto, Icone: IconeTaca }];
  }
  return [
    { ...config.cerimonia, rotulo: textosLocal.cerimonia, horario: config.cerimonia.horarioTexto, Icone: IconeIgreja },
    { ...config, rotulo: textosLocal.recepcao, horario: horarioTexto, Icone: IconeTaca },
  ];
}

export function QuandoEOnde() {
  const { data, diaDaSemana } = partesDataPorExtenso(casamento.data);
  const evento = eventoDoCasamento(casamento, textos.agenda);
  const cards = locais(casamento.local, casamento.horarioTexto);

  return (
    <section id="quando-e-onde" aria-labelledby="quando-e-onde-titulo" className="conteiner respiro-secao">
      <TituloSecao id="quando-e-onde-titulo">{textosLocal.titulo}</TituloSecao>
      <ul className={`mx-auto grid gap-6 ${cards.length > 1 ? "max-w-5xl md:grid-cols-2" : "max-w-2xl"}`}>
        {cards.map(({ rotulo, nome, endereco, mapsUrl, horario, Icone }) => (
          <li key={nome} className="rounded-secao bg-branco p-6 shadow-quente ring-1 ring-borda sm:p-10">
            <div className="flex items-start gap-4">
              <Icone tamanho={40} className="shrink-0 text-ouro" />
              <div className="flex flex-col gap-1">
                <p className="versalete">{rotulo}</p>
                <h3 className="font-display text-31 font-normal text-tinta sm:text-39">{nome}</h3>
              </div>
            </div>
            <dl className="mt-6 flex flex-col gap-4 text-16">
              <div>
                <dt className="sr-only">{textosLocal.rotuloQuando}</dt>
                <dd className="text-tinta">
                  <span className="whitespace-nowrap">{data}</span>, {diaDaSemana}, {horario}
                </dd>
              </div>
              <div>
                <dt className="sr-only">{textosLocal.rotuloEndereco}</dt>
                <dd className="text-fumaca">{endereco}</dd>
              </div>
            </dl>
            <div className="mt-8">
              <AcoesLocal nome={nome} endereco={endereco} mapsUrl={mapsUrl} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-10">
        <AgendaCasamento evento={{ ...evento, inicio: evento.inicio.toISOString(), fim: evento.fim.toISOString() }} />
      </div>
    </section>
  );
}
