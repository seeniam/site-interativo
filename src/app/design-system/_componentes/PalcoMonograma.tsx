"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { MonogramaAnimado } from "@/components/brand/MonogramaAnimado";
import { Botao } from "@/components/ui/Botao";

/** O monograma se desenhando, com um botão para ver o traçado de novo. */
export function PalcoMonograma({ rotulo }: { rotulo: string }) {
  const [rodada, setRodada] = useState(0);

  return (
    <div className="flex flex-col items-center gap-8">
      <MonogramaAnimado
        key={rodada}
        rotulo={rotulo}
        largura={300}
        atraso={0.3}
        className="h-auto max-w-full text-tinta"
      />
      <Botao
        variante="texto"
        onClick={() => setRodada((n) => n + 1)}
        icone={<RotateCcw aria-hidden size={16} strokeWidth={1.5} />}
      >
        Desenhar de novo
      </Botao>
    </div>
  );
}
