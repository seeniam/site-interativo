# PROMPT COMPLETO — Site de casamento Jaqueline & Diorlando

> Cole este arquivo INTEIRO no Claude Code. Ele contém a instrução de execução e o
> briefing completo. Antes de colar, salve a foto do casal em `public/images/casal.jpg`.

---

## INSTRUÇÃO DE EXECUÇÃO

Salve o texto a partir de "BRIEFING" (abaixo) como `docs/BRIEFING.md` e leia por inteiro
antes de qualquer coisa. Ele é a fonte de verdade e vence qualquer conflito com o que você
tiver em memória de versões anteriores deste projeto.

**MUDANÇA DE ARQUITETURA (a maior desde o início).** Saiu o Firebase. O backend é Postgres
gerenciado na Vercel (Neon), acessado SOMENTE por Route Handlers do Next. O navegador nunca
fala com o banco. Não existe `firestore.rules`, não existe Firebase Auth, não instale Java
nem Firebase CLI. A camada `lib/firebase` da Fase 1 deve ser REMOVIDA, não adaptada —
substitua por `lib/db/` com adaptador em memória quando não houver `DATABASE_URL`. Apague
também o `firestore.rules` e seus testes.

**MUDANÇA DE ARTE.** Não existe mais seção de galeria. O cliente tem UMA foto e não terá
outras. Leia "Economia da foto única" na seção 3.7: a foto aparece em exatamente dois
enquadramentos (herói inteiro + um recorte fechado da mão dela com a aliança, numa faixa
21:9 entre seções). "Nossa história" virou tipografia pura, sem foto. Não repita a mesma
imagem em mais lugares e não baixe foto de banco com casal aleatório.

**SEU PAPEL — cinco papéis acumulados, e você responde por todos em cada entrega:**
- **FRONTEND STAFF ENGINEER:** arquitetura limpa, TypeScript strict, zero `any`, componentes
  pequenos e puros, server/client components usados com critério, performance como requisito
  e não como ajuste final, nenhum TODO esquecido no código.
- **DESIGNER SÊNIOR:** nada de template. Cada tela tem hierarquia, ritmo, respiro e uma
  decisão estética deliberada. A seção 9 ("PROIBIDOS") é lei.
- **PO/PMO:** antes de cada fase, escreva em `docs/DECISOES.md` o que vai fazer, o que está
  fora do escopo e quais premissas assumiu. Nada de inventar requisito; o que faltar vira
  linha em `docs/PENDENCIAS.md` e um placeholder honesto no código.
- **QA SÊNIOR:** você testa o que você escreveu. Toda fase fecha com lint, typecheck, build,
  testes e screenshots do Playwright revisados por você mesmo contra a direção de arte. Se um
  screenshot ficou feio, conserte e tire de novo ANTES de dizer que terminou.
- **MOBILE WEB SÊNIOR:** mobile-first de verdade. Projete em 390px primeiro e só depois
  expanda. Alvos de toque ≥ 44px, sem scroll horizontal, sem layout shift, safe-area do
  iPhone respeitada, teclado do celular nunca cobrindo o campo em foco.

**Regra de ouro:** se ficar parecido com um template de casamento genérico, está errado e
deve ser refeito.

**O QUE EU QUERO AGORA.** Execute da Fase 1 (retrabalho) até a Fase 10, em sequência, sem
esperar minha liberação entre elas. Mantenha os portões: cada fase só é dada por fechada com
lint, typecheck, testes, build e screenshots revisados POR VOCÊ contra as seções 3 e 9, com
commit próprio e `DECISOES.md` atualizado. Não pule fase, não implemente fase futura
adiantado, não feche fase com teste falhando.

**PARE E ME PERGUNTE apenas se:**
- uma decisão for irreversível e puder razoavelmente ir para os dois lados;
- o briefing se contradisser em algo que muda o produto;
- uma correção exigir desfazer trabalho de uma fase já fechada;
- você identificar risco de segurança ou de dado pessoal — nesse caso **feche o buraco
  primeiro e me conte depois**, não espere resposta para proteger dado.

Fora disso, decida, registre a premissa em `DECISOES.md` e siga.

**DADOS DO CASAL — TUDO CONFIRMADO, NÃO PERGUNTE DE NOVO:**
- 21/12/2026, **segunda-feira, intencional**. Deixe claro no FAQ que é dia útil.
- Colossenses 3:14.
- Cotas: Bronze R$ 150, Prata R$ 200, Ouro R$ 250.
- Recebedora do PIX: "Jaqueline Barros Alvares" (24 caracteres, cabe no limite de 25 — não
  abrevie, não "melhore").
- WhatsApp de comprovante = mesmo número da chave PIX.
- Cerimônia e recepção no Espaço Max, a partir das 16h30.

**AINDA "A DEFINIR" — só três, nenhuma trava você:** marcos de "nossa história" (só texto),
traje e prazo do RSVP. Sem os marcos, a seção inteira NÃO é renderizada — nada de marco
inventado. Use o vocabulário da seção 4 ("a confirmar" × "a definir", com estados visuais
distintos) e mantenha `PENDENCIAS.md` em dia. A única foto é `public/images/casal.jpg`.

**VARIÁVEIS DE AMBIENTE:** crie `.env.example` versionado com `DATABASE_URL`,
`SENHA_NOIVOS`, `SESSAO_SECRET`, `RSVP_SALT` e `DEMO`. Nenhuma com prefixo `NEXT_PUBLIC_`.
O projeto tem que rodar e demonstrar sem nenhuma delas preenchida (modo demonstração da
seção 5).

**AO FINAL, me entregue:**
1. um resumo por fase, com o hash do commit e o que ficou de fora;
2. a lista do que você decidiu sozinho, e com que premissa;
3. o passo a passo do deploy na Vercel, incluindo onde rodar o `db/schema.sql`;
4. os caminhos das pastas de screenshots de cada fase;
5. o roteiro de 2 minutos para eu apresentar ao casal.

Se em algum momento você perceber que uma instrução do briefing produz resultado pior que a
alternativa, não a siga em silêncio nem a ignore: aplique o que está escrito, registre a
discordância em `DECISOES.md` e me diga no relatório final. A exceção é **acessibilidade e
dado pessoal**, onde o correto vence o documento e você corrige na hora.

**Comece pelo retrabalho da Fase 1.**

---

# BRIEFING

## 1. O que é este projeto

Um **convite de casamento digital** — site de uma página de entrada + fluxos de presente e
confirmação de presença. Referência funcional (apenas de ESCOPO, não de visual):
`https://casamento-neemias.web.app/`.

A referência resolve o problema, mas é visualmente simples. **Este projeto precisa ser
premium**: cheio de amor, movimento com intenção, sensação de peça feita à mão para
aquele casal específico. O visitante típico abre o link no WhatsApp, no celular,
com 4G ruim, e decide em 10 segundos se aquilo parece especial.

### Métrica de sucesso
1. A noiva abre no celular e manda print para as amigas.
2. Convidado confirma presença em **menos de 40 segundos**, sem erro, sem dúvida.
3. Convidado presenteia por PIX em **menos de 30 segundos** (copiar código ou ler QR).
4. Lighthouse mobile ≥ 95 em Performance, Acessibilidade e Boas Práticas.

---

## 2. Mapa de rotas (auditado na referência + o que vamos acrescentar)

| Rota | Existe na referência? | O que faz aqui |
|------|----------------------|----------------|
| `/` | sim | Convite: herói com foto do casal, nomes, versículo, data/hora, contagem regressiva, local, CTAs "Presentear" e "Confirmar presença", nossa história, trajes, dúvidas frequentes |
| `/presentear` | sim | Lista de presentes (cotas em PIX + presentes nomeados) |
| `/confirmar-presente/[id]` | sim | Tela do PIX: QR Code gerado na hora, código copia-e-cola, botão "Copiar", botão "Enviar comprovante" (WhatsApp) |
| `/confirmar-presenca` | sim | Formulário de RSVP (nome, telefone, vai comparecer, quem convidou, acompanhantes) |
| `/agradecimento` | sim | Confirmação com celebração sutil (confete dourado) e próximos passos |
| `/convidados` | sim, mas cru | **Lista de quem confirmou presença** — é a rota que o cliente pediu para existir "de verdade": contadores, busca, filtros, agrupamento, exportar CSV |
| `/*` (404) | sim | Página não encontrada, com a mesma identidade e caminho de volta |

> A referência já tinha `/convidados` e `/agradecimento` escondidas (não estavam no menu).
> Aqui `/convidados` vira uma tela de verdade, descrita na seção 6.

---

## 3. Identidade visual — "Dourado & Branco"

> **Este capítulo manda em tudo que é visual.** Em caso de conflito com qualquer outra
> seção, este vence.

### 3.1 Conceito
**"Luz de fim de tarde em papel de algodão."** Três ingredientes:
1. **Branco de papel**, não branco de tela. Fundo levemente quente, superfícies limpas, muito respiro.
2. **Dourado como luz, não como tinta.** Ouro aparece em filetes de 1px, em gradientes sutis de
   texto, em um brilho que atravessa o monograma — **nunca** como fundo chapado amarelo,
   nunca como "botão dourado brilhante de template".
3. **A foto do casal como coração.** Tratada com unidade (grade quente, leve), ocupando espaço
   generoso, com máscara/arco quando fizer sentido.

### 3.2 Paleta (tokens CSS)

| Token | Hex | Papel |
|-------|-----|-------|
| `--branco` | `#FFFFFF` | Superfícies, cards |
| `--papel` | `#FCFAF7` | Fundo da página (branco quente, quase imperceptível) |
| `--linho` | `#F4EFE7` | Seções alternadas, estados de hover suaves |
| `--ouro` | `#C9A227` | Cor da marca; filetes, ícones, destaques |
| `--ouro-claro` | `#E8D08A` | Ponto alto do gradiente, brilho |
| `--ouro-escuro` | `#8C6B2F` | Texto dourado sobre claro (contraste AA), pressed |
| `--champanhe` | `#F7EEDC` | Fundo de realce, seleção, badges |
| `--tinta` | `#17140F` | Texto principal (quase preto, quente) |
| `--fumaca` | `#6E675C` | Texto secundário |
| `--borda` | `rgba(23,20,15,.10)` | Bordas |
| `--sucesso` | `#4F7A4A` | Confirmado |
| `--recusa` | `#9A5B4C` | Não poderá ir (terroso, nunca vermelho de erro) |

- **Gradiente-ouro oficial** (usar sempre o mesmo):
  `linear-gradient(100deg, #8C6B2F 0%, #C9A227 35%, #E8D08A 50%, #C9A227 68%, #8C6B2F 100%)`
  Aplicado em: monograma, filetes divisores, borda do card de presente em destaque,
  e em `background-clip:text` apenas em **números e no "&"**, nunca em parágrafos.
- **Sombras quentes**, nunca cinza puro:
  `0 1px 2px rgb(23 20 15 / .05), 0 18px 40px -24px rgb(23 20 15 / .22)`
- **Sem modo escuro.** O site é um convite impresso em luz. (Respeitar `prefers-color-scheme`
  apenas para não quebrar: forçar o tema claro e declarar `color-scheme: light`.)
- Contraste: texto dourado só em `--ouro-escuro` sobre fundo claro. `--ouro` puro é para
  filetes, ícones de 1.5px e elementos não-textuais.

### 3.3 Tipografia

| Papel | Fonte (Google Fonts via `next/font`) | Uso |
|-------|--------------------------------------|-----|
| Display | **Cormorant Garamond** 300/400, italic disponível | Nomes dos noivos, títulos de seção, números da contagem regressiva |
| Interface | **Jost** 300/400/500 | Todo o resto: textos, botões, formulários, tabelas |
| Assinatura | **Pinyon Script** | **Somente** o "&" do monograma e a assinatura do rodapé. Em nenhum outro lugar. |

- Escala (base 16, razão 1.25): 12 · 14 · 16 · 20 · 25 · 31 · 39 · 49 · 61 · 76.
- Nomes dos noivos no herói: Cormorant 300, 49px no celular / 76px no desktop,
  `letter-spacing: .02em`, em duas linhas com o "&" em Pinyon entre elas, menor e dourado.
- Títulos em sentence case. Rótulos de seção podem usar versalete discreto
  (Jost 300, 12px, `letter-spacing:.22em`, cor `--fumaca`) — **no máximo um por seção**.
- `font-variant-numeric: tabular-nums` em contagem regressiva, valores em R$ e tabelas.
- Linha de texto com no máximo ~62 caracteres.

### 3.4 Forma e layout
- Raios: seções/containers `24px` · cards `16px` · botões e campos `999px` (pílula) ·
  imagens em arco quando forem retrato (`border-radius: 50% 50% 16px 16px / 22% 22% 16px 16px`).
- Grade de 8px. Respiro vertical generoso: seções com `clamp(72px, 12vw, 140px)` de padding.
- **Filete dourado** como separador recorrente: 1px, 56px de largura, centralizado,
  com um losango de 5px no meio. É a assinatura gráfica do site — reutilizar sempre a mesma.
- Containers: 100% até 640px, depois `max-width: 1120px`.

### 3.5 Movimento (muito, mas com intenção)
Biblioteca: **motion** (`framer-motion`). Easing padrão `cubic-bezier(.22,1,.36,1)`.

Momentos orquestrados (os que valem a pena):
1. **Abertura do convite (uma vez por sessão, ~1.6s):** tela `--papel`, o monograma
   "N & L" se desenha (`stroke-dasharray` animado), um brilho dourado cruza da esquerda
   para a direita, o monograma sobe para o topo e o herói se revela de baixo com a foto
   em leve `scale(1.06) → 1`. Guardar em `sessionStorage` para não repetir.
2. **Contagem regressiva:** só os dígitos que mudam viram (flip vertical de 320ms).
3. **Scroll reveal discreto:** `opacity 0→1` + `translateY(16px→0)`, stagger de 60ms,
   **uma vez só** (`viewport={{ once: true }}`). Nada de elementos pulando a cada rolagem.
4. **Copiar PIX:** o botão vira um "check" dourado com `layout` animation e o código
   recebe um flash de `--champanhe` que desaparece em 600ms.
5. **RSVP enviado:** transição para `/agradecimento` com confete dourado (canvas leve,
   ~2.5s, no máximo 120 partículas, para sozinho) e o monograma pulsando uma vez.
6. **Recorte de detalhe:** ao entrar na viewport, a faixa 21:9 revela com um
   `clip-path` que abre do centro (~600ms), uma vez só.

Regras: nada de parallax pesado, nada de hover que levanta todos os cards, nada de
contador animando em todo lugar. **Respeitar `prefers-reduced-motion`**: nesse caso,
tudo vira fade simples de 150ms e o confete não roda.

### 3.6 Ícones
- `lucide-react` com `strokeWidth={1.5}` para interface (copiar, calendário, mapa, busca, filtro).
- **Seis ícones de linha próprios**, desenhados em SVG em `components/brand/icons/`,
  todos no mesmo peso (1.5px) e grade (24px), para as seções: aliança, taça, igreja/altar,
  buquê, presente, par de talheres. **Emoji é proibido** em qualquer lugar da interface
  (a referência usa ❤️ e 📍 — aqui não).

### 3.7 Fotografia
- Foto do casal em `public/images/casal.jpg` (retrato 3:4, jardim à noite, luz quente).
- Tratamento uniforme por CSS: `filter: saturate(1.04) contrast(1.03)` e, no herói,
  um `overlay` de `linear-gradient(to top, rgb(23 20 15 / .55), transparent 55%)`
  para o texto branco ter contraste real.
- `next/image` com AVIF/WebP, `priority` só no herói, `placeholder="blur"`, `sizes` corretos.
- Proporções fixas: herói 3:4 no celular e 16:10 no desktop (crop pelo `object-position`).

**Economia da foto única (restrição confirmada pelo cliente).** Existe UMA foto, e não
haverá outras. Ela aparece em exatamente **dois lugares**, com enquadramentos que não se
parecem:
1. **Herói** — a foto inteira, respiração completa, é o primeiro impacto.
2. **Um recorte fechado de detalhe** — a mão dela sobre o peito dele, com a aliança —
   usado uma única vez, como textura entre duas seções (faixa larga e baixa, tipo 21:9).
   É o mesmo arquivo, mas ninguém percebe que é a mesma imagem.
Mais que isso cansa e denuncia a escassez. A OG image reusa o herói, o que não conta
porque vive fora do site.
**Não existe seção de galeria.** Seis quadrados da mesma foto é pior do que não ter
seção. Em vez dela, o lugar que sobra no `/` é ocupado pelo que temos de verdade:
contagem regressiva, história e dúvidas frequentes respiram mais.
- Faltando outras fotos: usar **apenas** a do casal em composições diferentes e registrar
  em `docs/PENDENCIAS.md` o que o cliente precisa enviar. **Nunca** usar foto de banco de
  imagem com casal aleatório.

---

## 4. Conteúdo e configuração (fonte única de verdade)

Criar `src/config/casamento.ts` tipado, com **todo** o conteúdo editável em um só lugar.
Nenhum texto, preço, telefone ou data pode estar escrito dentro de um componente.

```ts
export const casamento = {
  noivos: {
    ela: "Jaqueline",
    ele: "Diorlando",
    // A ordem no convite é SEMPRE "Jaqueline & Diorlando" (ela primeiro), em todo lugar:
    // herói, <title>, OG image, rodapé, mensagem do WhatsApp.
    titulo: "Jaqueline & Diorlando",
    monograma: { esquerda: "J", direita: "D" }, // o "&" é renderizado em Pinyon Script
    sobrenomes: { ela: "", ele: "" },           // opcional, só se quiserem no rodapé
  },

  // Confirmado pelo casal: 21/12/2026, uma segunda-feira. Não é engano.
  data: "2026-12-21T16:30:00-03:00",
  horarioTexto: "a partir das 16h30",

  local: {
    nome: "Espaço Max",
    endereco: "Av. Dois, 13 — Casa 5, Quadra, Itapiracó, São Luís — MA, 65054-866",
    enderecoCurto: "Chácara Itapiracó, São Luís — MA",
    mapsUrl: "https://maps.app.goo.gl/B53pcb3Xwk8eaSpu6",
    facebook: "https://www.facebook.com/458117960894623",
    // Confirmado: cerimônia e recepção no Espaço Max, a partir das 16h30.
    cerimoniaNoMesmoLocal: true,
  },

  versiculo: {
    texto: "E, acima de tudo, tenham amor, pois o amor une perfeitamente todas as coisas.",
    referencia: "Colossenses 3:14", // confirmado pelo casal
  },

  pix: {
    chave: "98999676346",          // chave do tipo TELEFONE
    chaveFormatoBrCode: "+5598999676346", // é ASSIM que entra no payload EMV (campo 01)
    nomeRecebedor: "JAQUELINE BARROS ALVARES", // confirmado; 24 caracteres, cabe no limite de 25
    cidade: "SAO LUIS",            // sem acento, maiúsculas, máx. 15 caracteres
  },

  whatsapp: {
    numero: "5598999676346",       // confirmado: mesmo número da chave PIX
    mensagemComprovante: "Oi! Acabei de enviar o presente de vocês 💛 Segue o comprovante:",
  },

  // Confirmado pelo casal: Bronze 150, Prata 200, Ouro 250.
  presentes: [
    { id: "bronze", tipo: "cota", titulo: "Cota Bronze", valor: 150, descricao: "", icone: "taca" },
    { id: "prata",  tipo: "cota", titulo: "Cota Prata",  valor: 200, descricao: "", icone: "alianca" },
    { id: "ouro",   tipo: "cota", titulo: "Cota Ouro",   valor: 250, descricao: "", icone: "presente", destaque: true },
  ],

  historia: [ /* ⚠️ A DEFINIR: 3 a 5 marcos, SÓ TEXTO (ano + título + uma frase) */ ],
  // Sem galeria: existe uma única foto. Ver "Economia da foto única" na seção 3.7.
  trajes: { titulo: "Traje social", descricao: "TODO", paleta: ["#C9A227", "#FFFFFF"] }, // ⚠️
  faq: [ /* ⚠️ PENDENTE */ ],
  rsvp: { prazo: "TODO", maxAcompanhantes: 4 }, // ⚠️
} as const;
```

**Tudo que estiver como `TODO cliente` entra em `docs/PENDENCIAS.md`** e aparece na
interface como um placeholder elegante (nunca "undefined", nunca quebrado).

**Vocabulário obrigatório (vale no código, nos selos da interface e no `PENDENCIAS.md`):**
- **"a confirmar"** = o dado chegou, mas há dúvida sobre ele (ano, referência do versículo,
  de-para das cotas, nome do recebedor do PIX, número do WhatsApp, local da cerimônia).
- **"a definir"** = o dado ainda não existe (nossa história, trajes, prazo do RSVP).
Os dois estados são visualmente distintos: "a confirmar" em `--champanhe` com texto
`--ouro-escuro`; "a definir" em `--linho` com texto `--fumaca`. Nunca usar um termo pelo outro.

---

## 5. Stack técnica

- **Next.js (App Router, versão estável mais recente) + TypeScript strict**
- **Tailwind CSS v4** com os tokens da seção 3.2 como variáveis CSS em `@theme`
- **motion** (framer-motion) para animação · **lucide-react** para ícones
- **react-hook-form + zod** para formulários · **sonner** para toasts
- **Banco: Postgres gerenciado criado dentro da própria Vercel** (Neon, pelo Marketplace).
  A Vercel injeta a connection string nas variáveis de ambiente sozinha — você não copia
  chave nenhuma. Driver `@neondatabase/serverless`, SQL escrito à mão (sem ORM: o schema
  tem três tabelas, um ORM aqui só adiciona peça).

  ### Por que não um SDK de banco no navegador
  > A versão anterior deste briefing usava Firestore com o SDK no cliente e errou ao
  > liberar leitura pública em `confirmacoes`, deixando nome e telefone de todos os
  > convidados acessíveis pelo console do navegador. A troca para Route Handlers remove
  > a classe inteira do problema: **o navegador nunca fala com o banco.** Não existe
  > arquivo de regras para acertar; quem decide o que sai é o código do servidor.

  ### Schema (`db/schema.sql`, rodado uma vez)
  ```sql
  create table confirmacoes (
    id            bigserial primary key,
    nome          text        not null,
    telefone      text        not null,
    telefone_hash text        not null,          -- sha256(telefone + RSVP_SALT do servidor)
    vai_comparecer boolean    not null,
    acompanhantes jsonb       not null default '[]'::jsonb,
    quem_convidou text,
    recado        text,
    atualiza_de   text,                          -- hash da resposta que esta substitui
    criado_em     timestamptz not null default now()
  );
  create index on confirmacoes (telefone_hash);
  create table presentes_reservados (
    cota_id      text primary key,
    reservado_em timestamptz not null default now()
  );
  ```

  ### Route Handlers (`app/api/...`) — a única porta para o banco
  - `POST /api/rsvp` — valida com o mesmo schema zod do formulário, **no servidor**,
    calcula o `telefone_hash` e grava. Honeypot + limite por IP (3 envios por minuto,
    em memória já basta). Devolve só `{ ok: true }`.
  - `POST /api/rsvp/verificar` — recebe o telefone, devolve **apenas**
    `{ jaConfirmou: boolean, em?: string }`. O telefone nunca volta, nome nenhum volta,
    e o salt vive só no servidor. Limite por IP também, para não virar sonda de telefone.
  - `GET /api/presentes` — público, devolve só a lista de ids já reservados.
  - `POST /api/presentes/[id]/reservar` — marca a cota.
  - `GET /api/convidados` — **exige a sessão dos noivos** (abaixo). Sem cookie válido,
    responde 401 e pronto; nenhum dado sai.

  ### Acesso dos noivos (simples e suficiente)
  Uma senha única compartilhada pelos dois, guardada em `SENHA_NOIVOS` (variável de
  ambiente do servidor, nunca `NEXT_PUBLIC_`). `POST /api/entrar` compara e devolve um
  **cookie httpOnly, secure, sameSite=lax, assinado** com `SESSAO_SECRET`, válido 30 dias.
  Sem cadastro, sem conta para criar, sem e-mail. A proteção real é o 401 do servidor;
  a tela de login é só a porta.

  ### Regras que não se negociam
  - Nenhuma variável com segredo pode ter o prefixo `NEXT_PUBLIC_`.
  - Nenhum `select *` de `confirmacoes` em rota pública.
  - Validação sempre repetida no servidor, mesmo já existindo no formulário.
  - `.env.example` versionado; `.env.local` no `.gitignore`.
  - **Testes obrigatórios** das rotas (Vitest + banco de teste ou `pg-mem`): visitante
    anônimo grava RSVP válido, é rejeitado com payload inválido, leva 401 em
    `/api/convidados`, e `/api/rsvp/verificar` devolve só o booleano e a data.
    Rota sem teste de autorização não conta como pronta.

  ### Modo demonstração (para o roteiro de 2 minutos)
  Com `DEMO=true` (ou sem `DATABASE_URL`), a aplicação sobe no adaptador em memória com
  seed: ~12 confirmações fictícias, nomes claramente inventados, telefones no padrão
  `(98) 90000-00XX`. A senha dos noivos nesse modo é `demo`, exibida na própria tela de
  login num aviso discreto ("modo demonstração"). Esse aviso **só** existe quando `DEMO`
  está ligado — jamais aparece em produção, e há teste garantindo isso.

  ### Desenvolvimento local
  A camada de dados fica atrás de uma interface em `lib/db/`. Sem `DATABASE_URL`, ela cai
  num adaptador em memória com seed, para rodar a demo sem banco nenhum.
- **PIX gerado no cliente**: implementar o payload **BR Code (EMV)** em `lib/pix.ts`
  — função pura `gerarPayloadPix({ chave, nome, cidade, valor, txid })` com **CRC16-CCITT (0x1021)**,
  coberta por teste unitário comparando com um payload conhecido. QR via `qrcode` (canvas/SVG).
  **Atenção à chave de telefone**: no payload EMV ela entra como `+5598999676346`
  (com `+55`, sem espaço, sem parênteses, sem traço) — chave crua `98999676346` gera um
  QR que o banco recusa. O nome do recebedor vai em MAIÚSCULAS sem acento, máx. 25
  caracteres; a cidade, máx. 15. Escrever um teste que valide os três limites e que
  **leia um QR gerado de volta** (`jsqr` em Node) comparando com o payload esperado.
- **date-fns** com locale pt-BR.
- Testes: **Vitest** (unitários: pix, formatadores, schemas zod) + **Playwright**
  (E2E e screenshots em 390×844, 768×1024, 1440×900).
- Deploy: **Vercel** (plano Hobby; o site é presente, não trabalho cobrado). Node LTS, `pnpm`.
  Push no GitHub → importar na Vercel → criar o Postgres pelo Marketplace → publicar.

---

## 6. Especificação tela a tela

### 6.1 `/` — O convite
Ordem das seções (mobile-first, tudo em coluna no celular):

1. **Abertura/monograma** (animação da seção 3.5.1).
2. **Herói**: foto do casal ocupando 100vh no celular (com `dvh`), nomes em Cormorant sobre
   o gradiente escuro, versículo em itálico, data por extenso ("19 de julho de 2027 · sábado · 16h30").
   Duas CTAs lado a lado: **Confirmar presença** (sólido, `--tinta` com texto branco e filete
   dourado interno) e **Presentear** (contorno dourado). Indicador de rolagem discreto.
3. **Contagem regressiva**: quatro blocos (dias · horas · minutos · segundos), números em
   Cormorant 49px com tabular-nums, rótulos em versalete. Quando a data passar, troca para
   "Hoje é o dia" e, depois, para "Casados desde 19.07.2027" — tratar os três estados.
4. **Nossa história**: timeline vertical com filete dourado, 3 a 5 marcos, **só texto**
   (não há fotos). Sem foto, o peso recai na tipografia: ano em Cormorant grande e
   dourado, título em Jost 500, frase em até duas linhas, muito respiro entre marcos.
   O losango do filete marca cada ponto. Enquanto o casal não mandar o conteúdo, a seção
   inteira não é renderizada — nada de marco inventado. Fica listada como "a definir".
5. **Quando e onde**: card único do **Espaço Max** (o config tem `cerimoniaNoMesmoLocal`;
   se virar `false`, o componente passa a renderizar dois cards lado a lado — já deixe
   preparado). Nome do espaço em Cormorant, endereço completo, ícone próprio de taça,
   botão "Ver no mapa" (abre `mapsUrl`) e **"Adicionar à agenda"** gerando um `.ics` no
   cliente + link do Google Calendar. Mapa embedado só carrega depois do clique
   (`lite mode`), para não pesar o LCP. O endereço precisa ser **copiável com um toque**
   (botão "Copiar endereço") — é o que o convidado manda para o motorista de aplicativo.
6. **Trajes**: descrição curta + amostras de cor (círculos dourado/branco com o nome da cor).
7. **Presentes (teaser)**: três cotas em destaque + botão "Ver lista completa".
8. **Dúvidas frequentes**: acordeão acessível (`<details>` estilizado ou Radix), 4 a 6 perguntas.
9. **RSVP (teaser)**: faixa com prazo ("Confirme até 00/00") e botão grande.
10. **Rodapé**: monograma, assinatura em Pinyon ("com amor, X & Y"), link discreto para
    `/convidados`, créditos.

Navegação: no celular, **barra inferior fixa** com três ações (Convite · Presentear · Confirmar),
que aparece só depois do herói, com `backdrop-filter` e safe-area. No desktop, cabeçalho
que encolhe ao rolar.

### 6.2 `/presentear`
- Cabeçalho curto e afetuoso (sem texto de marketing).
- Grade de presentes: 1 coluna no celular, 2 em 768px, 3 em 1120px.
- Card: foto (ou ícone próprio de presente sobre `--champanhe` quando não houver foto),
  título, valor em R$ com tabular-nums, frase do casal, botão **Presentear**.
- **Três cotas nomeadas**: Bronze R$ 150 · Prata R$ 200 · Ouro R$ 250. São só três, então
  **não** use uma grade genérica: trate como três planos, com a cota Ouro em destaque
  (filete dourado mais presente, leve elevação, selo "mais escolhida" só se for verdade).
  No celular viram três cartões empilhados ocupando a largura inteira, não um carrossel.
- Cada cota tem um ícone próprio diferente (taça, aliança, presente) — nunca o mesmo ícone
  repetido em tamanhos diferentes.
- Abaixo das cotas, uma linha discreta: "Prefere outro valor? Fale com a gente" → WhatsApp.
- Estado "já presenteado" (lido de `presentes_reservados`): card em `--linho`, selo dourado
  "Presenteado com carinho", botão desabilitado — e um texto que convida a escolher outro.
- Filtro simples por faixa de valor (chips em pílula).

### 6.3 `/confirmar-presente/[id]`
- Resumo do que está sendo presenteado, com o valor em destaque (Cormorant).
- **QR Code do PIX gerado na hora** (não imagem estática), em card branco com filete dourado.
- **Código copia-e-cola** em bloco selecionável, truncado visualmente com fade, e botão
  **Copiar código PIX** (feedback da seção 3.5.4 + toast "Código copiado").
- Botão **Enviar comprovante** → `wa.me` com mensagem pré-preenchida
  (nome do presente + valor + espaço para o nome do convidado).
- Passo a passo em três linhas ("Abra seu banco · Escolha PIX copia e cola · Cole e confirme").
- Botão discreto "Escolher outro presente".
- `generateStaticParams` para todos os ids; id inválido → 404 com a identidade do site.

### 6.4 `/confirmar-presenca`
Formulário em **três passos** com barra de progresso em filete dourado:

1. **Quem é você**: nome completo (obrigatório, mín. 3 letras, aceita acento),
   telefone com máscara `(99) 99999-9999` e `inputMode="tel"`.
2. **Você vem?**: dois cartões grandes e tocáveis — "Sim, estarei lá" / "Não poderei ir"
   (nunca um `select` cinza). Se "não", pula direto para a mensagem.
3. **Detalhes**: quantos acompanhantes (stepper grande −/+, limite do config) com um campo
   de nome por acompanhante; "Quem convidou?" (autocomplete entre noivo/noiva, com opção
   de digitar); recado opcional para o casal (máx. 240 caracteres com contador).

Regras de UX obrigatórias:
- Validação em `onBlur`, mensagem de erro humana ("Faltou o telefone pra gente te avisar de mudanças").
- Botão de envio com estado `carregando` e proteção contra duplo clique.
- **Idempotência**: no passo 1, ao sair do campo de telefone, chamar
  `POST /api/rsvp/verificar` e, se já houver resposta, mostrar "Você já confirmou em 00/00.
  Quer atualizar sua resposta?". Atualizar grava uma linha nova com `atualiza_de`,
  nunca sobrescreve a anterior.
- Campo honeypot escondido + limite simples por `sessionStorage` contra spam.
- Erro de rede: manter os dados preenchidos e oferecer "Tentar de novo".
- Sucesso → `/agradecimento?nome=...` (só o primeiro nome, nada sensível na URL).

### 6.5 `/agradecimento`
- "Obrigado, {primeiro nome}!" em Cormorant, confete dourado sutil, monograma.
- Dois caminhos claros: **Presentear os noivos** e **Voltar ao convite**.
- Botão "Adicionar à agenda" repetido aqui (é o momento de maior intenção).
- Se a pessoa respondeu "não poderei ir", o texto muda para algo caloroso e **sem confete**.

### 6.6 `/convidados` — a lista de quem confirmou  ★ rota pedida pelo cliente
É a tela mais "produto" do site. Mobile-first de verdade.

- **Três contadores** no topo, em cards com filete dourado: *Confirmados* (pessoas, somando
  acompanhantes), *Não poderão ir*, *Respostas no total*. Números em Cormorant, com um
  contador que anima **uma única vez** ao entrar.
- **Busca** por nome (com `useDeferredValue`, sem botão) e **filtros em chips**:
  Todos · Confirmados · Não vão · Por quem convidou.
- **Visualização dupla**: no celular, **lista de cartões** (nome, selo de status com ponto +
  texto, acompanhantes como "+2", quem convidou, data da confirmação). No desktop ≥1024px,
  **tabela** densa e bem tratada: cabeçalho fixo, zebra em `--papel`, números à direita,
  ordenação por nome/data, 25 por página.
- **Agrupamento opcional** por "quem convidou", com subtotal por grupo.
- **Exportar CSV** (gerado no cliente, `;` como separador, UTF-8 com BOM para abrir no Excel).
- **Acesso restrito aos noivos.** A rota exige a sessão da seção 5 (senha única + cookie
  assinado). Sem cookie, a página mostra uma tela de login sóbria com o monograma, e o
  `GET /api/convidados` responde 401 — nem lista, nem contadores, nem total.
- Telefone exibido mascarado (`(98) 9****-**94`) mesmo depois do login, com um botão
  "Mostrar telefones" — aqui sim como camada de discrição, para a tela não ficar cheia de
  número exposto quando alguém olha por cima do ombro ou quando os noivos tiram um print.
- **Atualizar**: botão com ícone de refresh + revalidação automática a cada 15s enquanto a
  aba estiver visível (`document.visibilityState`), que numa lista de casamento é
  indistinguível de tempo real e não gasta conexão aberta.
- **Estados**: carregando (skeletons com o shimmer dourado), vazio ("Ninguém confirmou ainda.
  Compartilhe o convite 💛" — sem emoji: usar o ícone próprio de aliança), e erro com "Tentar de novo".

### 6.7 404
Monograma, "Esta página não existe no nosso convite", botão de volta. Mesma identidade.

---

## 7. Acessibilidade e mobile (não-negociáveis)
1. Contraste AA em todo texto (verificar o dourado — texto dourado só em `--ouro-escuro`).
2. Foco visível e bonito: anel de 2px em **`--ouro-escuro`** com 2px de deslocamento, em
   **todos** os elementos interativos. (Correção: a versão anterior deste briefing pedia
   `--ouro`, que dá ~2,3:1 sobre `--papel` e reprova no WCAG 1.4.11, que exige 3:1 para
   elemento não-textual. `--ouro-escuro` dá ~4,7:1.) Navegação completa por teclado,
   inclusive lightbox e acordeão. **Acessibilidade vence o token:** se qualquer outra regra
   deste documento levar a um contraste abaixo do mínimo, trate como erro do documento,
   corrija e registre em `DECISOES.md`.
3. HTML semântico: `<main>`, `<nav>`, `<section aria-labelledby>`, `<h1>` único por rota.
4. Imagens com `alt` descritivo em português. Ícones decorativos com `aria-hidden`.
5. Toda animação atrás de `prefers-reduced-motion`.
6. `aria-live="polite"` para toasts e para o resultado da busca em `/convidados`.
7. Sem scroll horizontal em 320px. `dvh` em vez de `vh` no herói. `env(safe-area-inset-*)`
   na barra inferior. Campo em foco nunca coberto pelo teclado (`scroll-margin-bottom`).
8. Teclados corretos: `inputMode="tel"`, `autoComplete="name" | "tel"`, `enterKeyHint`.

## 8. Performance e SEO
- LCP < 2.0s em 4G simulado. Herói com `priority` e `fetchPriority="high"`; tudo abaixo com `lazy`.
- Fontes com `display: swap` e subset latin + latin-ext.
- Confete, QR e mapa carregados com `dynamic(() => ..., { ssr: false })`.
- `next/image` sempre; nenhuma imagem acima de 300KB depois da otimização.
- Metadados completos + **OG image** (1200×630) com a foto do casal, o monograma e a data,
  gerada com `next/og` — é o cartão que aparece no WhatsApp, é o primeiro contato real.
- `manifest.json`, favicon com o monograma, `theme-color` `--papel`.
- `robots.txt` e `sitemap.ts`. `/convidados` marcada como `noindex`.

## 9. PROIBIDOS (sinais de template genérico — motivo de refação)
- Fundo dourado chapado, botão com gradiente dourado "brilhante" e sombra amarela.
- Emoji como ícone (❤️, 📍, 💍) em qualquer lugar da interface.
  **Única exceção:** o corpo de mensagens que saem para o WhatsApp (texto que o convidado
  envia no app dele, nunca renderizado no DOM do site). Emoji em botão, rótulo, toast,
  estado vazio, título ou qualquer nó da página continua proibido.
- Bordas douradas grossas (> 2px), molduras "art déco" prontas, ornamentos florais de banco.
- Cards todos iguais, mesmo raio, mesma sombra cinza, grade monótona de 3×3.
- Fade-in + slide-up disparando em cada elemento a cada rolagem.
- Texto de marketing ("Celebre conosco este momento mágico e inesquecível!"). A voz é
  do casal: simples, calorosa, direta. Botão diz o que acontece: "Confirmar presença",
  "Copiar código PIX", "Enviar comprovante".
- Fonte script em parágrafos, botões ou rótulos (só no "&" e na assinatura).
- `<select>` nativo cinza para "vai comparecer?".
- Tabela crua do shadcn sem densidade, alinhamento e estados.
- Lorem ipsum ou qualquer dado inventado apresentado como real — placeholder tem que
  parecer placeholder e estar listado em `docs/PENDENCIAS.md`.

---

## 10. Plano de execução por fases

Cada fase fecha com: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` verdes +
screenshots do Playwright em 390/768/1440 revisados por você contra as seções 3 e 9 +
commit com mensagem descritiva + atualização de `docs/DECISOES.md` e `docs/PENDENCIAS.md`.

### Fase 0 — Fundação
Projeto Next.js (App Router, TS strict, Tailwind v4, ESLint, `src/`, alias `@/*`) com pnpm.
Tokens da seção 3.2 em `@theme`. Fontes via `next/font`. `components/brand/`: `Monograma.tsx`
(SVG desenhável: as letras **J** e **D** em Cormorant 300 convertidas em path, com o **&**
em Pinyon Script menor e dourado entre elas; animável por `stroke-dasharray`),
`FileteDourado.tsx`, os 6 ícones próprios. `src/config/casamento.ts`.
Rota `/design-system` mostrando paleta, escala tipográfica, botões em todos os estados,
filete, monograma, ícones, card de presente e um card de convidado.
`scripts/screenshots.ts` (Playwright, 3 larguras, salva em `docs/qa/fase-N/`).
**Fechamento:** `/design-system` revisado contra a seção 9.

### Fase 1 — Dados, domínio e PIX
Tipos em `src/types`. Schemas zod. `lib/pix.ts` com o BR Code + CRC16 e **teste unitário com
payload conhecido**. `lib/ics.ts` (gerar `.ics` e link do Google Calendar). `lib/format.ts`
(BRL, telefone, data pt-BR). Camada `lib/db/` com a interface de dados e um adaptador
**em memória com seed** quando não houver `DATABASE_URL`, para a demo rodar sem banco.
(Se a Fase 1 já entregou uma camada `lib/firebase`, ela é substituída aqui.)
**Fechamento:** Vitest cobrindo pix (inclusive CRC), schemas e formatadores, com casos negativos.

### Fase 2 — Layout, navegação e abertura
Layout raiz, cabeçalho desktop, barra inferior mobile, rodapé, 404.
A animação de abertura do convite (3.5.1) com `sessionStorage`.
**Fechamento:** screenshots do layout vazio nas 3 larguras + teste de navegação (Playwright).

### Fase 3 — `/` o convite
Todas as seções da 6.1. Contagem regressiva com os 3 estados. Recorte de detalhe 21:9.
Acordeão acessível. "Adicionar à agenda" funcionando.
**Fechamento:** Lighthouse mobile ≥ 95; screenshots revisados; teste E2E da rolagem e dos CTAs.

### Fase 4 — `/presentear` e `/confirmar-presente/[id]`
Grade de presentes, estados, QR gerado na hora, copiar código, WhatsApp.
**Fechamento:** E2E "escolher presente → copiar código → abrir WhatsApp (link verificado)";
teste que valida o payload PIX da tela contra `lib/pix.ts`.

### Fase 5 — `/confirmar-presenca` e `/agradecimento`
Formulário em 3 passos, acompanhantes, idempotência, honeypot, erros, confete.
**Esta fase escreve as Route Handlers e o schema da seção 5**, com os testes de autorização.
Nada vai para produção com dado pessoal saindo de rota pública.
**Fechamento:** E2E do caminho feliz, do caminho "não vou", do telefone repetido e da
falha de rede (mock); teste de teclado do início ao fim sem mouse.

### Fase 6 — `/convidados`
Contadores, busca, filtros, cartões no celular e tabela no desktop, agrupamento, CSV,
máscara de telefone com PIN, realtime, estados vazio/erro/carregando.
**Fechamento:** E2E "confirmar presença em uma aba → aparecer na lista em outra";
teste do CSV; screenshots 390 (prioridade máxima), 768 e 1440.

### Fase 7 — Polimento, QA final e entrega
1. QA exploratório em 320/390/768/1024/1440: textos cortados, scroll horizontal, foco,
   contraste, estados vazios, teclado do celular, iOS safe-area.
2. Passar **cada tela** pela lista de PROIBIDOS (seção 9) e corrigir o que estiver genérico.
3. Code review do diff inteiro: duplicação, `any`, client components desnecessários,
   regra de negócio fora de `lib/`.
4. OG image, manifest, favicon, sitemap, robots, `noindex` em `/convidados`.
5. `README.md` com: como rodar, variáveis de ambiente, como editar `casamento.ts`,
   como publicar, e um **roteiro de 2 minutos** para o casal navegar na demo.
6. Entregar relatório com as saídas dos comandos e a pasta `docs/qa/`.

---

## 11. Pendências do cliente (preencher antes da Fase 3)
Manter em `docs/PENDENCIAS.md` e cobrar:
**Já temos** (estão em `casamento.ts`): local, endereço, Google Maps, horário (16h30),
versículo, chave PIX, valores e nomes das três cotas.

**Confirmado pelo casal em 17/10/2026** — nada aqui bloqueia mais: data 21/12/2026
(segunda-feira, intencional), Colossenses 3:14, cotas Bronze 150 / Prata 200 / Ouro 250,
recebedora "Jaqueline Barros Alvares", WhatsApp igual à chave PIX, cerimônia e recepção
no Espaço Max às 16h30, e **uma única foto disponível, sem previsão de outras**.

**Resolvidos (histórico):**

**Bloqueiam a Fase 3 mas têm plano B (placeholder honesto):**
- [ ] 3 a 5 marcos de "nossa história" (ano + título + uma frase). **Só texto.**
- [ ] Traje / dress code.
- [ ] Prazo para confirmação de presença e limite de acompanhantes.