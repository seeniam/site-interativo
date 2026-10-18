"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { casamento } from "@/config/casamento";

/**
 * O segundo (e último) lugar da foto (DECISOES H1/H3): um recorte fechado da mão dela com a
 * aliança, numa faixa 21:9 entre seções. Abre do centro por clip-path, uma vez (3.5.6).
 */
export function RecorteDetalhe() {
  // Observa o invólucro, não a figura: com o clip-path fechado, a área visível da figura é 0
  // e o IntersectionObserver nunca dispararia.
  const ref = useRef<HTMLDivElement>(null);
  const [aberto, setAberto] = useState(false);
  const { imagem, detalhe } = casamento.fotoCasal;

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          setAberto(true);
          observador.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <figure className="recorte" data-aberto={aberto ? "" : undefined}>
        <Image
          src={imagem}
          alt={detalhe.alt}
          fill
          sizes="(min-width: 1184px) 1120px, 100vw"
          placeholder="blur"
          className="recorte__foto foto-tratada"
          style={{ objectPosition: detalhe.posicao, transformOrigin: detalhe.posicao, scale: detalhe.escala }}
        />
        {/* Textura assumida (DECISOES H3): véu quente, grão sutil e o filete dourado. */}
        <div aria-hidden className="recorte__veu" />
        <div aria-hidden className="recorte__grao" />
        <div aria-hidden className="recorte__filete" />
      </figure>
    </div>
  );
}
