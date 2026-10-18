# Pendências do cliente

Vocabulário obrigatório (briefing 4), igual no código, nos selos e aqui — nunca um pelo outro:

- **a confirmar** — o dado chegou, mas há dúvida. Está no site com o valor enviado e o selo
  "a confirmar". No código: `casamento.aConfirmar`.
- **a definir** — o dado não existe. O lugar dele mostra o que falta, com o selo "a definir".
  No código: `pendente("...")`.

As duas listas, sempre atualizadas a partir do config, estão em `/design-system#pendencias`.

**Prazo:** antes da Fase 3 (montagem da página do convite).

## Já temos (em `casamento.ts`)

Nomes (Jaqueline & Diorlando), local (Espaço Max), endereço, link do Google Maps, horário
(a partir das 16h30), versículo, chave PIX (telefone), cidade do PIX, WhatsApp, nomes e
valores das três cotas, foto do casal.

## A confirmar — bloqueiam a Fase 3

| # | Dúvida | Valor hoje no site | Por quê |
|---|--------|--------------------|---------|
| C1 | **Ano do casamento** | 21/12/2026, 16h30 | 21/12/2026 cai numa **segunda-feira**. Confirmar se é 2026 mesmo. |
| C2 | **De-para das cotas** | Bronze R$ 150 · Prata R$ 200 · Ouro R$ 250 | A ordem que o cliente mandou invertia Bronze e Prata; usamos a hierarquia natural. |
| C3 | **Nome do recebedor do PIX** exatamente como no extrato (máx. 25 caracteres, sem acento) | `JAQUELINE` | O banco de quem paga mostra o nome cadastrado no DICT e ignora o do QR (manual do BC, nota 26); o campo só precisa ter até 25 caracteres ASCII. Confirmar mesmo assim, para o código copia-e-cola ficar coerente. |
| C4 | **WhatsApp para comprovantes** é o mesmo número da chave PIX? | `55 98 99967-6346` | — |
| C5 | **Cerimônia religiosa**: é no Espaço Max ou em outro endereço/horário? | Mesmo local | Se for outro lugar, a página passa a mostrar dois cards (já preparado no tipo `Local`). |
| C6 | Referência do versículo | Colossenses 3:14 | O cliente escreveu "3.4"; o texto enviado corresponde a 3:14. |
| C7 | Limite de acompanhantes por convidado | 4 | Valor de exemplo do briefing, marcado com dúvida. |

## A definir — têm plano B (placeholder honesto)

| # | Item | Onde entra | Plano B enquanto não chega |
|---|------|------------|----------------------------|
| P1 | 3 a 5 marcos de "nossa história" (ano, título, uma frase) | "Nossa história" | 3 marcos com placeholder visível |
| P2 | 6 a 10 fotos para a galeria | Galeria, história | Só a foto do casal, em composições diferentes. Nunca banco de imagem. |
| P3 | Traje / dress code (a descrição; o título "Traje social" já veio) | "Trajes" | Placeholder na descrição |
| P4 | Prazo para confirmar presença | RSVP | Placeholder no "Confirme até" |
| P5 | Perguntas frequentes (4 a 6) | "Dúvidas frequentes" | Placeholder |
| P6 | Uma frase do casal para cada cota (Bronze, Prata, Ouro) | Cards de `/presentear` | Placeholder na frase |
| P7 | Sobrenomes, se quiserem no rodapé | Rodapé | Opcional: sem sobrenome, o rodapé usa só os nomes |
| P8 | Lista de presentes nomeados, se houver além das cotas | `/presentear` | Só as três cotas |
| P9 | Horário de término da festa | "Adicionar à agenda" (.ics e Google Agenda) | A agenda usa 6 horas a partir do início (`DURACAO_PLANO_B_HORAS` em `lib/ics.ts`) |
| P10 | E-mails das duas contas de acesso a `/convidados` (Jaqueline e Diorlando) | Login dos noivos (briefing 6.6) | Contas criadas à mão no console do Firebase; na demonstração, login de exemplo |

## Pendências técnicas (do time, não do cliente)

| # | Item | Quando |
|---|------|--------|
| T1 | Teste das regras com `@firebase/rules-unit-testing` no emulador — **obrigatório** pelo briefing 5. Exige Java 11+ e firebase-tools (não instalados nesta máquina). Hoje há só a guarda estática. | Fase 5 |
| T2 | ~~Privacidade dos telefones~~ — resolvido pelo briefing (leitura só dos noivos). Leitura de `confirmacoes` já fechada no `firestore.rules` provisório. | Resolvido |
| T4 | UIDs das contas dos noivos em `.env`, injetados na regra por geração do arquivo. | Fase 5 |
| T5 | `NEXT_PUBLIC_RSVP_SALT` (sal do hash do telefone) e Firebase App Check (chave reCAPTCHA) para mitigar o risco residual do `rsvp_index`. | Fase 5 |
| T3 | Criar o projeto Firebase do casal e preencher `.env.local` (modelo em `.env.example`). Sem isso, o build de produção recusa rodar, a não ser com `NEXT_PUBLIC_MODO_DEMONSTRACAO=1` (preview para o casal). | Antes de publicar |
