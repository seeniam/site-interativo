import { GradienteOuroSvg } from "@/components/brand/GradienteOuroSvg";
import { MONOGRAMA_CAIXA, MONOGRAMA_GLIFOS, MONOGRAMA_VIEWBOX } from "@/components/brand/monograma-glifos";

/** Marca no <html> que liga a abertura nesta visita; o script a remove quando ela termina. */
export const ATRIBUTO_ABERTURA = "data-abertura";
const CHAVE_SESSAO = "convite:abertura-vista";
/** Duração total da animação em CSS (globals.css, seção "Abertura") com folga. */
const DURACAO_MS = 2000;

/**
 * Roda no <head>, antes da primeira pintura (DECISOES L1): só na home, uma vez por sessão,
 * nunca com movimento reduzido. Sem JavaScript, simplesmente não há abertura.
 */
export const SCRIPT_ABERTURA = `(function(){try{
if(location.pathname!=="/")return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
if(sessionStorage.getItem("${CHAVE_SESSAO}"))return;
sessionStorage.setItem("${CHAVE_SESSAO}","1");
var h=document.documentElement;h.setAttribute("${ATRIBUTO_ABERTURA}","");
setTimeout(function(){h.removeAttribute("${ATRIBUTO_ABERTURA}")},${DURACAO_MS});
}catch(e){}})();`;

const ORDEM = ["primeira", "ecomercial", "segunda"] as const;

/**
 * A abertura do convite (briefing 3.5.1): papel, o monograma se desenha, um brilho dourado
 * cruza, o monograma sobe e a camada se abre para o herói. Tudo em CSS; invisível quando
 * o <html> não tem `data-abertura`.
 */
export function AberturaConvite() {
  return (
    <div className="abertura" aria-hidden>
      <svg viewBox={MONOGRAMA_VIEWBOX} className="abertura__monograma" focusable={false}>
        <defs>
          <GradienteOuroSvg id="abertura-ouro" />
          <linearGradient id="abertura-luz" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#FFF6DC" stopOpacity="0" />
            <stop offset=".5" stopColor="#FFF6DC" stopOpacity=".9" />
            <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
          </linearGradient>
          <clipPath id="abertura-recorte">
            {ORDEM.map((glifo) => (
              <path key={glifo} d={MONOGRAMA_GLIFOS[glifo]} />
            ))}
          </clipPath>
        </defs>
        {ORDEM.map((glifo, i) => (
          <path
            key={glifo}
            d={MONOGRAMA_GLIFOS[glifo]}
            pathLength={1}
            className={`abertura__glifo abertura__glifo--${i + 1} ${glifo === "ecomercial" ? "abertura__glifo--ouro" : ""}`}
          />
        ))}
        <g clipPath="url(#abertura-recorte)">
          <rect
            className="abertura__luz"
            x={MONOGRAMA_CAIXA.x}
            y={MONOGRAMA_CAIXA.y}
            width={MONOGRAMA_CAIXA.largura * 0.35}
            height={MONOGRAMA_CAIXA.altura}
            fill="url(#abertura-luz)"
          />
        </g>
      </svg>
    </div>
  );
}
