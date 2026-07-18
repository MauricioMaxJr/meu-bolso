# MEU BOLSO: VISÃO DO PRODUTO

App pessoal de finanças do Mauricio, em formato PWA, 100% offline e privado:
nenhum dado sai do aparelho (tudo em localStorage). Foi construído em cima do
esquema salarial real dele (base fixa por tempo de função + prêmio por meta) e
responde três perguntas todo mês:

1. **Quanto entrou e quanto saiu?** (Renda, Custos)
2. **Quanto devo guardar este mês?** (motor de recomendação, com piso de pior cenário)
3. **Estou evoluindo?** (metas, contas, relatórios mês a mês)

O ciclo de uso: registrar o salário do mês, lançar custos, aportar nas metas e
**gravar o mês** (congela um snapshot imutável e soma os aportes às metas).

## Estado dos sistemas

| Sistema | Estado | Capítulo do manual |
|---|---|---|
| Motor de salário (INSS, IRRF, prêmios) | Pronto (tabelas 2026, validado com folha 2025) | [manual/01-motor-salario.md](manual/01-motor-salario.md) |
| Motor de recomendação (quanto guardar) | Pronto | [manual/02-motor-recomendacao.md](manual/02-motor-recomendacao.md) |
| Meses, registro e gravação (snapshot) | Pronto | [manual/03-meses-e-gravacao.md](manual/03-meses-e-gravacao.md) |
| Custos, categorias e orçamentos | Pronto | [manual/04-custos-categorias-orcamentos.md](manual/04-custos-categorias-orcamentos.md) |
| Metas, aportes e contas | Pronto | [manual/05-metas-aportes-contas.md](manual/05-metas-aportes-contas.md) |
| Dicas (alertas inteligentes) | Pronto | [manual/06-dicas.md](manual/06-dicas.md) |
| Relatórios (4 gráficos + tabelas) | Pronto | [manual/07-relatorios.md](manual/07-relatorios.md) |
| Dados, backup, migração e PWA | Pronto | [manual/08-dados-backup-pwa.md](manual/08-dados-backup-pwa.md) |
| Importar holerite (PDF vira dados) | Pronto (parser validado nos 67 reais) | [manual/09-importar-holerite.md](manual/09-importar-holerite.md) |
| Mapa (consultor de previsibilidade) | Pronto | [manual/10-mapa-consultor.md](manual/10-mapa-consultor.md) |

## Contratos e ordem de trabalho

- Paridade com a calculadora original: [paridade/calculadora.md](paridade/calculadora.md)
- Próximos passos e ordem de execução: [ROADMAP.md](ROADMAP.md)
- Livro-Razão dos números canônicos (gerado pelo `verificar`): `canonicos.json`

## Régua de qualidade

- O **código é a fonte da verdade**; o manual descreve o código, e o
  `verificar.mjs` acusa quando divergem.
- Nada é "pronto" sem: `node verificar.mjs` VERDE + teste real no navegador.
- Linguagem da TELA: simples, uma palavra por conceito. Linguagem dos DOCS:
  exaustiva, para reconstruir o produto só de ler.
