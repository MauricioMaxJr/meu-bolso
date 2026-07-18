# 06. DICAS (alertas inteligentes)

Fonte no código: `app.js`, `gerarDicas` e `dicaHTML`. Aparecem completas na
tela Dicas e as 3 primeiras no painel do Início.

## 1. Níveis e ordem

`critical` (Crítico) > `warning` (Atenção) > `info` (Info) > `good` (Em dia).
A lista é sempre ordenada da mais grave para a mais leve.

## 2. Regras, na ordem do código

| Nível | Gatilho | Texto (essência) |
|---|---|---|
| info | salário do mês não registrado (mês aberto) | "Registre em Renda para entrar no mês" |
| critical | essenciais > piso | "Essenciais (X) acima do piso (Y). Reveja os custos fixos" |
| critical | saldo do mês < 0 | "Mês no vermelho: custos X × renda Y" |
| warning | gasto da categoria > orçamento | "Categoria: X de Y, orçamento estourado" (uma por categoria) |
| warning | custos não essenciais > 30% da renda | "Estilo de vida acima de 30% da renda" |
| warning | assinaturas > 5% da renda | "Assinaturas: X/mês = Y/ano. Maior: nome" |
| info | assinaturas <= 5% da renda (e > 0) | "Assinaturas: X/mês (Y/ano)" |
| warning | categoria 30%+ acima da média dos 3 últimos meses gravados (média > R$ 100, mínimo 2 meses gravados) | "Categoria N% acima da média (X × média)" |
| info | sem meta de reserva | "Sem reserva de emergência. Alvo sugerido: X. Crie em Metas" |
| info | reserva incompleta | "Reserva: X de Y (Z%)" |
| good | reserva completa | "Reserva de emergência completa (X)" |
| critical | fixo com lembrete, não pago, vencido (só no mês corrente) | "Nome venceu dia D (X)" (um por conta) |

## 3. Detalhes de implementação

- A comparação com a média usa os snapshots (meses gravados), excluindo o mês
  em análise; precisa de pelo menos 2 meses gravados.
- Em mês gravado as dicas leem o snapshot: o passado não muda.
- "Tudo em ordem." aparece quando nenhuma dica é gerada (empty state).
