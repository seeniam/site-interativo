# Decisões do projeto

Registro de PO/PMO: o que cada fase entrega, o que fica fora, e as premissas assumidas.
Fonte de requisitos: `docs/BRIEFING.md`. O que falta do cliente está em `docs/PENDENCIAS.md`.

---

## Decisões gerais (valem para todas as fases)

| # | Decisão | Motivo |
|---|---------|--------|
| G1 | Casal: **Jaqueline & Diorlando**, nesta ordem; monograma **"J & D"**. | Informado pelo cliente na abertura do projeto. O briefing usava "N & L" como exemplo. |
| G2 | A foto do casal está em `public/images/casal.jpeg` (extensão `.jpeg`, não `.jpg`). O arquivo original não foi renomeado; o caminho correto fica em `src/config/casamento.ts`. | Não alterar arquivos do cliente sem necessidade. |
| G3 | Campos ainda não fornecidos pelo cliente são representados no config por um valor tipado `pendente("descrição")`, em vez de string vazia ou comentário `TODO`. A interface renderiza esses campos como placeholder elegante. | O briefing proíbe TODO esquecido no código e proíbe "undefined" na tela. Um tipo explícito obriga cada componente a tratar o caso pendente — o compilador cobra, não a memória. |
| G4 | O monograma não depende de fonte carregada: os contornos de "J", "D" (Cormorant Garamond) e "&" (Pinyon Script) são extraídos uma única vez por script (`scripts/extrair-glifos.ts`) e gravados como paths SVG. | Permite o efeito de "desenhar" com `stroke-dasharray` em contornos reais, sem custo de fonte no LCP e sem flash de fonte na abertura. |
| G5 | Tokens de cor existem com os nomes exatos do briefing (`--papel`, `--ouro`…) em `:root`, mapeados para utilitários Tailwind via `@theme inline` (`bg-papel`, `text-ouro-escuro`…). | Fidelidade ao briefing + ergonomia do Tailwind v4. |
| G6 | Gerenciador de pacotes: pnpm. Node local: v26. | Briefing, seção 5. |
| G7 | A mensagem pré-preenchida do WhatsApp mantém o 💛 que o cliente escreveu. É a única exceção à proibição de emoji, e o teste `scripts/higiene.test.ts` a isola pelo nome do campo. | A seção 9 proíbe emoji **na interface**. A mensagem é texto do casal que sai do celular do convidado, não aparece no site. Se o casal preferir sem, é uma linha no config. |
| G8 | A microcopy da interface (rótulos, botões, estados) vive em `src/config/textos.ts`; o conteúdo do casal em `src/config/casamento.ts`. Textos do `/design-system` (página interna de documentação) ficam na própria página. | Briefing 4: nenhum texto dentro de componente. Separar voz da interface de conteúdo do casal deixa claro o que o casal edita. |
| G9 | Valores enviados pelo cliente mas com dúvida aberta (ano, de-para das cotas, recebedor PIX…) entram como valor real, com comentário apontando para `PENDENCIAS.md` (C1–C7). Só o que **não** foi enviado vira `pendente(...)`. | Placeholder em dado que já existe esconderia informação real; a dúvida é rastreada no documento, não na tela. |
| G10 | Briefing atualizado em 2026-10-17 (dados reais do casal, três cotas, card único de local, regras do PIX por telefone). A versão anterior foi substituída em `docs/BRIEFING.md`. | Mensagem do cliente durante a Fase 0. |

---

## Fase 0 — Fundação

**Data:** 2026-10-17

### O que vai ser feito
1. Projeto Next.js (App Router, versão estável mais recente), TypeScript strict, Tailwind CSS v4, ESLint, pasta `src/`, alias `@/*`, pnpm.
2. Tokens da seção 3.2 (cores, gradiente-ouro oficial, sombra quente, raios) em `src/app/globals.css`; `color-scheme: light` forçado.
3. Fontes via `next/font/google` (Cormorant Garamond 300/400 + itálico, Jost 300/400/500, Pinyon Script), subsets `latin` + `latin-ext`, `display: swap`. Pinyon sem preload (só aparece no rodapé).
4. `src/components/brand/`:
   - `Monograma.tsx` — SVG desenhável (contornos reais) com variante estática e animada.
   - `FileteDourado.tsx` — filete 1px × 56px com losango de 5px, a assinatura gráfica.
   - `icons/` — seis ícones de linha próprios (aliança, taça, igreja/altar, buquê, presente, talheres), grade 24px, traço 1.5px.
5. `src/config/casamento.ts` tipado, com os dados enviados pelo casal e o que falta como `pendente(...)`.
   Enquanto o convite não existe, `/` redireciona para `/design-system` (temporário, removido na Fase 3).
6. Rota `/design-system` (noindex): paleta, escala tipográfica, botões em todos os estados, filete, monograma, ícones, card de presente e card de convidado.
7. `scripts/screenshots.ts` (Playwright, 390×844 / 768×1024 / 1440×900, salva em `docs/qa/fase-N/`).
8. Base de QA: scripts `lint`, `typecheck`, `test` (Vitest), `build`, `test:e2e` (Playwright).

### Fora do escopo desta fase
- Qualquer rota do produto (`/`, `/presentear`, etc.), layout raiz com cabeçalho/barra inferior/rodapé (Fase 2).
- Abertura animada do convite com `sessionStorage` (Fase 2) — aqui o monograma só demonstra o traçado.
- PIX, `.ics`, formatadores, schemas zod, Firebase (Fase 1).
- OG image, manifest, favicon, sitemap (Fase 7).

### Ajustes feitos durante a fase (briefing atualizado)
- `casamento.ts` passou a ter os dados reais: data, local, versículo, PIX, WhatsApp, três cotas com ícone próprio, `noivos.titulo` e `noivos.monograma`.
- O tipo `Local` é uma união discriminada por `cerimoniaNoMesmoLocal`: com `false`, o compilador exige os dados da cerimônia. O componente de um ou dois cards é da Fase 3.
- `CardPresente` ganhou a prop `icone` (cada cota usa um ícone diferente — briefing 6.2).
- O `/design-system` mostra as três cotas reais e lista as pendências lidas do config inteiro (`listarPendencias`), em vez de uma lista manual que envelhece.
- `lib/format.ts` foi antecipado só no mínimo que os cards precisam (BRL, dia/mês), com testes; a Fase 1 completa.

### Anotado para as próximas fases (veio no briefing novo)
- **Fase 1:** payload PIX com a chave em `+5598999676346`; testes dos limites (nome ≤ 25, cidade ≤ 15, chave formatada) e leitura do QR de volta com `jsqr`.
- **Fase 3:** card único do Espaço Max com "Copiar endereço", "Ver no mapa" e "Adicionar à agenda"; dois cards se `cerimoniaNoMesmoLocal` virar `false`.
- **Fase 4:** três cotas como três planos (não grade genérica), Ouro em destaque, linha "Prefere outro valor? Fale com a gente" → WhatsApp. Selo "mais escolhida" só com dado real.

### Premissas
- Os componentes de botão e cards criados para o design system são os **componentes reais** que as fases seguintes vão consumir, não maquetes.
- Os exemplos do card de convidado e do card de presente no `/design-system` usam dados de exemplo **rotulados como exemplo**; nunca aparecem em rota pública.
- Testes unitários desta fase cobrem o que é lógica nesta fase: helper `pendente`, e contraste AA dos pares de cor de texto (garante que ninguém troque `--ouro-escuro` por `--ouro` em texto).

### Fechamento da Fase 0 (2026-10-17)

**Portão:** `pnpm qa:fase` verde — Prettier, ESLint (0 avisos), `tsc` strict, Vitest 116/116,
`next build` (3 rotas estáticas), Playwright 48/48 em 390/768/1440 (inclui axe WCAG 2.2 AA).
Screenshots em `docs/qa/fase-0/` (390, 768, 1440), revisados contra as seções 3 e 9.

**Revisão adversarial** (4 revisores independentes + 1 cético por lente): 22 achados
confirmados, 9 descartados. Todos os confirmados foram corrigidos:
- "&" do monograma do tamanho das capitulares → reduzido a ~67% da altura do D (briefing 3.3), com teste de proporção.
- Erro de hidratação (React #418) com movimento reduzido → hook `usePrefereMenosMovimento` (`useSyncExternalStore`); o E2E agora falha em qualquer `pageerror` ou erro de console, e foi conferido que ele pega o bug antigo.
- Botão `carregando` deixava o formulário reenviar → vira `type="button"` enquanto carrega; teste de clique + Enter.
- Guarda de contraste com regex que nunca casava → varredura por bloco CSS, com teste que prova que o guarda detecta a combinação proibida.
- `--borda` na paleta documentada; gradiente do SVG conferido contra o CSS; `theme-color` vindo de `lib/tokens.ts` e testado.
- Letras do monograma lidas de `noivos.monograma` pelo script e conferidas por teste.
- Selo dos dados não enviados: "a definir" (antes "a confirmar", que em PENDENCIAS quer dizer outra coisa).
- `<dl>` do card de convidado válido; títulos sem pular nível; alvos de toque ≥ 44×44 (largura também); safe-area na calha; anel de foco conferido em todo focável (achou `transition-colors` desbotando o anel dos links); script de screenshots com porta livre e checagem de elemento vazando.

**Ponto levado ao cliente (não alterado):** o anel de foco em `--ouro` (#C9A227) sobre `--papel`
tem contraste de ~2,3:1, abaixo dos 3:1 que a WCAG 2.2 pede para indicador de foco. O briefing
(7.2) especifica exatamente `--ouro`, então foi mantido. Alternativa compatível com a identidade:
anel em `--ouro-escuro` (~4,7:1). Decisão do casal/briefing.
