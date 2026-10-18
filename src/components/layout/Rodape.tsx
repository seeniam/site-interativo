import Link from "next/link";
import { FileteDourado } from "@/components/brand/FileteDourado";
import { Monograma } from "@/components/brand/Monograma";
import { textos } from "@/config/textos";

/** Rodapé: monograma, assinatura em Pinyon, link discreto para /convidados, créditos (briefing 6.1). */
export function Rodape({ nomeDoCasal }: { nomeDoCasal: string }) {
  const { rodape } = textos;
  return (
    <footer className="rodape">
      <div className="conteiner flex flex-col items-center gap-6 text-center">
        <FileteDourado />
        <Monograma decorativo className="h-auto w-24 text-tinta" />
        <p className="font-script text-25 leading-tight text-balance text-ouro-escuro sm:text-31">
          {rodape.assinatura(nomeDoCasal)}
        </p>
        <div className="flex flex-col items-center gap-1 text-12 text-fumaca">
          <Link href="/convidados" className="rodape__link">
            {rodape.convidados}
          </Link>
          <p>{rodape.creditoFoto}</p>
        </div>
      </div>
    </footer>
  );
}
