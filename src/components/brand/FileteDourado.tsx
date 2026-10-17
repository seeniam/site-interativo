interface FileteDouradoProps {
  className?: string;
}

/**
 * A assinatura gráfica do site: filete de 1px × 56px com um losango de 5px no meio
 * (briefing 3.4). Sempre este, sempre igual. Puramente decorativo.
 */
export function FileteDourado({ className = "" }: FileteDouradoProps) {
  return <span aria-hidden className={`filete-dourado ${className}`} />;
}
