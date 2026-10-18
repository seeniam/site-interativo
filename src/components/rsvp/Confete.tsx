/**
 * Confete dourado sutil (briefing 6.5): poucas peças, uma queda só, só CSS.
 * Decorativo (aria-hidden) e escondido com `prefers-reduced-motion`.
 * Posições fixas (pseudoaleatórias e determinísticas): o HTML do servidor é o mesmo do cliente.
 */
const PECAS = 26;

function sorteio(i: number, semente: number): number {
  const x = Math.sin(i * 12.9898 + semente * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function Confete() {
  return (
    <div aria-hidden className="confete">
      {Array.from({ length: PECAS }, (_, i) => {
        const estilo = {
          "--x": `${(sorteio(i, 1) * 100).toFixed(1)}%`,
          "--atraso": `${(sorteio(i, 2) * 0.8).toFixed(2)}s`,
          "--duracao": `${(2.4 + sorteio(i, 3) * 1.6).toFixed(2)}s`,
          "--giro": `${Math.round(sorteio(i, 4) * 900 - 450)}deg`,
          "--deriva": `${Math.round(sorteio(i, 5) * 80 - 40)}px`,
          "--tamanho": `${(6 + sorteio(i, 6) * 6).toFixed(1)}px`,
        } as React.CSSProperties;
        return <span key={i} className={`confete__peca confete__peca--${i % 3}`} style={estilo} />;
      })}
    </div>
  );
}
