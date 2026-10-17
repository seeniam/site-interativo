"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { usePrefereMenosMovimento } from "@/lib/hooks/usePrefereMenosMovimento";
import { GradienteOuroSvg } from "./GradienteOuroSvg";
import { MONOGRAMA_CAIXA, MONOGRAMA_GLIFOS, MONOGRAMA_VIEWBOX } from "./monograma-glifos";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Traço do desenho, em px na tela — o mesmo ~1px dos filetes. */
const TRACO_PX = 1.1;

/** Linha do tempo (~1.6s): traçado → preenchimento → luz que atravessa. */
const TEMPO = {
  traco: 1.0,
  escalonamento: 0.12,
  preenchimentoInicio: 0.85,
  preenchimento: 0.45,
  brilhoInicio: 1.0,
  brilho: 0.75,
} as const;

const ORDEM = ["primeira", "ecomercial", "segunda"] as const;

interface MonogramaAnimadoProps {
  /** Nome do casal para leitores de tela ("Jaqueline & Diorlando"). Vem do servidor, para o config não entrar no bundle do cliente. */
  rotulo: string;
  /** Largura renderizada em px; define a espessura real do traço. */
  largura: number;
  className?: string;
  atraso?: number;
  aoTerminar?: () => void;
}

/**
 * O monograma se desenha: contornos reais traçados em ouro, preenchimento, e um brilho
 * dourado cruzando da esquerda para a direita (briefing 3.5.1).
 * Com `prefers-reduced-motion`, vira um fade simples de 150ms.
 */
export function MonogramaAnimado({ rotulo, largura, className, atraso = 0, aoTerminar }: MonogramaAnimadoProps) {
  const id = useId();
  const reduzir = usePrefereMenosMovimento();
  const gradiente = `ouro-${id}`;
  const recorte = `recorte-${id}`;
  const luz = `luz-${id}`;
  const traco = (TRACO_PX * MONOGRAMA_CAIXA.largura) / largura;
  const altura = (largura * MONOGRAMA_CAIXA.altura) / MONOGRAMA_CAIXA.largura;

  if (reduzir) {
    return (
      <motion.svg
        viewBox={MONOGRAMA_VIEWBOX}
        width={largura}
        height={altura}
        className={className}
        role="img"
        aria-label={rotulo}
        fill="currentColor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: atraso }}
        onAnimationComplete={aoTerminar}
      >
        <defs>
          <GradienteOuroSvg id={gradiente} />
        </defs>
        <path d={MONOGRAMA_GLIFOS.primeira} />
        <path d={MONOGRAMA_GLIFOS.ecomercial} fill={`url(#${gradiente})`} />
        <path d={MONOGRAMA_GLIFOS.segunda} />
      </motion.svg>
    );
  }

  return (
    <svg
      viewBox={MONOGRAMA_VIEWBOX}
      width={largura}
      height={altura}
      className={className}
      role="img"
      aria-label={rotulo}
    >
      <defs>
        <GradienteOuroSvg id={gradiente} />
        <linearGradient id={luz} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF6DC" stopOpacity="0" />
          <stop offset=".5" stopColor="#FFF6DC" stopOpacity=".9" />
          <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
        </linearGradient>
        <clipPath id={recorte}>
          {ORDEM.map((glifo) => (
            <path key={glifo} d={MONOGRAMA_GLIFOS[glifo]} />
          ))}
        </clipPath>
      </defs>

      {ORDEM.map((glifo, i) => {
        const ouro = glifo === "ecomercial";
        return (
          <motion.path
            key={glifo}
            d={MONOGRAMA_GLIFOS[glifo]}
            stroke={`url(#${gradiente})`}
            strokeWidth={traco}
            strokeLinejoin="round"
            fill={ouro ? `url(#${gradiente})` : "currentColor"}
            initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 1 }}
            animate={{ pathLength: 1, fillOpacity: 1, strokeOpacity: ouro ? 1 : 0 }}
            transition={{
              pathLength: { duration: TEMPO.traco, delay: atraso + i * TEMPO.escalonamento, ease: EASE },
              fillOpacity: {
                duration: TEMPO.preenchimento,
                delay: atraso + TEMPO.preenchimentoInicio + i * TEMPO.escalonamento * 0.5,
                ease: "easeOut",
              },
              strokeOpacity: {
                duration: TEMPO.preenchimento,
                delay: atraso + TEMPO.preenchimentoInicio + 0.2,
              },
            }}
          />
        );
      })}

      {/* A luz de fim de tarde atravessando o monograma, recortada pelos glifos. */}
      <g clipPath={`url(#${recorte})`} aria-hidden>
        <motion.rect
          y={MONOGRAMA_CAIXA.y}
          height={MONOGRAMA_CAIXA.altura}
          width={MONOGRAMA_CAIXA.largura * 0.35}
          fill={`url(#${luz})`}
          initial={{ x: MONOGRAMA_CAIXA.x - MONOGRAMA_CAIXA.largura * 0.4 }}
          animate={{ x: MONOGRAMA_CAIXA.x + MONOGRAMA_CAIXA.largura * 1.05 }}
          transition={{ duration: TEMPO.brilho, delay: atraso + TEMPO.brilhoInicio, ease: [0.45, 0, 0.2, 1] }}
          onAnimationComplete={aoTerminar}
        />
      </g>
    </svg>
  );
}
