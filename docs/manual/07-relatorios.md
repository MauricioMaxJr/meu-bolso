# 07. RELATÓRIOS

Fonte no código: `app.js`, `renderRelatorios`, `mesesComDados`, `rotuloCurto`,
`tipShow`/`tipHide`/`ligaTooltips`. Gráficos em SVG puro, sem biblioteca,
com a paleta validada nas variáveis CSS `--s1` (azul, renda/linhas) e `--s6`
(vermelho, custos), mais `--chart-grid`, `--chart-axis`, `--chart-muted`.

## 1. Quais meses aparecem

`mesesComDados()`: todos os meses gravados, mais o mês visível (mesmo aberto),
ordenados, limitados aos últimos 12. Meses em aberto são marcados com `*` no
eixo e "(aberto)" na tabela.

## 2. Os quatro gráficos

1. **Renda × Custos por mês**: barras pareadas (renda azul, custos vermelho),
   grade em terços, tooltip por barra, legenda com nota do `*`. Inclui
   "Ver como tabela": Mês, Renda, Custos, Saldo (nunca negativo na exibição),
   Guardado, com linha de total do período.
2. **Custos por categoria (mês visível)**: barras horizontais ordenadas,
   normalizadas pela maior, com total e % de essenciais no rodapé.
3. **Evolução do guardado**: linha com um ponto por mês gravado
   (`snapshot.guardadoTotal`); precisa de 2+ pontos, senão empty state
   "Grave 2 meses para ver seu dinheiro crescer".
4. **Taxa de poupança**: linha `aportado / renda` (%) dos meses gravados com
   renda > 0; escala mínima de 25%; precisa de 2+ pontos.

## 3. Ano a ano

Painel extra que SÓ aparece com 2+ anos com meses gravados: tabela Ano, Meses,
Renda, Custos, Guardado (somas dos snapshots).

## 4. Tooltips

`data-tip` + eventos mousemove/mouseleave (desktop) e click com auto-fechar em
2,2s (celular). Posição limitada à largura da janela.

## 5. Regras de exibição

- Largura dos gráficos: `min(700, meses × 74)` com mínimo 320 e rolagem
  horizontal no contêiner (nunca estoura a página).
- Barras com altura mínima de 1px para nunca "sumirem" com valores pequenos.
- Rótulos de mês no formato `JUL/26`, sempre maiúsculos.
