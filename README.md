# Jaqueline & Diorlando — convite de casamento

Site do casamento de 21/12/2026: o convite, a lista de presentes em PIX, a confirmação de presença e a
lista de convidados dos noivos. Next.js 16 (App Router), TypeScript, Tailwind v4, Postgres (Neon) acessado
**só pelo servidor**: o navegador nunca fala com o banco.

## Rodar no computador

Precisa de Node 24+ e pnpm 11.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Sem nenhuma variável de ambiente, o site sobe em **modo demonstração**: dados em memória com 12 respostas
fictícias, e a senha da lista de convidados é `demo`. Reiniciar o servidor volta ao estado inicial.

| Comando                                                | O que faz                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `pnpm qa:fase`                                         | O portão completo: formatação, lint, tipos, testes unitários, build e E2E      |
| `pnpm test`                                            | Testes unitários (em dois fusos: Tóquio e Nova York)                           |
| `pnpm build && pnpm test:e2e`                          | E2E com Playwright em 390, 768 e 1440 px                                       |
| `pnpm qa:screenshots --fase N --rotas "/,/presentear"` | Screenshots em `docs/qa/fase-N/`                                               |
| `pnpm gerar:imagens`                                   | Regera o cartão do WhatsApp e os ícones (depois de trocar foto, nomes ou data) |

## Variáveis de ambiente

Todas são do servidor; **nenhuma tem prefixo `NEXT_PUBLIC_`**. Modelo em `.env.example`.

| Variável        | Para quê                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`  | Connection string do Postgres. Na Vercel, o Marketplace (Neon) preenche sozinho.                                                                   |
| `SENHA_NOIVOS`  | Senha única dos noivos para `/convidados` (mínimo 8 caracteres). Trocar a senha derruba as sessões abertas.                                        |
| `SESSAO_SECRET` | Assina o cookie de sessão (mínimo 32 caracteres aleatórios).                                                                                       |
| `RSVP_SALT`     | Sal do hash do telefone (mínimo 16). **Não troque depois de publicar**: as respostas antigas deixariam de ser reconhecidas no "você já confirmou". |
| `DEMO`          | `true` força o modo demonstração mesmo com banco (bom para um preview para o casal).                                                               |

Para gerar os segredos: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Na produção da Vercel, faltar o banco é **erro** (a não ser com `DEMO=true`): as respostas reais nunca vão para
a memória.

## Editar o conteúdo

Tudo o que aparece no site sai de dois arquivos:

- **`src/config/casamento.ts`**: data, local, versículo, PIX, WhatsApp, cotas de presente (em
  `src/config/presentes.ts`), trajes, FAQ e os dados ainda **a definir**.
  - Um dado que ainda não existe se escreve `pendente("descrição")`. O site mostra um placeholder com o selo
    "a definir" e o item aparece em `/design-system`. Quando o casal mandar o dado, troque pelo valor.
  - Os dois "a definir" de hoje: marcos da nossa história e prazo para confirmar
    (`docs/PENDENCIAS.md`).
- **`src/config/textos.ts`**: todos os textos da interface, na voz do casal.

Se mudar os nomes ou as iniciais do monograma, regere os contornos (`scripts/extrair-glifos.ts`, as
instruções estão no topo do arquivo) e depois `pnpm gerar:imagens`.

## Publicar na Vercel

1. Suba o repositório para o GitHub.
2. Na Vercel: **Add New → Project**, importe o repositório (Next.js é detectado; o comando de build é o padrão).
3. No projeto, abra **Storage → Create Database → Neon (Postgres)** e conecte ao projeto, nos ambientes
   Production e Preview. A Vercel cria a `DATABASE_URL` sozinha.
4. **Rode o schema uma vez.** Em **Storage**, clique no banco e depois em **Open in Neon**. No **SQL Editor**,
   cole o conteúdo de `db/schema.sql` e execute. (Alternativa pelo terminal:
   `psql "$DATABASE_URL" -f db/schema.sql`.)
   **Banco já existente?** As mudanças de schema ficam em `db/migracoes/`, com a ordem certa escrita no
   topo de cada arquivo (ex.: `2026-10-18-remover-acompanhantes.sql` roda **depois** de publicar o site novo).
5. Em **Settings → Environment Variables**, crie `SENHA_NOIVOS`, `SESSAO_SECRET` e `RSVP_SALT` para Production.
   Para um preview de demonstração para o casal, crie `DEMO=true` só em Preview.
6. **Deployments → Redeploy** para as variáveis valerem.
7. Teste o caminho todo: confirme presença com o seu telefone, veja a resposta em `/convidados`, abra um PIX.
8. (Opcional) **Settings → Domains** para o domínio próprio. O cartão do WhatsApp e o sitemap usam o domínio
   de produção automaticamente.
9. Depois do primeiro deploy, meça no PageSpeed Insights (pendência T3).

## Roteiro de 2 minutos para mostrar ao casal

Abra o link de demonstração (preview com `DEMO=true`) no celular de um deles.

1. **O convite (30 s).** Na abertura, o monograma J & D se desenha sozinho. Role devagar: a foto e os nomes,
   o versículo, a contagem regressiva, "Quando e onde" com o mapa e o botão de
   agenda, trajes, presentes, dúvidas. Mostre os selos "a definir": é onde entram os dois dados que faltam.
2. **Presentear (30 s).** Toque em **Presentear**, escolha a **Cota Ouro**: o QR Code e o código PIX aparecem
   com o nome de Jaqueline como recebedora. Toque em **Copiar código PIX** e depois em **Enviar comprovante**: o
   WhatsApp abre com a mensagem pronta.
3. **Confirmar presença (30 s).** Toque em **Confirmar**. Nome, telefone, "Sim, estarei lá",
   "Quem convidou: Jaqueline", um recado. **Enviar resposta** leva ao "Obrigado!" com confete dourado.
4. **A lista dos noivos (30 s).** No rodapé, **Lista de convidados**, senha `demo`. A resposta que vocês
   acabaram de mandar já está lá, junto com as 12 respostas fictícias. Mostre os contadores, a busca, o chip
   **Por quem convidou**, **Mostrar telefones** e **Exportar CSV**, que abre direto no Excel.

## Onde está cada coisa

- `docs/BRIEFING.md`: o pedido do cliente.
- `docs/DECISOES.md`: decisões tomadas, premissas e discordâncias registradas.
- `docs/PENDENCIAS.md`: o que falta do casal e do time.
- `docs/qa/fase-N/`: screenshots de cada fase.
- `db/schema.sql`: as tabelas (rodar uma vez).
- `src/lib/`: regras de negócio, puras e testadas (PIX, RSVP, lista, CSV, sessão, banco).
- `src/app/api/`: as rotas. São a única porta para o banco.
