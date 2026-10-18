"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ICONES_POR_NOME } from "@/components/brand/icons";
import { textos } from "@/config/textos";

const { navegacao } = textos;

/** Id do herói da home: enquanto ele está na tela, a barra fica escondida (briefing 6.1). */
export const ID_HEROI = "heroi";

/**
 * Navegação do celular: barra fixa embaixo, com safe-area do iPhone.
 * Aparece só depois do herói; em páginas sem herói, aparece sempre.
 * Recriada a cada rota (key), para o estado do herói nunca vazar de uma página para outra.
 */
export function BarraInferior() {
  const caminho = usePathname();
  return <BarraDaRota key={caminho} caminho={caminho} />;
}

function BarraDaRota({ caminho }: { caminho: string }) {
  const [heroiNaTela, setHeroiNaTela] = useState(false);

  useEffect(() => {
    const heroi = document.getElementById(ID_HEROI);
    if (!heroi) return;
    const observador = new IntersectionObserver(([entrada]) => setHeroiNaTela(entrada?.isIntersecting ?? false), {
      rootMargin: "0px 0px -35% 0px",
    });
    observador.observe(heroi);
    return () => observador.disconnect();
  }, []);

  const visivel = !heroiNaTela;

  return (
    <nav aria-label={navegacao.rotulo} className="barra-inferior md:hidden" data-visivel={visivel ? "" : undefined}>
      <ul className="grid grid-cols-3">
        {navegacao.itens.map((item) => {
          const Icone = ICONES_POR_NOME[item.icone];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={caminho === item.href ? "page" : undefined}
                tabIndex={visivel ? undefined : -1}
                className="barra-inferior__item"
              >
                <Icone tamanho={22} />
                <span>{item.rotulo}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
