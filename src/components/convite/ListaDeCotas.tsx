import Link from "next/link";
import { ICONES_POR_NOME } from "@/components/brand/icons";
import { casamento } from "@/config/casamento";
import { textos } from "@/config/textos";
import { partesBRL } from "@/lib/format";

/**
 * Teaser dos presentes como uma lista impressa num cartão de papel: uma linha por cota,
 * a Ouro marcada pelo número em ouro. Evita a grade de cards iguais (briefing 9);
 * os "três planos" ficam para /presentear.
 */
export function ListaDeCotas() {
  return (
    <ul className="lista-cotas">
      {casamento.presentes.map((presente) => {
        const Icone = ICONES_POR_NOME[presente.icone];
        const { simbolo, numero } = partesBRL(presente.valor);
        const destaque = "destaque" in presente && presente.destaque;
        return (
          <li key={presente.id} className="lista-cotas__item" data-destaque={destaque ? "" : undefined}>
            <Link href={`/confirmar-presente/${presente.id}`} className="lista-cotas__link">
              <Icone tamanho={26} className="shrink-0 text-ouro" />
              <span className="lista-cotas__titulo">{presente.titulo}</span>
              <span aria-hidden className="lista-cotas__pontilhado" />
              <span className="lista-cotas__valor">
                <span className="text-14 text-fumaca">{simbolo}</span>
                <span className={`font-display text-31 font-light numeros ${destaque ? "texto-ouro" : "text-tinta"}`}>
                  {numero}
                </span>
              </span>
              <span className="lista-cotas__acao">{textos.presentes.botao}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
