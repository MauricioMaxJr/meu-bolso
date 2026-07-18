# 10. MAPA (consultor de previsibilidade)

Fonte no código: `app.js` (`renderMapa`, `mesesReais`) e a seção `tela-mapa`
do index.html. Nona tela do app, ícone de bússola. **Régua inegociável: tudo
pelo líquido que caiu na conta** (salários registrados/importados + outras
rendas), nunca pelo estimado.

## 1. Base de dados

`mesesReais()` = meses gravados OU com salário registrado (o que inclui os
importados por holerite). Filtro de período no topo: 12 meses, 24 meses ou
Tudo (persistido em `config.mapaPeriodo`). Sem nenhum mês real, a tela vira um
empty state com botão para a Renda.

## 2. Seu ritmo (indicadores do período)

- Líquido médio/mês: média de `calcMes(k).renda` dos meses do período.
- Custos médios/mês: média SÓ dos meses gravados (custo só existe confiável
  quando o mês foi gravado); sem nenhum gravado, usa o mês atual e marca
  "(estimado)".
- Guardando/mês: média do `aportado` dos gravados; fallback: recomendação do
  mês corrente.
- Taxa de poupança: guardando dividido pelo líquido médio.
- Rodapé declara a base: quantos meses reais e quantos com custos gravados.

## 3. Onde você chega (projeções)

Guardado hoje (soma das metas) + ritmo × horizonte: fim do ano corrente
(meses restantes contam o atual se ainda não gravado), 1, 3 e 5 anos. O texto
avisa: sem contar rendimentos; rendimento de investimento entra por cima.

## 4. Metas no ritmo atual

Para cada meta: ritmo próprio (média dos aportes àquela meta nos meses
gravados do período) e a previsão "completa em MÊS/ANO (N meses)". Sem alvo:
mostra acumulado e ritmo. Sem aporte histórico: "sem ritmo de aporte ainda".

## 5. Cenários e cortes

- Mantendo o ritmo; cortando 10% e 20% do estilo de vida (média dos custos não
  essenciais dos gravados); guardando R$ 500 a mais. Cada cenário mostra o
  novo ritmo e o efeito: data em que a reserva completa (se incompleta) ou o
  total em 1 ano.
- Maiores alavancas de corte: as 3 categorias não essenciais com maior média
  mensal no período. É o "onde cortar" com base no seu próprio histórico.

## 6. Ano a ano (líquido real)

Tabela por ano: meses com dado, líquido real somado, média/mês, custos e
guardado (somente dos gravados; anos só com holerites mostram "-"). Com o
histórico 2022 a 2026 importado, é o retrato fiel da evolução de renda.

## 7. Decisões de desenho (validadas)

- Custos médios nunca misturam meses sem lançamentos (só gravados): média de
  custo com zero artificial mentiria para baixo.
- Projeção linear e conservadora, sem juros compostos: o app promete o que
  depende do usuário; rendimento é bônus.
- O Mapa lê os mesmos dados das outras telas (calcMes, metas, aportes): zero
  contradição entre telas.
