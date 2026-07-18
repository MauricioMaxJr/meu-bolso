# 05. METAS, APORTES E CONTAS

Fonte no código: `app.js`, `dlgMeta`, `renderMetas`, `metaReserva`, `dlgConta`,
`renderContas`, `gravarMes`/`reabrirMes` (efeito dos aportes).

## 1. Metas (`S.metas`)

Campos: nome, ícone, `alvo` (R$; 0 = só acumular, sem barra), `guardado`
(editável, para importar saldo já existente), `prazo` (mês/ano, opcional) e
dois marcadores especiais:

- `tipoReserva`: a reserva de emergência. **Única**: marcar uma desmarca as
  outras. Tem borda destacada, selo "reserva", prioridade nos aportes
  sugeridos e alimenta o `reservaOk` do motor (capítulo 02). O atalho "Criar
  agora" cria com alvo `essenciaisReferencia × reservaMeses` (fallback 30.000)
  e a coloca no topo da lista.
- `tipoInvest`: investimentos, acumular sem alvo. Atalho "Criar agora" com
  ícone trending-up e alvo 0.

Com `alvo > 0`: barra de progresso e "% concluído". Com prazo: mostra quanto
falta por mês (`falta / meses restantes`) ou "prazo vencido, faltam R$ X".

## 2. Aportes do mês (`mes.aportes`)

Na tela Metas, um campo por meta (desabilitado em mês gravado). Digitar salva
direto (`[{ metaId, valor }]`); zero remove o aporte. "Usar sugestão do motor"
preenche pela prioridade do capítulo 02. **Os aportes só viram patrimônio ao
GRAVAR o mês** (somam em `meta.guardado`); reabrir devolve. Isso garante que o
histórico de guardado por mês seja sempre reconstruível pelos snapshots.

## 3. Contas (`S.contas`): onde o dinheiro está

Fotografia manual dos saldos (banco, caixinha, corretora): nome, ícone, saldo
atual (nunca negativo: validação nativa min=0 e clamp `Math.max(0, saldo)`).
Card com total e contagem. Sem lançamentos: o usuário atualiza quando quiser.
Ao gravar um mês, `contasTotal` fica no snapshot (série histórica futura).

## 4. Invariantes conferidas em teste E2E

- Reserva única: nunca existem duas metas com `tipoReserva`.
- `guardado` nunca fica negativo (clamp na reabertura e na edição).
- Gravar/reabrir n vezes não duplica nem perde aportes.
- Excluir meta com aportes pendentes no mês: o aporte fica órfão e é ignorado
  com segurança (busca por id não encontra e segue).
