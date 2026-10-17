/**
 * O gradiente-ouro oficial (briefing 3.2) como <linearGradient> SVG.
 * `rotate(10)` sobre o eixo horizontal reproduz o ângulo de 100deg do CSS.
 */
export function GradienteOuroSvg({ id }: { id: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0" gradientTransform="rotate(10 .5 .5)">
      <stop offset="0" stopColor="#8C6B2F" />
      <stop offset=".35" stopColor="#C9A227" />
      <stop offset=".5" stopColor="#E8D08A" />
      <stop offset=".68" stopColor="#C9A227" />
      <stop offset="1" stopColor="#8C6B2F" />
    </linearGradient>
  );
}
