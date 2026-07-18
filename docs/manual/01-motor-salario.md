# 01. MOTOR DE SALÁRIO

Fonte no código: `app.js`, bloco `MOTOR DE SALÁRIO` (constantes `INSS_FAIXAS`,
`TETO_INSS`, `IRRF_FAIXAS`, `FAIXAS_META`, `MESES_ESPECIAIS` e funções
`calcINSS`, `calcIRRF`, `tipoDoMes`, `faixaDaMeta`, `calculaSalario`).
A calculadora original (`calculadora-salario.html`, fora do repo) usa as mesmas
constantes; o `verificar.mjs` confere a paridade automaticamente.

## 1. Esquema salarial (regras da empresa, validadas na folha real de 2025)

**Salário bruto do mês = base fixa + prêmio por meta.**

### Base fixa, por tempo na função

| Tempo na função | Base |
|---|---|
| Até 2 anos | R$ 10.000 |
| 2 a 4 anos | R$ 12.000 |
| 4 a 6 anos | R$ 14.000 |
| 6 anos ou mais | R$ 16.000 |

Observação real: em folha a base pode vir um pouco maior por dissídio (em 2025,
a faixa de R$ 12.000 era paga como R$ 12.208,00 e passou a R$ 12.556,32 em
outubro). O app usa a base nominal; o valor real pode ser ajustado manualmente
no registro do salário (capítulo 03).

### Prêmio por atingimento de meta

Três calendários: meses **normais**, meses **especiais** (junho, agosto e
novembro; `MESES_ESPECIAIS = [6, 8, 11]`) e **dezembro** (o mais forte).
Abaixo de 80% não há prêmio (`faixaDaMeta` devolve null). A faixa é escolhida
pelo maior `min` que o % alcança; acima de 120% vale a última faixa.

| Meta atingida | Mês normal | Jun, Ago, Nov | Dezembro |
|---|---|---|---|
| 80 a 84% | 0 | 0 | R$ 15.000 |
| 85 a 89% | R$ 1.500 | R$ 1.500 | R$ 20.000 |
| 90 a 94% | R$ 6.000 | R$ 8.000 | R$ 25.000 |
| 95 a 99% | R$ 7.500 | R$ 10.000 | R$ 30.000 |
| 100 a 104% | R$ 10.000 | R$ 12.000 | R$ 35.000 |
| 105 a 109% | R$ 12.000 | R$ 14.000 | R$ 40.000 |
| 110 a 119% | R$ 14.000 | R$ 17.000 | R$ 45.000 |
| 120% ou mais | R$ 15.000 | R$ 20.000 | R$ 50.000 |

Propriedade garantida pelo `verificar`: os prêmios são monotônicos (mais meta
nunca paga menos, nas três colunas).

## 2. Descontos (incidem sobre o bruto TOTAL, base + prêmio)

Conferido nos demonstrativos reais de 2025: a "Base de Cálculo IRRF" da folha é
sempre salário + prêmio. Ordem do cálculo em `calculaSalario`:

1. `bruto = base + premio`
2. `inss = calcINSS(bruto)` (progressivo, trava no teto)
3. `irrf = calcIRRF(bruto - inss)` (tabela mensal, parcela a deduzir)
4. `liquido = bruto - inss - irrf - outrosDescontos` (arredondado a 2 casas)

### INSS (vigência 2026, faixas da Portaria MPS/MF nº 13/2026)

| Faixa (até) | Alíquota |
|---|---|
| R$ 1.621,00 | 7,5% |
| R$ 2.902,84 | 9% |
| R$ 4.354,27 | 12% |
| R$ 8.475,55 | 14% |

Teto de desconto: **R$ 988,07**, o valor PRATICADO na folha. A soma oficial
das parcelas dá R$ 988,09, mas a ADP trunca cada parcela antes de somar
(121,57 + 115,36 + 174,17 + 576,97 = 988,07). Validado nos 6 demonstrativos
de jan a jun/2026 em 18/07/2026. Como o bruto deste esquema sempre supera o
teto da tabela, o INSS trava no teto todo mês (em 2025 era R$ 951,62).

### IRRF (tabela mensal desde mai/2025, mantida em 2026 pela Lei 15.191/2025)

| Base (até) | Alíquota | Parcela a deduzir |
|---|---|---|
| R$ 2.428,80 | 0% | 0 |
| R$ 2.826,65 | 7,5% | R$ 182,16 |
| R$ 3.751,05 | 15% | R$ 394,16 |
| R$ 4.664,68 | 22,5% | R$ 675,49 |
| Acima | 27,5% | R$ 908,73 |

**Desvio do real, intencional e documentado:** o redutor da Lei 15.270/2025
(isenção até R$ 5.000 e desconto parcial até R$ 7.350) NÃO está implementado,
porque a renda tributável deste esquema (mínimo: base 10.000 menos INSS) nunca
fica abaixo de R$ 7.350. Sem dependentes, sem pensão: cenário do usuário.

### Outros descontos fixos da folha

Valor livre configurado pelo usuário (`config.descFolha`, padrão R$ 160):
odonto (~R$ 10,93), vale-transporte (R$ 99 a R$ 297 em 2025), contribuição
assistencial (R$ 50/mês de set a dez/2025). FGTS não é desconto (8% só sobre a
base, depositado pelo empregador).

## 3. Números de referência (selados no canonicos.json)

Caso canônico, base R$ 14.000, meta 100%, mês normal, outros R$ 160:
bruto **R$ 24.000,00**, INSS **R$ 988,07**, IRRF **R$ 5.419,55**,
líquido **R$ 17.432,38**.

Piso (pior cenário: 0% de meta, sem prêmio), com outros R$ 160:

| Base | Piso líquido |
|---|---|
| R$ 10.000 | R$ 7.282,38 |
| R$ 12.000 | R$ 8.732,38 |
| R$ 14.000 | R$ 10.182,38 |
| R$ 16.000 | R$ 11.632,38 |

Melhor cenário do ano (base 14.000, 120%+, dezembro): bruto R$ 64.000,00 e
líquido R$ 46.432,38.

Regra rápida de previsibilidade (medida na folha 2025): descontos entre 26,7% e
28,0% do bruto, média ≈ 27,4% (líquido ≈ 72,6% do bruto).

## 4. 13º e férias (só na calculadora original, fora do app)

- 13º segue SÓ a base (prêmio não integra): 1ª parcela em novembro (metade da
  base, sem descontos) e 2ª em dezembro (base cheia menos INSS e IRRF próprios
  do 13º, menos a 1ª parcela). Função `calcula13` da calculadora.
- Férias: adiantadas (salário do período + 1/3; + abono se vender 10 dias); o
  mês seguinte parece "baixo" porque o adiantamento é descontado.
- No app, esses valores entram como ajuste manual do salário do mês ou como
  "Outras rendas" (categorias Férias e 13º existem prontas).

## 5. Histórico de vigências (extraído dos 67 demonstrativos reais, 2022 a 2026)

| Período | INSS teto na folha | IRRF | Status |
|---|---|---|---|
| 2022 | R$ 828,38 (fev: 825,47, base abaixo do teto) | tabela da época | histórico (era gerente até mar/2022) |
| 2023 | R$ 876,95; a partir de abr: R$ 877,22 | tabela da época | histórico |
| 2024 | R$ 908,85 | tabela fev/2024 | histórico |
| 2025 (fev a dez) | R$ 951,62 (oficial 951,63) | tabela mai/2025 | validado centavo a centavo na folha |
| 2026 (jan a jun) | R$ 988,07 (oficial 988,09) | mesma tabela (Lei 15.191/2025) | VIGENTE, validado na folha em 18/07/2026 |

Padrão confirmado: a ADP trunca cada parcela do INSS antes de somar, por isso
o valor da folha fica 2 centavos abaixo da soma oficial. O motor usa sempre o
valor praticado na folha.

Fato da folha 2026 (importante): a base em folha continua R$ 12.556,32 (faixa
nominal de R$ 12.000 com o dissídio de out/2025) até jun/2026, com prêmios
pagos normalmente (ex.: jun/2026 = R$ 8.000, faixa 90 a 94% de mês especial).
"Outros descontos" reais de jun/2026: R$ 459,93 (Amil 10,93 + assistencial
50,00 + vale alimentação adicional 124,00 + vale transporte 275,00). O padrão
histórico do desconto de vale transporte varia mês a mês.
