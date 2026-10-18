import { IconeBase, type IconeProps } from "./IconeBase";

export type { IconeProps };

/** Par de alianças entrelaçadas, a da direita com uma pedra. */
export function IconeAlianca(props: IconeProps) {
  return (
    <IconeBase {...props}>
      <circle cx="9" cy="14.5" r="5.25" />
      <circle cx="15" cy="13.25" r="5.25" />
      <path d="M13.4 6.1 15 4.25l1.6 1.85L15 8z" />
    </IconeBase>
  );
}

/** Duas taças que se tocam no brinde. */
export function IconeTaca(props: IconeProps) {
  return (
    <IconeBase {...props}>
      <g transform="rotate(14 7.5 13)">
        <path d="M5.5 4h4l-.4 5.6a1.6 1.6 0 0 1-3.2 0z" />
        <path d="M7.5 11.2V19.5M5.5 19.5h4" />
      </g>
      <g transform="rotate(-14 16.5 13)">
        <path d="M14.5 4h4l-.4 5.6a1.6 1.6 0 0 1-3.2 0z" />
        <path d="M16.5 11.2V19.5M14.5 19.5h4" />
      </g>
      <path d="M12 1.5v1.6M9.7 2.4l.7.9M14.3 2.4l-.7.9" />
    </IconeBase>
  );
}

/** Capela com cruz e porta em arco. */
export function IconeIgreja(props: IconeProps) {
  return (
    <IconeBase {...props}>
      <path d="M12 2v4.5M10.25 3.75h3.5" />
      <path d="M4.75 11.25 12 6.5l7.25 4.75" />
      <path d="M6.5 10.25V20.5h11V10.25" />
      <path d="M10.25 20.5v-3.75a1.75 1.75 0 0 1 3.5 0v3.75" />
      <path d="M3.5 20.5h17" />
    </IconeBase>
  );
}

/** Buquê: três flores sobre o papel de embrulho amarrado. */
export function IconeBuque(props: IconeProps) {
  return (
    <IconeBase {...props}>
      <circle cx="12" cy="5.25" r="2.5" />
      <circle cx="7.25" cy="8" r="2.5" />
      <circle cx="16.75" cy="8" r="2.5" />
      <path d="M12 7.75V12M8.9 9.9 10.4 12M15.1 9.9 13.6 12" />
      <path d="M7.5 12h9L12 21.5z" />
      <path d="M10.1 16.25h3.8" />
    </IconeBase>
  );
}

/** Caixa de presente com laço. */
export function IconePresente(props: IconeProps) {
  return (
    <IconeBase {...props}>
      <rect x="3.5" y="8.25" width="17" height="4" rx="1" />
      <path d="M5 12.25v8.25h14v-8.25" />
      <path d="M12 8.25V20.5" />
      <path d="M12 8.25C10.7 5 6.9 4.6 7.1 6.6c.15 1.3 2.6 1.65 4.9 1.65zM12 8.25c1.3-3.25 5.1-3.65 4.9-1.65-.15 1.3-2.6 1.65-4.9 1.65z" />
    </IconeBase>
  );
}

/** Garfo e faca, lado a lado. */
export function IconeTalheres(props: IconeProps) {
  return (
    <IconeBase {...props}>
      <path d="M6 3v4.75a2.25 2.25 0 0 0 4.5 0V3M8.25 3v18" />
      <path d="M17.5 21V3c-2.1 1.4-3 4.6-3 7.6 0 1 .7 1.65 1.6 1.65h1.4" />
    </IconeBase>
  );
}

/** Envelope fechado com um coração no lacre — o carinho que vai junto quando não dá para ir. */
export function IconeCarta(props: IconeProps) {
  return (
    <IconeBase {...props}>
      <rect x="3" y="6" width="18" height="13" rx="1.5" />
      <path d="M3.5 6.75 12 13l8.5-6.25" />
      <path d="M12 17.1c-1.6-1-2.3-1.8-2.3-2.6 0-.65.5-1.1 1.1-1.1.5 0 .9.3 1.2.7.3-.4.7-.7 1.2-.7.6 0 1.1.45 1.1 1.1 0 .8-.7 1.6-2.3 2.6z" />
    </IconeBase>
  );
}

/** Ícones referenciáveis pelo config (ex.: o ícone de cada cota de presente). */
export const ICONES_POR_NOME = {
  alianca: IconeAlianca,
  taca: IconeTaca,
  igreja: IconeIgreja,
  buque: IconeBuque,
  presente: IconePresente,
  talheres: IconeTalheres,
  carta: IconeCarta,
} as const;

export type NomeIconeMarca = keyof typeof ICONES_POR_NOME;

export const ICONES_DA_MARCA = [
  { nome: "Aliança", Icone: IconeAlianca },
  { nome: "Taça", Icone: IconeTaca },
  { nome: "Igreja", Icone: IconeIgreja },
  { nome: "Buquê", Icone: IconeBuque },
  { nome: "Presente", Icone: IconePresente },
  { nome: "Talheres", Icone: IconeTalheres },
  { nome: "Carta", Icone: IconeCarta },
] as const;
