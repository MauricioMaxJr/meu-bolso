# 03. MESES, REGISTRO DE SALÁRIO E GRAVAÇÃO

Fonte no código: `app.js`, funções `chaveHoje`, `getMes`, `addMeses`,
`fixosDoMes`, `calcMes`, `gravarMes`, `reabrirMes`, `dlgSalario`.

## 1. O mês como unidade

- Chave de mês: `"AAAA-MM"` (ex.: `2026-07`). Navegação pelo topo (setas),
  `addMeses` cuida das viradas de ano (testado nas bordas).
- **Criação preguiçosa**: `getMes(chave)` cria o mês na primeira visita, com
  `status: "aberto"`, salário não registrado (`pctMeta: 100`), listas vazias.
  Por isso `S.meses` sempre contém o mês visível, mesmo "vazio".
- Estados: `aberto` (tudo editável) e `gravado` (imutável, com snapshot).

## 2. Registro do salário (regra central do produto)

**Sem registro, o salário NÃO entra na renda do mês** (`salLiq = 0`): evita
contar dinheiro que ainda não caiu. O registro (dialog na tela Renda ou botão
na tela Início) pede:

- `% da meta no mês` (grava em `mes.sal.pctMeta`);
- `Valor recebido (R$)`: pré-preenchido com a estimativa do motor. Se o usuário
  mantiver a estimativa (diferença < R$ 0,005), `valorReal = null` e o app
  segue o cálculo; se ajustar (férias, 13º, diferença de dissídio), grava
  `valorReal` e o resumo marca "(manual)".
- O registro pode ser editado ou removido enquanto o mês está aberto.

A base salarial (`config.salBase`) é global (muda com o tempo de casa), não por
mês: alterar a base muda a estimativa de todos os meses abertos; meses gravados
não mudam (snapshot).

## 3. Custos fixos dentro do mês

`fixosDoMes(chave)`: para mês aberto, parte de `S.custosFixos` (só `ativo`) e
aplica o estado mensal `mes.fixosStatus[id]`: `pago` (checkbox) e `valor`
(quando o fixo é `variavel`, marcar como pago abre o dialog "Valor de X neste
mês" e o valor do mês substitui o padrão SÓ naquele mês). Para mês gravado,
devolve os fixos congelados do snapshot.

## 4. Cálculo do mês (`calcMes`)

Para mês gravado devolve `snapshot.tot` direto (imutabilidade). Para aberto:

- `renda = salário (se registrado; valorReal quando manual) + outras rendas`
- `custos = fixos do mês + gastos avulsos`; `porCat` acumula por categoria
- `essenciais` = soma de `porCat` das categorias com `essencial: true`
- `piso` = `calculaSalario(base, 0, mes, descFolha).liquido`. Detalhe: para
  dezembro o código passa mês 1 no lugar de 12; com 0% de meta não há prêmio de
  qualquer forma, então o resultado é o mesmo (redundância inofensiva, mantida)
- `aportado` = soma dos aportes do mês; `saldo = renda - custos`

## 5. Gravar o mês (`gravarMes`)

Só aparece com salário registrado. Pede confirmação com o resumo e então:

1. Congela `snapshot = { tot, fixos, em: timestamp }` (cópia profunda).
2. `status = "gravado"`.
3. **Soma cada aporte à sua meta** (`meta.guardado += valor`).
4. Grava no snapshot `guardadoTotal` (soma de todas as metas) e `contasTotal`
   (soma dos saldos das contas), usados nos relatórios.

Em mês gravado a interface trava tudo: sem botões de adicionar/editar/excluir,
campos de salário desabilitados, checkboxes de pago desabilitados.

## 6. Reabrir o mês (`reabrirMes`)

Confirmação e então: **devolve os aportes** das metas (`guardado -= valor`,
nunca abaixo de 0), `status = "aberto"`, `snapshot = null`. Gravar de novo
resoma. Ciclo gravar/reabrir/gravar testado E2E: não duplica nem perde aportes.
