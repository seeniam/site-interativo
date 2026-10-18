"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Monograma } from "@/components/brand/Monograma";
import { BotaoLink } from "@/components/ui/Botao";
import { textos } from "@/config/textos";

const { navegacao } = textos;
const LIMITE_ROLAGEM_PX = 24;

/** Cabeçalho do desktop (≥ 768px): encolhe ao rolar. No celular, quem navega é a barra inferior. */
export function Cabecalho({ nomeDoCasal }: { nomeDoCasal: string }) {
  const caminho = usePathname();
  const [encolhido, setEncolhido] = useState(false);

  useEffect(() => {
    let quadro = 0;
    const atualizar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => setEncolhido(window.scrollY > LIMITE_ROLAGEM_PX));
    };
    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", atualizar);
    };
  }, []);

  const links = navegacao.itens.filter((item) => item.href !== "/confirmar-presenca");

  return (
    <header className="cabecalho hidden md:block" data-encolhido={encolhido ? "" : undefined}>
      <div className="conteiner flex h-full items-center justify-between gap-8">
        <Link href="/" aria-label={`${nomeDoCasal} — ${navegacao.inicio}`} className="cabecalho__marca">
          <Monograma decorativo className="h-auto w-full text-tinta" />
        </Link>
        <nav aria-label={navegacao.rotulo}>
          <ul className="flex items-center gap-2">
            {links.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={caminho === item.href ? "page" : undefined}
                  className="cabecalho__link"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
            <li className="ml-4">
              <BotaoLink
                href="/confirmar-presenca"
                aria-current={caminho === "/confirmar-presenca" ? "page" : undefined}
                className="cabecalho__cta"
              >
                {navegacao.confirmarPresenca}
              </BotaoLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
