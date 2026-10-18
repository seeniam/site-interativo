"use client";

import { Check, Copy } from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { textos } from "@/config/textos";

const { pix } = textos;
const EASE = [0.22, 1, 0.36, 1] as const;

interface PainelPixProps {
  /** Payload BR Code completo, calculado no servidor por lib/pix.ts (DECISOES P1). */
  payload: string;
}

/** QR desenhado no navegador, sob demanda: a biblioteca não pesa no carregamento (briefing 8). */
function QrPix({ payload }: PainelPixProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void import("qrcode").then((QRCode) =>
      QRCode.toString(payload, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 1,
        color: { dark: "#17140F", light: "#FFFFFF" },
      }).then((resultado) => {
        if (ativo) setSvg(resultado);
      }),
    );
    return () => {
      ativo = false;
    };
  }, [payload]);

  return (
    <div className="qr-pix">
      {svg ? (
        // SVG gerado pela biblioteca a partir do nosso próprio payload — não há entrada de usuário.
        <div
          role="img"
          aria-label={pix.qrTitulo}
          className="qr-pix__codigo"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <p className="qr-pix__codigo grid place-items-center text-14 text-fumaca">{pix.qrCarregando}</p>
      )}
    </div>
  );
}

/** Código copia-e-cola + "Copiar código PIX" com o check dourado e o flash (briefing 3.5.4). */
function CopiaECola({ payload }: PainelPixProps) {
  const [copiado, setCopiado] = useState(false);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    if (!copiado) return;
    const relogio = setTimeout(() => setCopiado(false), 2400);
    return () => clearTimeout(relogio);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiado(true);
      setFlash((n) => n + 1);
      toast.success(pix.copiado);
    } catch {
      toast.error(pix.copiaFalhou);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* key muda a cada cópia: o flash de champanhe roda de novo (600ms). */}
      <code key={flash} className={`codigo-pix ${flash > 0 ? "codigo-pix--flash" : ""}`} data-codigo-pix="">
        {payload}
      </code>
      <MotionConfig reducedMotion="user">
        <motion.button
          layout
          type="button"
          onClick={copiar}
          className="botao botao--primario botao--bloco"
          aria-live="polite"
          transition={{ layout: { duration: 0.32, ease: EASE } }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={copiado ? "ok" : "copiar"}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="inline-flex items-center gap-2"
            >
              {copiado ? (
                <Check aria-hidden size={18} strokeWidth={2} className="text-ouro-claro" />
              ) : (
                <Copy aria-hidden size={18} strokeWidth={1.5} />
              )}
              {copiado ? pix.copiado : pix.copiar}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </MotionConfig>
    </div>
  );
}

export function PainelPix({ payload }: PainelPixProps) {
  return (
    <>
      <QrPix payload={payload} />
      <CopiaECola payload={payload} />
    </>
  );
}

export { QrPix, CopiaECola };
