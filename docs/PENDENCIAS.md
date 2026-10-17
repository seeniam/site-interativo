# Pendências do cliente

Duas listas. Os itens **a confirmar** já estão no site com o valor que o casal enviou, mas
têm uma dúvida aberta. Os itens **pendentes** não foram enviados: no código são
`pendente("...")` em `src/config/casamento.ts` e aparecem como placeholder visível.
A lista completa e sempre atualizada dos pendentes está em `/design-system#pendencias`.

**Prazo:** antes da Fase 3 (montagem da página do convite).

## Já temos (em `casamento.ts`)

Nomes (Jaqueline & Diorlando), local (Espaço Max), endereço, link do Google Maps, horário
(a partir das 16h30), versículo, chave PIX (telefone), cidade do PIX, WhatsApp, nomes e
valores das três cotas, limite de 4 acompanhantes, foto do casal.

## A confirmar — bloqueiam a Fase 3

| # | Dúvida | Valor hoje no site | Por quê |
|---|--------|--------------------|---------|
| C1 | **Ano do casamento** | 21/12/2026, 16h30 | 21/12/2026 cai numa **segunda-feira**. Confirmar se é 2026 mesmo. |
| C2 | **De-para das cotas** | Bronze R$ 150 · Prata R$ 200 · Ouro R$ 250 | A ordem que o cliente mandou invertia Bronze e Prata; usamos a hierarquia natural. |
| C3 | **Nome do recebedor do PIX** exatamente como no extrato (máx. 25 caracteres, sem acento) | `JAQUELINE` | Nome divergente do cadastro faz alguns bancos alertarem o pagador. |
| C4 | **WhatsApp para comprovantes** é o mesmo número da chave PIX? | `55 98 99967-6346` | — |
| C5 | **Cerimônia religiosa**: é no Espaço Max ou em outro endereço/horário? | Mesmo local | Se for outro lugar, a página passa a mostrar dois cards (já preparado no tipo `Local`). |
| C6 | Referência do versículo | Colossenses 3:14 | O cliente escreveu "3.4"; o texto enviado corresponde a 3:14. |
| C7 | Limite de acompanhantes por convidado | 4 | Valor de exemplo do briefing, marcado com dúvida. |

## Pendentes — têm plano B (placeholder honesto)

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
