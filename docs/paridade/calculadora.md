# PARIDADE: calculadora-salario.html × app (Meu Bolso)

Contrato de fidelidade entre a calculadora original (fonte:
`E:\Projetos\salario-azzas\calculadora-salario.html`, fora do repo) e o app.
O `verificar.mjs` confere as CONSTANTES automaticamente quando a calculadora
está ao lado do repo; este documento cobre o inventário completo.

## Motor (tem de ser idêntico, conferido automaticamente)

| Item | Calculadora | App | Status |
|---|---|---|---|
| `INSS_FAIXAS` (4 faixas 2026) | sim | sim | idêntico (verificar) |
| `TETO_INSS` = 988,09 | sim | sim | idêntico (verificar) |
| `IRRF_FAIXAS` (5 faixas) | sim | sim | idêntico (verificar) |
| `FAIXAS_META` (8 × 3 prêmios) | sim | sim | idêntico (verificar) |
| `MESES_ESPECIAIS` = [6, 8, 11] | sim | sim | idêntico (verificar) |
| Ordem do cálculo (bruto, INSS, IRRF sobre bruto-INSS, outros) | `calculaTipo` | `calculaSalario` | idêntico |
| Arredondamento `round2` | sim | sim | idêntico |

## Funcionalidades da calculadora × onde vivem no app

| Funcionalidade da calculadora | No app | Observação |
|---|---|---|
| Seleção de base (4 faixas de tempo) | Renda > Base salarial | igual |
| % de entrega com slider (60 a 140) | campo numérico (0 a 200) | app sem slider, por decisão de UI |
| Mês do ano (com ★/★★) | mês visível na topbar | o app usa o mês navegado |
| Outros descontos fixos | Configurações > Outros descontos da folha | padrão 160 |
| Resultado bruto/líquido + composição (barra) | Renda > resumo do salário | app resume em linhas |
| Tabela "Onde seu salário pode chegar" (evolução por base × tipo de mês) | não existe | EXCLUSIVO da calculadora |
| Tabela de faixas de prêmio com linha destacada | não existe (tabela vive no manual 01) | consulta na calculadora |
| Seção "Como funcionam os descontos" | manual/01 | didática na calculadora |
| 13º (duas parcelas, `calcula13`) | não existe no app | EXCLUSIVO da calculadora; ROADMAP item 5 |
| Férias (1/3, abono) | não existe no app | idem |
| Projeção anual (12 folhas + 13º) | não existe no app | idem |

## O que o app tem além da calculadora

Meses reais com registro e snapshot, custos, categorias, orçamentos, metas,
reserva, aportes, contas, dicas, relatórios, backup, PWA offline. A calculadora
segue sendo a REFERÊNCIA DIDÁTICA do esquema salarial e o simulador de
cenários; o app é a operação do dia a dia.

## Regra de manutenção

Toda mudança de tabela (INSS, IRRF, prêmios) é feita NOS DOIS arquivos no mesmo
commit/sessão, e o `verificar` prova a paridade. Última sincronização: tabelas
INSS 2026, jul/2026.
